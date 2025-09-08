import fs from 'fs';
import path from 'path';

export function ensureUploadsDirectories(): void {
    const uploadsDir = path.resolve('src/uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Directorio creado:', uploadsDir);
    }

    if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
        console.log('Directorio creado:', avatarsDir);
    }
}