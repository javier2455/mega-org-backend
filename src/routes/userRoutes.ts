import { Router, RequestHandler } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController";

const router = Router();

// Ruta para obtener todos los usuarios
router.get("/", getUsers as RequestHandler);

// Ruta para obtener un usuario por ID
router.get("/:id", getUserById as RequestHandler);

// Ruta para crear un nuevo usuario
router.post("/", createUser as RequestHandler);

// Ruta para actualizar un usuario por ID
router.put("/:id", updateUser as RequestHandler);

// Ruta para eliminar un usuario por ID
router.delete("/:id", deleteUser as RequestHandler);

export default router;
