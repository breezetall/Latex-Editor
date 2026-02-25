import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
// @ts-ignore - y-websocket lacks perfect types for this internal bin file
import { setupWSConnection } from 'y-websocket/bin/utils';
import jwt from 'jsonwebtoken';

/**
 * CONFIGURATION
 * In production, move these to process.env
 */
const PORT = 5000;
const JWT_SECRET = 'your-aspnet-shared-secret'; 

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// --- 1. PERSISTENCE LAYER (Tomorrow's Logic) ---
const persistence = {
  bindState: async (docName: string, ydoc: Y.Doc) => {
    console.log(`[Persistence] Loading ${docName}...`);
    // TODO: const blob = await db.query('SELECT blob FROM docs WHERE id = ?', [docName]);
    // if (blob) Y.applyUpdate(ydoc, blob);
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    console.log(`[Persistence] Saving ${docName}...`);
    const state = Y.encodeStateAsUpdate(ydoc);
    // TODO: await db.execute('UPDATE docs SET blob = ? WHERE id = ?', [state, docName]);
  }
};

// --- 2. AUTHENTICATION & UPGRADE ---
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url!, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');
  const docName = url.pathname.slice(1); // e.g., /document-abc

  try {
    if (!token) throw new Error('Missing Token');
    
    // Verify JWT issued by your ASP.NET Auth service
    const user = jwt.verify(token, JWT_SECRET) as { sub: string, role: string };
    console.log(`User ${user.sub} authorized for ${docName}`);

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } catch (err) {
    console.error('WebSocket Auth Failed:', err.message);
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// --- 3. YJS CONNECTION HANDLING ---
wss.on('connection', (conn, req) => {
  const docName = new URL(req.url!, `http://${req.headers.host}`).pathname.slice(1);
  
  setupWSConnection(conn, req, {
    docName,
    gc: true,
    persistence: persistence // Handles auto-saving/loading
  });
});

// --- 4. OPTIONAL API ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'yjs-collab' }));

server.listen(PORT, () => {
  console.log(`
  🚀 Yjs Collab Service Live
  Port: ${PORT}
  Endpoint: ws://localhost:${PORT}/{docName}?token={jwt}
  `);
});