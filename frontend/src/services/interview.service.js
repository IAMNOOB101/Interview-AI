import api from "./api";

export const startInterview  = ()                          => api.post("/interview/session/start");
export const submitAnswer    = (payload)                   => api.post("/interview/session/submit", payload);
export const getHistory      = ()                          => api.get("/interview/sessions");
export const getTranscript   = (sessionId)                 => api.get(`/interview/report/${sessionId}`);
export const setupProfile    = (profile)                   => api.post("/interview/setup", profile);
