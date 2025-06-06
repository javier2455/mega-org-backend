import { Router, RequestHandler } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController";
import { upload } from "../utils/multerConfig";

const router = Router();

// Ruta para obtener todos los usuarios
router.get("/", getUsers as RequestHandler);

// Ruta para obtener un usuario por ID
router.get("/:id", getUserById as RequestHandler);

// Ruta para crear un nuevo usuario
router.post("/", upload.single("avatar"), createUser as RequestHandler);

// Ruta para actualizar un usuario por ID
router.put("/:id", upload.single("avatar"), updateUser as RequestHandler);

// Ruta para eliminar un usuario por ID
router.delete("/:id", deleteUser as RequestHandler);

export default router;
