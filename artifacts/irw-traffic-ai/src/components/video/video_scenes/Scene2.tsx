import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 4500), // Exit phase
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-[10vw]"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: "circOut" }}
    >
      <div className="w-[40%] flex flex-col justify-center">
        <motion.h2 
          className="text-[4vw] font-bold text-white leading-tight"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Data Real-Time
        </motion.h2>
        <motion.p 
          className="text-[2vw] text-[#00d4ff] mt-4 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          &gt; Powered by TomTom API
        </motion.p>
      </div>

      <div className="w-[50%] relative aspect-square">
        <motion.div 
          className="absolute inset-0 rounded-full border border-[#00d4ff]/30 border-dashed"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute inset-[10%] rounded-full border border-white/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Pulsing Dots */}
        {[
          { color: '#22c55e', top: '30%', left: '40%' },
          { color: '#eab308', top: '50%', left: '70%' },
          { color: '#f97316', top: '70%', left: '30%' },
          { color: '#ef4444', top: '40%', left: '60%' },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{ backgroundColor: dot.color, top: dot.top, left: dot.left }}
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 1 ? { scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] } : { scale: 0, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: phase >= 1 ? i * 0.2 : 0 }}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: dot.color }} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}