import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = { intro: 4000, map: 5000, alerts: 4000, chat: 5000, outro: 3500 };

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0e1a] text-white">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/neural-bg.png)` }}
          animate={{ scale: [1, 1.05, 1], filter: ['blur(0px)', 'blur(4px)', 'blur(0px)'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/80 to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="sync">
          {currentScene === 0 && <Scene1 key="intro" />}
          {currentScene === 1 && <Scene2 key="map" />}
          {currentScene === 2 && <Scene3 key="alerts" />}
          {currentScene === 3 && <Scene4 key="chat" />}
          {currentScene === 4 && <Scene5 key="outro" />}
        </AnimatePresence>
      </div>
    </div>
  );
}