const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const startSpeechRecognition = (onText, language = "en-US") => {
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported in this browser");
    return null;
  }
  const rec = new SpeechRecognition();
  rec.lang = language;
  rec.continuous = true;
  rec.interimResults = true;

  rec.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join("");
    onText(transcript);
  };

  rec.onerror = (e) => console.error("Speech error:", e.error);
  rec.start();
  return rec;
};
