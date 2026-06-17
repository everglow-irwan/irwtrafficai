import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3500), // Exit phase
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-[#ef4444]/10 mix-blend-color-dodge" />
      
      <motion.div 
        className="absolute inset-0 border-[1vw] border-[#ef4444]/30"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: phase >= 1 ? [0.2, 0.5, 0.2] : 0, scale: 1 }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      <div className="text-center z-10">
        <motion.div
          className="text-[#ef4444] text-[8vw] mb-4"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          !
        </motion.div>
        <motion.h2 
          className="text-[4vw] font-bold text-white tracking-wide uppercase"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Deteksi Titik Macet
        </motion.h2>
        <motion.p
          className="text-[2.5vw] text-[#ef4444] mt-2 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          PARAH OTOMATIS
        </motion.p>
      </div>
    </motion.div>
  );
}