import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
// @ts-ignore
import * as sync from 'y-protocols/dist/sync.cjs';
// @ts-ignore
import * as awareness from 'y-protocols/dist/awareness.cjs';
import { encoding, decoding } from 'lib0';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const wss = new WebSocketServer({ port: 5000 });
const docs = new Map<string, Y.Doc>();

const persistDoc = async (docName: string, ydoc: Y.Doc) => {
  const fileId = docName.split('-')[1];
  if (!fileId) return;

  const state = Y.encodeStateAsUpdate(ydoc);
  const plainText = ydoc.getText('codemirror').toString();

  try {
    await pool.query(
      `UPDATE latex 
       SET "Yjs_State" = $1, 
           "Text" = $2, 
           "Last_Updated" = NOW() 
       WHERE "Id" = $3`,
      [Buffer.from(state), plainText, fileId]
    );
  } catch (err) {
    console.error(`[DB Error] File ${fileId}:`, err);
  }
};

const getDoc = async (docName: string) => {
  if (docs.has(docName)) return docs.get(docName)!;

  const doc = new Y.Doc();
  const fileId = docName.split('-')[1];

  try {
    const res = await pool.query('SELECT "Yjs_State", "Text" FROM latex WHERE "Id" = $1', [fileId]);
    if (res.rows.length > 0) {
      const row = res.rows[0];

      // Load binary state if it exists, otherwise fall back to string text
      if (row.Yjs_State) {
        Y.applyUpdate(doc, row.Yjs_State);
      } else if (row.Text) {
        doc.getText('codemirror').insert(0, row.Text);
      }
    }
  } catch (err) {
    console.error("Initial load error:", err);
  }

  docs.set(docName, doc);
  return doc;
};

wss.on('connection', async (conn: WebSocket, req) => {
  const docName = req.url?.slice(1).split('?')[0] || 'default';
  const doc = await getDoc(docName);
  const awarenessState = new awareness.Awareness(doc);

  const encoder = encoding.createEncoder();
  encoding.writeUint8(encoder, 0); 
  sync.writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));

  conn.on('message', async (message: Uint8Array) => {
    
    try {
      const decoder = decoding.createDecoder(new Uint8Array(message));
      const messageType = decoding.readUint8(decoder);
      const replyEncoder = encoding.createEncoder();

      if (messageType === 0) { // messageSync
        encoding.writeUint8(replyEncoder, 0);
        sync.readSyncMessage(decoder, replyEncoder, doc, null);
        if (encoding.length(replyEncoder) > 1) {
          conn.send(encoding.toUint8Array(replyEncoder));
        }
        
        // Auto-save: This keeps the Postgres 'Text' column in sync with Yjs
        await persistDoc(docName, doc);
      } 
      else if (messageType === 1) { // messageAwareness
        awareness.applyAwarenessUpdate(awarenessState, decoding.readVarUint8Array(decoder), conn);
      }

      // Broadcast to all other users in the room
      wss.clients.forEach(client => {
        if (client !== conn && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (e) {
      console.error(e);
    }
  });
});