import express from 'express';
import cors from 'cors';
import musicRoutes from './features/music/music.routes.js';

const app = express();

// Allow requests from Vercel frontend (set ALLOWED_ORIGIN env var on Render)
// Falls back to allowing all origins in dev if the env var is not set.
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json());
app.use('/api/music', musicRoutes);

app.get('/', (req, res) => {
  res.send('CEA Music Backend Running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
