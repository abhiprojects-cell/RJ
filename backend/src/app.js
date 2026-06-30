import express from 'express';
import cors from 'cors';
import musicRoutes from './features/music/music.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/music', musicRoutes);

app.get('/', (req, res) => {
  res.send('CEA Music Backend Running');
});

export default app;
