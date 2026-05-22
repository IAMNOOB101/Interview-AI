import { useEffect, useState } from "react";

export const useMediaStream = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setMediaStream(stream);
      } catch (err) {
        setError("Camera and microphone access denied");
      }
    };

    init();
  }, []);

  return { mediaStream, error };
};
