import { useState, useEffect } from 'react';

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const durationsList = Object.values(durations);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number;

    const playScene = (index: number) => {
      if (isCancelled) return;
      setCurrentScene(index);
      const duration = durationsList[index];
      
      if (duration) {
        timeoutId = window.setTimeout(() => {
          if (index === durationsList.length - 1) {
            // @ts-ignore
            window.stopRecording?.();
            playScene(0); // loop
          } else {
            playScene(index + 1);
          }
        }, duration);
      }
    };

    // @ts-ignore
    window.startRecording?.();
    playScene(0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [JSON.stringify(durationsList)]);

  return { currentScene };
}