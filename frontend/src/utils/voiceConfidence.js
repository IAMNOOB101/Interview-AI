export const getVoiceConfidence = async (mediaStream) => {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(mediaStream);

  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  const avgVolume =
    data.reduce((a, b) => a + b, 0) / data.length;

  const normalized = Math.min(1, Math.max(0, avgVolume / 128));
  return normalized;
};
