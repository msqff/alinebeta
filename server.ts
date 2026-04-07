import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

let db: DatabaseSync;
async function setupDB() {
    db = new DatabaseSync(path.join(process.cwd(), 'database.sqlite'));

    db.exec(`
        CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS item_slots (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        );
    `);
}

// --- Upload Endpoint ---
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.json({ url: `/uploads/${req.file.filename}` });
    } else if (req.body.base64) {
        // Handle base64 upload
        const matches = req.body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid base64 string' });
        }
        const ext = matches[1].split('/')[1] || 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        res.json({ url: `/uploads/${filename}` });
    } else {
        res.status(400).json({ error: 'No file or base64 data provided' });
    }
});

// --- Collections CRUD ---
app.get('/api/collections', (req, res) => {
    const stmt = db.prepare('SELECT data FROM collections');
    const rows = stmt.all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
});
app.post('/api/collections', (req, res) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO collections (id, data) VALUES (?, ?)');
    stmt.run(req.body.id, JSON.stringify(req.body));
    res.json({ success: true });
});
app.put('/api/collections/:id', (req, res) => {
    const stmt = db.prepare('UPDATE collections SET data = ? WHERE id = ?');
    stmt.run(JSON.stringify(req.body), req.params.id);
    res.json({ success: true });
});
app.delete('/api/collections/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM collections WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- ItemSlots CRUD ---
app.get('/api/item-slots', (req, res) => {
    const stmt = db.prepare('SELECT data FROM item_slots');
    const rows = stmt.all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
});
app.post('/api/item-slots', (req, res) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO item_slots (id, data) VALUES (?, ?)');
    stmt.run(req.body.id, JSON.stringify(req.body));
    res.json({ success: true });
});
app.put('/api/item-slots/:id', (req, res) => {
    const stmt = db.prepare('UPDATE item_slots SET data = ? WHERE id = ?');
    stmt.run(JSON.stringify(req.body), req.params.id);
    res.json({ success: true });
});
app.delete('/api/item-slots/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM item_slots WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- Assets CRUD ---
app.get('/api/assets', (req, res) => {
    const stmt = db.prepare('SELECT data FROM assets');
    const rows = stmt.all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
});
app.post('/api/assets', (req, res) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO assets (id, data) VALUES (?, ?)');
    stmt.run(req.body.id, JSON.stringify(req.body));
    res.json({ success: true });
});
app.put('/api/assets/:id', (req, res) => {
    const stmt = db.prepare('UPDATE assets SET data = ? WHERE id = ?');
    stmt.run(JSON.stringify(req.body), req.params.id);
    res.json({ success: true });
});
app.delete('/api/assets/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

async function startServer() {
    await setupDB();

    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa'
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
