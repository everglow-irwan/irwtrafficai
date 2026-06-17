import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000), // Question appears
      setTimeout(() => setPhase(2), 2000), // Answer starts
      setTimeout(() => setPhase(3), 4500), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.8, ease: "circOut" }}
    >
      <motion.div 
        className="text-[#00d4ff] font-mono text-[1.5vw] absolute top-[15vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Asisten AI Berbasis Mistral Large
      </motion.div>

      <div className="w-[60vw] flex flex-col gap-6">
        <motion.div 
          className="self-end bg-[#0a0e1a] border border-white/20 text-white px-8 py-4 rounded-t-2xl rounded-bl-2xl text-[2vw]"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring" }}
        >
          Jalan mana yang paling macet?
        </motion.div>

        <motion.div 
          className="self-start bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] px-8 py-4 rounded-t-2xl rounded-br-2xl text-[2vw] font-mono w-[80%]"
          initial={{ opacity: 0, x: -20 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            Saat ini, Jalan Gatot Subroto terpantau macet total dengan kecepatan rata-rata 10km/jam. Disarankan menggunakan rute alternatif via Jalan Gajah Mada.
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}