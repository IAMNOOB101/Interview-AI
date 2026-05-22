export const requestMediaAccess = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    return stream;
  } catch (err) {
    throw new Error("Camera and microphone access is required");
  }
};
