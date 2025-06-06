import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/user";
import { hashPassword } from "../utils/passwordUtils";


export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    // Obtener todos los usuarios, excluyendo la contraseña
    const users = await userRepository.find({
      select: {
        id: true,
        fullname: true,
        user: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: ['tasks']
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los usuarios",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      select: {
        id: true,
        fullname: true,
        user: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id: parseInt(id) },
      relations: ['tasks']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user, password, fullname, role } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!user || !password || !role || !fullname) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.findOne({ where: { user } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe",
      });
    }

    // Si se subió un archivo, guarda la URL, si no, deja undefined
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    // Hashear la contraseña antes de crear el usuario
    const hashedPassword = await hashPassword(password);

    // Crear nuevo usuario
    const newUser = userRepository.create({
      user,
      password: hashedPassword,
      fullname,
      role,
      avatarUrl
    });

    // Guardar el usuario en la base de datos
    const savedUser = await userRepository.save(newUser);

    return res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: {
        id: savedUser.id,
        user: savedUser.user,
        fullname: savedUser.fullname,
        role: savedUser.role,
        avatarUrl: savedUser.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const findUser = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const { user, fullname, role, password } = req.body;

    // Verificar que al menos un campo esté presente para actualizar
    if (!user && !fullname && !role && !password) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    // Actualizar solo los campos que se proporcionaron
    if (user) findUser.user = user;
    if (fullname) findUser.fullname = fullname;
    if (role) findUser.role = role;
    if (password) {
      // Hashear la nueva contraseña si se proporciona
      findUser.password = await hashPassword(password);
    }

    // Si se subió un archivo, guarda la URL, si no, deja undefined
    if (req.file) {
      findUser.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await userRepository.save(findUser);

    return res.status(200).json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: {
        id: updatedUser.id,
        user: updatedUser.user,
        fullname: updatedUser.fullname,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const findUser = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    await userRepository.remove(findUser);

    return res.status(200).json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
