import { Router, RequestHandler } from "express";
import { createTask, getTasks, deleteTask, updateTask, getTaskById } from "../controllers/taskController";

const router = Router();

// Ruta para obtener todas las tareas
router.get("/", getTasks as RequestHandler);

// Ruta para obtener una tarea por ID
router.get("/:id", getTaskById as RequestHandler);

// Ruta para crear una nueva tarea
router.post("/", createTask as RequestHandler);

// Ruta para actualizar una tarea por ID
router.put("/:id", updateTask as RequestHandler);

// Ruta para eliminar una tarea por ID
router.delete("/:id", deleteTask as RequestHandler);



export default router;
