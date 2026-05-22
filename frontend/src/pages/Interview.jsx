import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview, submitAnswer } from "../services/interview.service.js";
import { startSpeechRecognition } from "../hooks/useSpeechToText.js";
import { getVoiceConfidence } from "../utils/voiceConfidence.js";

const STATES = { PREVIEW: "preview", IDLE: "idle", LOADING: "loading", ACTIVE: "active", SUBMITTING: "submitting", DONE: "done" };

export default function Interview() {
  const [state, setState]       = useState(STATES.PREVIEW);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [qIndex, setQIndex]     = useState(0);
  const [answer, setAnswer]     = useState("");
  const [lastEval, setLastEval] = useState(null);
  const [error, setError]       = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaError, setMediaError]   = useState("");
  const [permGranted, setPermGranted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef   = useRef(null);
  const recognRef  = useRef(null);
  const navigate   = useNavigate();
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Request camera+mic on mount
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMediaStream(stream);
        setPermGranted(true);
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Setup audio level monitoring
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          // Monitor audio levels
          const monitorAudio = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(Math.min(100, Math.round(average)));
            animFrameRef.current = requestAnimationFrame(monitorAudio);
          };
          monitorAudio();
        } catch (err) {
          console.error("Audio monitoring setup failed:", err);
        }
      })
      .catch(() => setMediaError("Camera & microphone access is required for the interview."));

    return () => {
      recognRef.current?.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Cleanup media stream on component unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const handleStart = async () => {
    if (mediaError) return setError(mediaError);
    setError(""); setState(STATES.LOADING);
    try {
      const { data } = await startInterview();
      setSessionId(data.sessionId);
      setQuestion(data.question || "");
      setQIndex(1);
      setState(STATES.ACTIVE);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start. Check your profile & resume.");
      setState(STATES.PREVIEW);
    }
  };

  const proceedFromPreview = () => {
    if (mediaError) return setError(mediaError);
    setState(STATES.IDLE);
    setError("");
  };

  const toggleSpeech = () => {
    if (isRecording) {
      recognRef.current?.stop();
      recognRef.current = null;
      setIsRecording(false);
    } else {
      recognRef.current = startSpeechRecognition((text) => setAnswer(text));
      setIsRecording(true);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return setError("Please provide an answer before submitting.");
    setError(""); setState(STATES.SUBMITTING);

    recognRef.current?.stop(); recognRef.current = null; setIsRecording(false);

    let voice = 5;
    try { voice = Math.round((await getVoiceConfidence(mediaStream)) * 10); } catch (_) {}

    try {
      const { data } = await submitAnswer({
        sessionId,
        answerText: answer,
        confidence: { voice, facial: 7 },
      });

      setLastEval(data.evaluation);
      setAnswer("");

      if (data.completed) {
        setState(STATES.DONE);
        // Stop all media tracks immediately when interview is done
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
          setPermGranted(false);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setTimeout(() => navigate(`/report/${sessionId}`), 2500);
      } else {
        setQuestion(data.nextQuestion || "");
        setQIndex((n) => n + 1);
        setState(STATES.ACTIVE);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Try again.");
      setState(STATES.ACTIVE);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="interview-layout">

        {/* Left — camera + controls */}
        <div className="interview-sidebar">
          <div className="camera-box">
            {permGranted ? (
              <video ref={videoRef} autoPlay muted playsInline className="camera-feed" />
            ) : (
              <div className="camera-placeholder">
                <span style={{ fontSize: "2.5rem" }}>📷</span>
                <p>{mediaError || "Requesting camera access…"}</p>
              </div>
            )}
            <div className={`cam-status ${permGranted ? "cam-on" : "cam-off"}`}>
              {permGranted ? "● Live" : "○ No camera"}
            </div>
          </div>

          {/* Audio level indicator */}
          {state === STATES.PREVIEW && permGranted && (
            <div className="audio-indicator card" style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.8rem", marginBottom: "0.5rem", fontWeight: 500 }}>🔊 Microphone Test</p>
              <div style={{
                background: "var(--bg-secondary)",
                borderRadius: "4px",
                height: "8px",
                overflow: "hidden",
                marginBottom: "0.5rem"
              }}>
                <div style={{
                  background: audioLevel > 70 ? "#ef4444" : audioLevel > 40 ? "#f59e0b" : "#10b981",
                  height: "100%",
                  width: `${audioLevel}%`,
                  transition: "width 0.1s"
                }} />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {audioLevel > 70 ? "🔴 Loud" : audioLevel > 40 ? "🟡 Good" : "🟢 Quiet"}
              </p>
            </div>
          )}

          {state === STATES.ACTIVE && (
            <div className="sidebar-controls">
              <div className={`rec-indicator ${isRecording ? "pulsing" : ""}`}>
                {isRecording ? "🔴 Recording…" : "⬜ Microphone off"}
              </div>
              <button
                className={isRecording ? "btn-ghost" : "btn-primary"}
                style={{ marginBottom: "0.5rem" }}
                onClick={toggleSpeech}
              >
                {isRecording ? "⏹ Stop Recording" : "🎤 Start Speaking"}
              </button>
            </div>
          )}

          {lastEval && state === STATES.ACTIVE && (
            <div className="eval-sidebar card">
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Last answer</p>
              <div className="score-row"><span>Overall</span><strong>{lastEval.overallScore}/10</strong></div>
              <div className="score-row"><span>Content</span><strong>{lastEval.contentScore}/10</strong></div>
              <div className="score-row"><span>Clarity</span><strong>{lastEval.clarityScore}/10</strong></div>
            </div>
          )}
        </div>

        {/* Right — question + answer */}
        <div className="interview-main">

          {state === STATES.PREVIEW && (
            <div className="interview-start card">
              <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "1rem" }}>📹</div>
              <h2>Camera & Microphone Preview</h2>
              <p>Your camera and microphone are ready. You should see yourself in the video on the left and hear yourself speaking.</p>
              {mediaError && <div className="alert alert-error">{mediaError}</div>}
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                <p style={{ fontSize: "0.9rem", marginBottom: "0.8rem" }}>✓ Camera is working: {permGranted ? "Yes" : "No"}</p>
                <p style={{ fontSize: "0.9rem" }}>✓ Microphone is working: Speak and watch the audio level above</p>
              </div>
              <button className="btn-primary" style={{ marginTop: "1.5rem", width: "100%" }} onClick={proceedFromPreview} disabled={!!mediaError}>
                Proceed to Interview →
              </button>
            </div>
          )}

          {state === STATES.IDLE && (
            <div className="interview-start card">
              <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "1rem" }}>🎯</div>

              <h2>Ready for your mock interview?</h2>
              <p>Make sure your camera and microphone are enabled. The AI will generate personalised questions from your profile and resume.</p>
              {mediaError && <div className="alert alert-error">{mediaError}</div>}
              {error      && <div className="alert alert-error">{error}</div>}
              <button className="btn-primary" style={{ marginTop: "1.5rem" }} onClick={handleStart} disabled={!!mediaError}>
                Start Interview
              </button>
            </div>
          )}

          {state === STATES.LOADING && (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner" />
              <p style={{ marginTop: "1rem" }}>Generating your personalised questions…</p>
            </div>
          )}

          {(state === STATES.ACTIVE || state === STATES.SUBMITTING) && (
            <>
              <div className="question-card card">
                <div className="q-meta">
                  <span className="badge badge-blue">Question {qIndex}</span>
                </div>
                <h2 style={{ marginTop: "0.75rem", color: "var(--text)", lineHeight: 1.45 }}>
                  {question}
                </h2>
              </div>

              <div className="answer-area">
                <label className="form-group" style={{ marginBottom: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Your Answer</span>
                  <textarea
                    rows={6}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Speak or type your answer here…"
                    style={{ marginTop: "0.5rem", resize: "vertical", minHeight: 120 }}
                    disabled={state === STATES.SUBMITTING}
                  />
                </label>

                {error && <div className="alert alert-error">{error}</div>}

                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={state === STATES.SUBMITTING || !answer.trim()}
                >
                  {state === STATES.SUBMITTING ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <span className="spinner-sm" /> Evaluating…
                    </span>
                  ) : "Submit Answer →"}
                </button>
              </div>
            </>
          )}

          {state === STATES.DONE && (
            <div className="card" style={{ textAlign: "center", padding: "3rem", animation: "slideUp 0.4s ease" }}>
              <div style={{ fontSize: "3rem" }}>🎉</div>
              <h2>Interview Complete!</h2>
              <p>Generating your personalised report…</p>
              <div className="spinner" style={{ margin: "1.5rem auto" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

