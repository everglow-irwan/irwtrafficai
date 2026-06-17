import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500), // Exit phase
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "circOut" }}
    >
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}images/medan-map-dark.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />

      <motion.div 
        className="relative z-10 flex flex-col items-center text-center px-12"
      >
        <motion.div
          className="text-[#00d4ff] font-mono text-[2vw] tracking-[0.5em] mb-4 uppercase"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          System Initialize
        </motion.div>

        <h1 className="text-[7vw] font-black text-white leading-none tracking-tight">
          IrwTraffic<span className="text-[#00d4ff]">AI</span>
        </h1>

        <motion.div 
          className="h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent mt-8"
          initial={{ width: 0, opacity: 0 }}
          animate={phase >= 2 ? { width: '40vw', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        <motion.p 
          className="text-[2vw] text-white/80 mt-8 font-light"
          initial={{ opacity: 0, filter: 'blur(5px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(5px)' }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Pemantauan Lalu Lintas Real-Time Kota Medan
        </motion.p>
      </motion.div>
    </motion.div>
  );
}