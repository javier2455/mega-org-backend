import { Router, RequestHandler } from "express";
import { createIssue, getIssues, deleteIssue, updateIssue, getIssueById } from "../controllers/issueController";

const router = Router();

// Ruta para obtener todas las issues
router.get("/", getIssues as RequestHandler);

// Ruta para obtener una issue por ID
router.get("/:id", getIssueById as RequestHandler);

// Ruta para crear una nueva issue
router.post("/", createIssue as RequestHandler);

// Ruta para actualizar una issue por ID
router.put("/:id", updateIssue as RequestHandler);

// Ruta para eliminar una issue por ID
router.delete("/:id", deleteIssue as RequestHandler);

export default router;

