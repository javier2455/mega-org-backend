import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';

// Crear la aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenido a la API de Mega Organization' });
});

// Puerto del servidor
const PORT = process.env.PORT || 3010;

// Inicializar la base de datos y el servidor
AppDataSource.initialize()
    .then(() => {
        console.log('Base de datos conectada');
        
        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al conectar con la base de datos:', error);
    }); 