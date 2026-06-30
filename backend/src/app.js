import express from 'express';
import cors from 'cors';
import musicRoutes from './features/music/music.routes.js';

const app = express();

// Allowed origins: always include the production Vercel URL.
// Add ALLOWED_ORIGIN env var on Render (comma-separated) to extend this list.
const allowedOrigins = [
  'https://rjmusic.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
    : []),
];

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
