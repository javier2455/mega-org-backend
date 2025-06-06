import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "src/uploads/avatars/");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

// Filtro para aceptar solo imágenes
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Solo se permiten imágenes"));
};

export const upload = multer({ storage, fileFilter });