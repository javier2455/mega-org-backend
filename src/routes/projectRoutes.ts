import { Router, RequestHandler } from "express";
import { getProjects, createProject, getProjectById } from "../controllers/projectController";

const router = Router();

router.get("/", getProjects as RequestHandler);
router.get("/:id", getProjectById as RequestHandler);
router.post("/", createProject as RequestHandler);

export default router;
