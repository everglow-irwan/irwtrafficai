import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SendMessageBody, CreateConversationBody } from "@workspace/api-zod";

const router = Router();

function getOpenAIClient(): OpenAI {
  const baseURL = process.env.MANTLE_BASE_URL;
  const apiKey = process.env.MANTLE_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error("MANTLE_BASE_URL and MANTLE_API_KEY must be set");
  }
  return new OpenAI({ baseURL, apiKey });
}

const TRAFFIC_SYSTEM_PROMPT = `Kamu adalah IrwTrafficAI — asisten AI cerdas khusus untuk memantau dan memandu lalu lintas Kota Medan, Indonesia.

Tugasmu:
1. Memberikan informasi tentang kondisi lalu lintas terkini di Kota Medan
2. Merekomendasikan rute alternatif yang lebih lancar
3. Memberikan perkiraan waktu tempuh
4. Menginformasikan titik-titik kemacetan parah
5. Memberikan tips berkendara di Medan

Konteks kondisi lalu lintas saat ini:
- Kemacetan parah: Jl. Sisingamangaraja, Jl. Imam Bonjol, Jl. Asia
- Arus sedang: Jl. Pemuda, Jl. HM Yamin, Jl. Jend. Sudirman
- Lancar: Ring Road Medan, Jl. Iskandar Muda, Jl. Diponegoro, Jl. Letjend Suprapto

Rute alternatif populer di Medan:
- Menuju pusat kota: Gunakan Jl. Iskandar Muda atau Ring Road lalu masuk via Jl. Gatot Subroto
- Menghindari Jl. Imam Bonjol: Gunakan Jl. Pemuda atau Jl. HM Yamin
- Menuju Bandara Kualanamu: Tol Belmera lebih cepat daripada jalan umum
- Menuju Helvetia: Via Jl. Letjend Suprapto lebih lancar dari Ring Road bagian utara

Selalu jawab dalam Bahasa Indonesia yang jelas dan informatif. Berikan rekomendasi yang spesifik dan praktis.`;

router.get("/ai/conversations", async (req, res) => {
  const convos = await db
    .select()
    .from(conversationsTable)
    .orderBy(conversationsTable.createdAt);
  res.json(
    convos.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

router.post("/ai/conversations", async (req, res) => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [convo] = await db
    .insert(conversationsTable)
    .values({ title: parsed.data.title })
    .returning();
  res.status(201).json({
    id: convo.id,
    title: convo.title,
    createdAt: convo.createdAt.toISOString(),
  });
});

router.get("/ai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [convo] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  res.json({
    id: convo.id,
    title: convo.title,
    createdAt: convo.createdAt.toISOString(),
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.delete("/ai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.status(204).send();
});

router.get("/ai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  res.json(
    msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

router.post("/ai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [convo] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  await db.insert(messagesTable).values({
    conversationId: id,
    role: "user",
    content: parsed.data.content,
  });

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: TRAFFIC_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: parsed.data.content },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: "mistral.mistral-large-3-675b-instruct",
      messages: chatMessages,
      stream: true,
      max_tokens: 2048,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI streaming error");
    res.write(`data: ${JSON.stringify({ error: "Gagal menghubungi AI. Coba lagi." })}\n\n`);
    res.end();
  }
});

export default router;
