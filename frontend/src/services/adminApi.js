import api from "./api";

export const getAllUsers        = () => api.get("/admin/users");
export const getDomainStats    = () => api.get("/admin/domain-stats");
export const getPlatformStats  = () => api.get("/admin/stats");
export const getInstitutions   = () => api.get("/admin/institutions");
export const approveInstitution = (id) => api.put(`/admin/institutions/${id}/status`, { status: "ACTIVE" });
export const rejectInstitution  = (id) => api.put(`/admin/institutions/${id}/status`, { status: "REJECTED" });
