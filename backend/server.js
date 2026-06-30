import app from './src/app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CEA Music Backend running on port ${PORT}`);

  // Keep Render free tier alive — ping ourselves every 14 minutes
  // (Render spins down free services after 15 min of inactivity)
  const SELF_URL = process.env.RENDER_EXTERNAL_URL;
  if (SELF_URL) {
    setInterval(async () => {
      try {
        await fetch(`${SELF_URL}/health`);
        console.log('[Keep-alive] ping sent');
      } catch (e) {
        console.warn('[Keep-alive] ping failed:', e.message);
      }
    }, 14 * 60 * 1000); // every 14 minutes
  }
});
