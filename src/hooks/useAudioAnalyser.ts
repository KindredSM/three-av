import { useState, useEffect } from "react";

export function useAudioAnalyser() {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const startAudio = async () => {
    try {
      const context = new AudioContext();
      const analyzer = context.createAnalyser();
      analyzer.fftSize = 256;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      source.connect(analyzer);

      setAudioContext(context);
      setAnalyser(analyzer);

      const getData = () => {
        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        setAudioData(data);
        requestAnimationFrame(getData);
      };

      getData();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  return { audioData, startAudio };
}
