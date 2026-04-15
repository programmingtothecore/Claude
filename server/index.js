const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');

const db = require('./db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const usersRoutes = require('./routes/users');
const exploreRoutes = require('./routes/explore');
const connectionsRoutes = require('./routes/connections');
const buildMessagesRouter = require('./routes/messages');
const safetyRoutes = require('./routes/safety');
const attachSockets = require('./sockets');
const { UPLOAD_DIR } = require('./upload');

const PORT = Number(process.env.PORT || 3001);
const PROD = process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Static uploads
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d' }));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Create HTTP server early so sockets can attach + routes can reference io.
const httpServer = http.createServer(app);
const io = attachSockets(httpServer);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/messages', buildMessagesRouter({ io }));
app.use('/api/safety', safetyRoutes);

// Production: serve built SPA + SPA fallback
if (PROD) {
  const dist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^\/(?!api|uploads|socket\.io).*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    console.warn(`[server] client/dist not found – run "npm run build" first`);
  }
}

app.use(errorHandler);

// Auto-seed on empty database
try {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count === 0) {
    console.log('[server] empty database – running seed…');
    require('./seed').run();
  }
} catch (e) {
  console.warn('[server] auto-seed skipped:', e.message);
}

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
