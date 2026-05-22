import { useEffect, useRef } from "react";

export default function FaceMonitor({ onFlag }) {
  const videoRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      });
  }, []);

  // Future: detect face, eye movement, phone detection

  return <video ref={videoRef} autoPlay width="200" />;
}
