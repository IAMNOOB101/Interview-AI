const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Start Web Speech API recognition.
 * @param {(text: string, isFinal: boolean) => void} onText - callback with transcript and finality flag
 * @param {string} language - BCP-47 language tag, e.g. "en-US"
 * @returns {SpeechRecognition | null} - recognition instance (call .stop() to end)
 */
export const startSpeechRecognition = (onText, language = "en-US") => {
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition API not supported in this browser.");
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang = language;
  rec.continuous = true;
  rec.interimResults = true;

  rec.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    // Full accumulated transcript (final + interim)
    const fullTranscript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join("");

    const isFinal = finalTranscript.length > 0;
    onText(fullTranscript, isFinal);
  };

  rec.onerror = (e) => {
    if (e.error !== "no-speech") {
      console.error("Speech recognition error:", e.error);
    }
  };

  rec.onend = () => {
    // Auto-restart if not manually stopped (continuous mode guard)
    if (rec._shouldRestart) {
      try { rec.start(); } catch (_) {}
    }
  };

  rec._shouldRestart = true;
  rec.start();

  // Expose stop that also clears the restart flag
  const origStop = rec.stop.bind(rec);
  rec.stop = () => {
    rec._shouldRestart = false;
    origStop();
  };

  return rec;
};
