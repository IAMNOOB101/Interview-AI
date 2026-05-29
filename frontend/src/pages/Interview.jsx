import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview, submitAnswer } from "../services/interview.service.js";
import { startSpeechRecognition } from "../hooks/useSpeechToText.js";
import { getVoiceConfidence } from "../utils/voiceConfidence.js";

const STATES = {
  PREVIEW: "preview",   // camera/mic test — camera IS active here
  IDLE: "idle",         // ready to start — camera still active
  LOADING: "loading",
  ACTIVE: "active",
  SUBMITTING: "submitting",
  DONE: "done",         // camera released immediately
};

function stopAllTracks(stream) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
}

export default function Interview() {
  const [uiState, setUiState]     = useState(STATES.PREVIEW);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion]   = useState("");
  const [qIndex, setQIndex]       = useState(0);
  const [answer, setAnswer]       = useState("");
  const [lastEval, setLastEval]   = useState(null);
  const [error, setError]         = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaError, setMediaError]   = useState("");
  const [permGranted, setPermGranted] = useState(false);
  const [audioLevel, setAudioLevel]   = useState(0);
  const [transcript, setTranscript]   = useState([]); // real-time transcription

  const videoRef    = useRef(null);
  const recognRef   = useRef(null);
  const navigate    = useNavigate();
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ── Request camera + mic, set up audio monitor ──────────────────────────
  useEffect(() => {
    let stream = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        setMediaStream(s);
        setPermGranted(true);
        if (videoRef.current) videoRef.current.srcObject = s;

        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
          const analyser = ctx.createAnalyser();
          const source = ctx.createMediaStreamSource(s);
          source.connect(analyser);
          analyserRef.current = analyser;

          const monitor = () => {
            const arr = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(arr);
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            setAudioLevel(Math.min(100, Math.round(avg)));
            animFrameRef.current = requestAnimationFrame(monitor);
          };
          monitor();
        } catch (e) {
          console.warn("Audio monitor setup failed:", e);
        }
      })
      .catch((err) => {
        console.error("getUserMedia error:", err);
        setMediaError("Camera & microphone access is required. Please allow access and reload.");
      });

    return () => {
      recognRef.current?.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      // Only stop tracks on full unmount — we manage release via releaseCamera()
      if (stream) stopAllTracks(stream);
    };
  }, []);

  // ── Release camera immediately once interview is done ──────────────────
  const releaseCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    stopAllTracks(mediaStream);
    setMediaStream(null);
    setPermGranted(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [mediaStream]);

  // ── Proceed from preview ──────────────────────────────────────────────
  const proceedFromPreview = () => {
    if (mediaError) return setError(mediaError);
    setUiState(STATES.IDLE);
    setError("");
  };

  // ── Start interview ──────────────────────────────────────────────────
  const handleStart = async () => {
    if (mediaError) return setError(mediaError);
    setError(""); setUiState(STATES.LOADING);
    try {
      const { data } = await startInterview();
      setSessionId(data.sessionId);
      setQuestion(data.question || "");
      setQIndex(1);
      setUiState(STATES.ACTIVE);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start. Check your profile & resume.");
      setUiState(STATES.PREVIEW);
    }
  };

  // ── Speech recognition + real-time transcription ────────────────────
  const toggleSpeech = () => {
    if (isRecording) {
      recognRef.current?.stop();
      recognRef.current = null;
      setIsRecording(false);
    } else {
      recognRef.current = startSpeechRecognition((text, isFinal) => {
        setAnswer(text);
        // Update real-time transcription panel
        setTranscript((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.interim) {
            updated[updated.length - 1] = { ...last, text, interim: !isFinal };
          } else if (!isFinal) {
            updated.push({ questionIndex: qIndex, question, text, interim: true });
          } else {
            // Replace last interim or add final
            if (last && last.interim) {
              updated[updated.length - 1] = { questionIndex: qIndex, question, text, interim: false };
            } else {
              updated.push({ questionIndex: qIndex, question, text, interim: false });
            }
          }
          return updated;
        });
      });
      setIsRecording(true);
    }
  };

  // ── Submit answer ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim()) return setError("Please provide an answer before submitting.");
    setError(""); setUiState(STATES.SUBMITTING);

    recognRef.current?.stop(); recognRef.current = null; setIsRecording(false);

    // Finalise transcript entry for this question
    if (answer.trim()) {
      setTranscript((prev) => {
        const filtered = prev.filter((t) => !t.interim);
        const alreadyHas = filtered.some((t) => t.questionIndex === qIndex);
        if (alreadyHas) return filtered;
        return [...filtered, { questionIndex: qIndex, question, text: answer, interim: false }];
      });
    }

    let voice = 5;
    try { voice = Math.round((await getVoiceConfidence(mediaStream)) * 10); } catch (_) {}

    try {
      const { data } = await submitAnswer({ sessionId, answerText: answer, confidence: { voice, facial: 7 } });
      setLastEval(data.evaluation);
      setAnswer("");

      if (data.completed) {
        releaseCamera(); // ← camera off as soon as interview ends
        setUiState(STATES.DONE);
        setTimeout(() => navigate(`/report/${sessionId}`), 2500);
      } else {
        setQuestion(data.nextQuestion || "");
        setQIndex((n) => n + 1);
        setUiState(STATES.ACTIVE);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Try again.");
      setUiState(STATES.ACTIVE);
    }
  };

  const inInterview = uiState === STATES.ACTIVE || uiState === STATES.SUBMITTING;
  const showCamera  = uiState !== STATES.DONE;

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="interview-layout">

        {/* ── Left sidebar: camera + controls ── */}
        <div className="interview-sidebar">
          {showCamera && (
            <div className="camera-box">
              {permGranted ? (
                <video ref={videoRef} autoPlay muted playsInline className="camera-feed" />
              ) : (
                <div className="camera-placeholder">
                  <span style={{ fontSize: "2.5rem" }}>📷</span>
                  <p style={{ fontSize: "0.8rem", textAlign: "center", padding: "0.5rem" }}>
                    {mediaError || "Requesting camera…"}
                  </p>
                </div>
              )}
              <div className={`cam-status ${permGranted ? "cam-on" : "cam-off"}`}>
                {permGranted ? "● Live" : "○ No camera"}
              </div>
            </div>
          )}

          {/* Mic level — shown during preview AND active */}
          {(uiState === STATES.PREVIEW || inInterview) && permGranted && (
            <div className="audio-indicator card" style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.8rem", marginBottom: "0.5rem", fontWeight: 500 }}>🔊 Microphone</p>
              <div style={{ background: "var(--bg-secondary)", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: "0.5rem" }}>
                <div style={{
                  background: audioLevel > 70 ? "#ef4444" : audioLevel > 40 ? "#f59e0b" : "#10b981",
                  height: "100%", width: `${audioLevel}%`, transition: "width 0.1s",
                }} />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {audioLevel > 70 ? "🔴 Too loud" : audioLevel > 15 ? "🟢 Good" : "⚪ Quiet / Speak now"}
              </p>
            </div>
          )}

          {inInterview && (
            <div className="sidebar-controls">
              <div className={`rec-indicator ${isRecording ? "pulsing" : ""}`}>
                {isRecording ? "🔴 Recording…" : "⬜ Mic off"}
              </div>
              <button
                className={isRecording ? "btn-ghost" : "btn-primary"}
                style={{ marginBottom: "0.5rem" }}
                onClick={toggleSpeech}
              >
                {isRecording ? "⏹ Stop" : "🎤 Speak"}
              </button>
            </div>
          )}

          {lastEval && inInterview && (
            <div className="eval-sidebar card">
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Last answer</p>
              <div className="score-row"><span>Overall</span><strong>{lastEval.overallScore}/10</strong></div>
              <div className="score-row"><span>Content</span><strong>{lastEval.contentScore}/10</strong></div>
              <div className="score-row"><span>Clarity</span><strong>{lastEval.clarityScore}/10</strong></div>
            </div>
          )}
        </div>

        {/* ── Right main panel ── */}
        <div className="interview-main">

          {/* PREVIEW STATE */}
          {uiState === STATES.PREVIEW && (
            <div className="interview-start card">
              <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "1rem" }}>📹</div>
              <h2>Camera & Microphone Check</h2>
              <p>Before we begin, verify your camera and mic are working correctly.</p>

              <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: 8 }}>
                <p style={{ marginBottom: "0.6rem" }}>
                  {permGranted
                    ? "✅ Camera detected — you should see yourself on the left"
                    : "❌ Camera not detected"}
                </p>
                <p>
                  {audioLevel > 15
                    ? "✅ Microphone active — speak to see the level rise"
                    : "🔇 Speak into your mic to test it (level shown above)"}
                </p>
              </div>

              {mediaError && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{mediaError}</div>}
              {error && <div className="alert alert-error">{error}</div>}

              <button
                className="btn-primary"
                style={{ marginTop: "1.5rem", width: "100%" }}
                onClick={proceedFromPreview}
                disabled={!!mediaError}
              >
                {permGranted ? "Everything Looks Good — Continue →" : "Continue Without Camera"}
              </button>
            </div>
          )}

          {/* IDLE STATE */}
          {uiState === STATES.IDLE && (
            <div className="interview-start card">
              <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "1rem" }}>🎯</div>
              <h2>Ready for your mock interview?</h2>
              <p>The AI will generate personalised questions based on your profile, resume, preferred role, and expected salary.</p>
              {mediaError && <div className="alert alert-error">{mediaError}</div>}
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn-primary" style={{ marginTop: "1.5rem" }} onClick={handleStart}>
                Start Interview
              </button>
            </div>
          )}

          {/* LOADING */}
          {uiState === STATES.LOADING && (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner" />
              <p style={{ marginTop: "1rem" }}>Tailoring questions to your profile…</p>
            </div>
          )}

          {/* ACTIVE / SUBMITTING */}
          {inInterview && (
            <>
              <div className="question-card card">
                <div className="q-meta">
                  <span className="badge badge-blue">Question {qIndex}</span>
                </div>
                <h2 style={{ marginTop: "0.75rem", color: "var(--text)", lineHeight: 1.45 }}>{question}</h2>
              </div>

              <div className="answer-area">
                <label className="form-group" style={{ marginBottom: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Your Answer</span>
                  <textarea
                    rows={6} value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Speak or type your answer here…"
                    style={{ marginTop: "0.5rem", resize: "vertical", minHeight: 120 }}
                    disabled={uiState === STATES.SUBMITTING}
                  />
                </label>

                {error && <div className="alert alert-error">{error}</div>}

                <button
                  className="btn-primary" onClick={handleSubmit}
                  disabled={uiState === STATES.SUBMITTING || !answer.trim()}
                >
                  {uiState === STATES.SUBMITTING ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <span className="spinner-sm" /> Evaluating…
                    </span>
                  ) : "Submit Answer →"}
                </button>
              </div>

              {/* Live transcription panel */}
              {transcript.length > 0 && (
                <div className="card" style={{ marginTop: "1rem", maxHeight: 200, overflowY: "auto" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-muted)" }}>📝 Live Transcription</p>
                  {transcript.map((t, i) => (
                    <p key={i} style={{ fontSize: "0.85rem", color: t.interim ? "var(--text-muted)" : "var(--text)", fontStyle: t.interim ? "italic" : "normal", marginBottom: "0.25rem" }}>
                      {t.interim ? `…${t.text}` : `Q${t.questionIndex}: ${t.text}`}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* DONE */}
          {uiState === STATES.DONE && (
            <div className="card" style={{ textAlign: "center", padding: "3rem", animation: "slideUp 0.4s ease" }}>
              <div style={{ fontSize: "3rem" }}>🎉</div>
              <h2>Interview Complete!</h2>
              <p>Camera has been released. Generating your personalised report…</p>
              <div className="spinner" style={{ margin: "1.5rem auto" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
