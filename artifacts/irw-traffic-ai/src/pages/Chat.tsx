import { useState, useRef, useEffect } from "react";
import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
  useDeleteConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Jalan mana yang paling macet sekarang?",
  "Rute tercepat ke pusat kota Medan?",
  "Bagaimana kondisi Jl. Sisingamangaraja?",
  "Alternatif rute menghindari kemacetan?",
  "Kapan jam puncak kemacetan di Medan?",
];

export default function Chat() {
  const queryClient = useQueryClient();
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations, isLoading: convoLoading } = useListConversations({
    query: { queryKey: getListConversationsQueryKey() },
  });
  const createConvo = useCreateConversation();
  const deleteConvo = useDeleteConversation();

  const { data: activeConvoData } = useGetConversation(activeConvoId!, {
    query: {
      enabled: !!activeConvoId,
      queryKey: getGetConversationQueryKey(activeConvoId!),
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages, activeConvoData]);

  useEffect(() => {
    if (activeConvoData?.messages) {
      setStreamMessages(
        activeConvoData.messages.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
    }
  }, [activeConvoData]);

  async function handleNewConversation() {
    const convo = await createConvo.mutateAsync({
      data: { title: `Percakapan ${new Date().toLocaleTimeString("id-ID")}` },
    });
    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    setActiveConvoId(convo.id);
    setStreamMessages([]);
  }

  async function handleDeleteConvo(id: number) {
    await deleteConvo.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    if (activeConvoId === id) {
      setActiveConvoId(null);
      setStreamMessages([]);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    const trimmed = text.trim();
    setInput("");

    let convId = activeConvoId;
    if (!convId) {
      const convo = await createConvo.mutateAsync({
        data: { title: trimmed.slice(0, 50) },
      });
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      setActiveConvoId(convo.id);
      convId = convo.id;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setStreamMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed },
      { id: assistantMsgId, role: "assistant", content: "", streaming: true },
    ]);

    setIsStreaming(true);

    try {
      const response = await fetch(`/api/ai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.done) {
              queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(convId!) });
              break;
            }
            if (parsed.error) {
              accumulated = parsed.error;
            }
            if (parsed.content) {
              accumulated += parsed.content;
              setStreamMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulated } : m,
                ),
              );
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch {
      setStreamMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "Maaf, terjadi kesalahan. Coba lagi.", streaming: false }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
      setStreamMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)),
      );
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const displayMessages = streamMessages.length > 0 ? streamMessages : [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: Conversation list */}
      <aside className="w-52 flex-shrink-0 border-r border-border flex flex-col bg-card">
        <div className="px-3 py-3 border-b border-border">
          <button
            onClick={handleNewConversation}
            disabled={createConvo.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
            data-testid="button-new-conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Percakapan Baru
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {convoLoading ? (
            <div className="space-y-1 px-1">
              {[1, 2].map((i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
            </div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1.5 px-2 py-2 rounded cursor-pointer transition-colors ${
                  activeConvoId === c.id ? "bg-primary/15 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setActiveConvoId(c.id); }}
                data-testid={`conversation-item-${c.id}`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs truncate flex-1">{c.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-0.5"
                  onClick={(e) => { e.stopPropagation(); handleDeleteConvo(c.id); }}
                  data-testid={`button-delete-conversation-${c.id}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-muted-foreground px-2 py-2">Belum ada percakapan</p>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <header className="px-5 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Asisten AI Lalu Lintas</h1>
              <p className="text-[11px] text-muted-foreground">Tanya tentang rute & kemacetan Kota Medan</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground mb-1">IrwTrafficAI Siap Membantu</h2>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Tanyakan kondisi lalu lintas, rute alternatif, atau informasi kemacetan di Kota Medan.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Pertanyaan Umum</p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2 bg-card border border-border rounded-lg hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
                    data-testid={`suggested-question-${q.slice(0, 20).replace(/\s/g, "-")}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground text-sm"
                      : "bg-card border border-border text-foreground text-sm"
                  }`}
                >
                  {msg.streaming && msg.content === "" ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  {msg.streaming && msg.content !== "" && (
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-5 py-3 border-t border-border bg-card flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya tentang kondisi lalu lintas Medan... (Enter untuk kirim)"
              rows={2}
              disabled={isStreaming}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 transition-colors"
              data-testid="input-message"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
              data-testid="button-send-message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            IrwTrafficAI menggunakan data lalu lintas real-time Kota Medan
          </p>
        </div>
      </div>
    </div>
  );
}
