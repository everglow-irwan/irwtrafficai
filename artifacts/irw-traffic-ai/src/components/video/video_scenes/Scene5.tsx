import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "circOut" }}
    >
      <div className="flex gap-12 mb-16">
        {[
          { val: '15+', label: 'Ruas Jalan' },
          { val: 'LIVE', label: 'TomTom API' },
          { val: 'AI', label: 'Powered' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
          >
            <div className="text-[5vw] font-bold text-[#00d4ff] leading-none">{stat.val}</div>
            <div className="text-[1.5vw] text-white/60 tracking-widest uppercase mt-2">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <h1 className="text-[6vw] font-black text-white tracking-tight">
          IrwTraffic<span className="text-[#00d4ff]">AI</span>
        </h1>
        <p className="text-[1.5vw] text-white/50 mt-4 font-mono">
          Made by Irwan, S.H.
        </p>
      </motion.div>
    </motion.div>
  );
}