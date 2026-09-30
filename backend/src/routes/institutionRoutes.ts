import { Router } from "express";
import { getPublicInstitutions } from "../controllers/institutionController.js";
import { discoveryRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.get("/institutions", discoveryRateLimiter, getPublicInstitutions);

export default router;
