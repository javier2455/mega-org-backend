import { Router, RequestHandler } from "express";
import { createProject } from "../controllers/projectController";

const router = Router();

router.post("/", createProject as RequestHandler);

export default router;
