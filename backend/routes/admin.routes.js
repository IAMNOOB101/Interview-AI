import express from "express";
import { getPlatformStats, getDomainWiseStats } from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { createInstitution, updateInstitutionStatus, listInstitutions } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(verifyToken);
router.use(allowRoles("admin"));

router.get("/stats", getPlatformStats);
router.get("/domain-stats", getDomainWiseStats);

router.post("/institutions", createInstitution);
router.put("/institutions/:institutionId/status", updateInstitutionStatus);
router.get("/institutions", listInstitutions);

export default router;
