import express from 'express';
import cors from 'cors';
import musicRoutes from './features/music/music.routes.js';

const app = express();

// Allow all *.vercel.app subdomains (covers all preview + production deployments)
// and localhost for local dev. Extra origins can be added via ALLOWED_ORIGIN env var.
const extraOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : [];

function isOriginAllowed(origin) {
  if (!origin) return true; // curl, Render health checks, mobile apps
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (origin === 'http://localhost:5173') return true;
  if (origin === 'http://localhost:3000') return true;
  if (extraOrigins.includes(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
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
