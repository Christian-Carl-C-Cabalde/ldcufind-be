import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';

const uploadRoutes = new Hono();

uploadRoutes.post('/', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['image'];

        if (file instanceof File) {
            const buffer = await file.arrayBuffer();
            const ext = path.extname(file.name) || '.jpg';
            // Clean the original name to avoid spaces and weird characters
            const cleanedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
            const uniqueName = `${Date.now()}-${cleanedName}`;
            
            // Create uploads directory if it doesn't exist just in case
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            fs.writeFileSync(uploadPath, Buffer.from(buffer));
            
            return c.json({ url: `http://localhost:3000/uploads/${uniqueName}` });
        } else {
            return c.json({ message: 'No file found in request' }, 400);
        }
    } catch (error) {
        console.error('File upload error:', error);
        return c.json({ message: 'Upload failed' }, 500);
    }
});

export default uploadRoutes;
