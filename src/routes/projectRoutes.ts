import { Router, RequestHandler } from "express";
import { getProjects, createProject, getProjectById, createProjectTask, createProjectIssue, updateProject, deleteProject } from "../controllers/projectController";

const router = Router();

router.get("/", getProjects as RequestHandler);
router.get("/:id", getProjectById as RequestHandler);
router.post("/", createProject as RequestHandler);
router.put("/:id", updateProject as RequestHandler);
router.delete("/:id", deleteProject as RequestHandler);
router.post("/:id/tasks", createProjectTask as RequestHandler);
router.post("/:id/issues", createProjectIssue as RequestHandler);

export default router;
