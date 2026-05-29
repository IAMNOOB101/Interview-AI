import express from "express";
import {
  getPlatformStats, getDomainWiseStats,
  createInstitution, updateInstitutionStatus, listInstitutions,
  listUsers, updateUserRole, deleteUser,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(verifyToken);
// Allow both superadmin and institution_admin
router.use(allowRoles("admin", "institution_admin"));

router.get("/stats",        getPlatformStats);
router.get("/domain-stats", getDomainWiseStats);

// User RBAC management
router.get("/users",                    listUsers);
router.patch("/users/:userId/role",     updateUserRole);
router.delete("/users/:userId",         deleteUser);

// Institution management (admin only)
router.post("/institutions",                                    createInstitution);
router.put("/institutions/:institutionId/status",               updateInstitutionStatus);
router.get("/institutions",                                     listInstitutions);

export default router;
