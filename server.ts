import next from 'next';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { mkdirSync } from 'node:fs';
import { Server } from 'socket.io';
import { db } from './lib/db';
import { cookieValue, hash, verify } from './lib/security';
import { GameEngine, getSession } from './server/engine';

mkdirSync('data', { recursive: true });
const dev = process.env.NODE_ENV !== 'production';
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname: host, port });
async function main() {
  await app.prepare();
  await db.$queryRawUnsafe('PRAGMA journal_mode=WAL');
  let engine: GameEngine;
  const handleNext = app.getRequestHandler();
  const server = createServer((req, res) => {
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
    const endMatch = req.method === 'POST' ? /^\/api\/setup\/sessions\/([A-Z0-9]{6})\/end$/.exec(req.url ?? '') : null;
    if (endMatch) {
      if (!local) { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Only the local host can end sessions from setup.' })); return; }
      void engine.end(endMatch[1]).then(() => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: true })); }).catch(cause => { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: cause instanceof Error ? cause.message : 'Could not end session' })); });
      return;
    }
    delete req.headers['x-wgd-local'];
    if (local) req.headers['x-wgd-local'] = '1';
    return handleNext(req, res);
  });
  const io = new Server(server, { maxHttpBufferSize: 100_000 });
  engine = new GameEngine(io);
  await engine.initialize();
  io.on('connection', async socket => {
    const code = String(socket.handshake.auth.code || '').toUpperCase();
    const session = await getSession(code);
    if (!session) { socket.emit('session:error', 'Game not found'); socket.disconnect(); return; }
    let role: 'host' | 'player' | null = null;
    let playerId: string | null = null;
    if (socket.handshake.auth.role === 'host') { const hostToken = cookieValue(socket.handshake.headers.cookie, `host_${code}`); if (hostToken && verify(hostToken, session.hostTokenHash)) role = 'host'; }
    else { const playerToken = socket.handshake.auth.token; const player = typeof playerToken === 'string' ? session.players.find(p => p.reconnectTokenHash === hash(playerToken)) : null; if (player) { role = 'player'; playerId = player.id; } }
    if (!role) { socket.emit('session:error', 'Unauthorized'); socket.disconnect(); return; }
    socket.join(`game:${code}`);
    if (playerId) { socket.join(`player:${playerId}`); await db.player.update({ where: { id: playerId }, data: { connected: true, lastSeenAt: new Date() } }); }
    await engine.broadcast(code);
    let lastBuzz = 0;
    const action = (event: string, handler: (...args: never[]) => Promise<unknown>) => socket.on(event, async (payload: unknown, ack?: (result: { ok: boolean; error?: string }) => void) => { try { await handler(payload as never); ack?.({ ok: true }); } catch (e) { ack?.({ ok: false, error: e instanceof Error ? e.message : 'Action failed' }); } });
    if (role === 'host') {
      action('host:start', () => engine.start(code)); action('host:open', () => engine.open(code)); action('host:next', () => engine.next(code)); action('host:pause', () => engine.pause(code)); action('host:resume', () => engine.resume(code)); action('host:end', () => engine.end(code)); action('host:lobby', () => engine.lobby(code));
    } else if (playerId) {
      const id = playerId;
      action('buzzer:press', async () => { if (Date.now() - lastBuzz < 400) throw Error('Please wait'); lastBuzz = Date.now(); return engine.buzz(code, id); });
      action('answer:submit', (payload: { answerId: string }) => { if (!payload || typeof payload.answerId !== 'string') throw Error('Invalid answer'); return engine.answer(code, id, payload.answerId); });
    }
    socket.on('disconnect', async () => {
      if (role === 'host' && (await io.in(`game:${code}`).fetchSockets()).filter(s => s.handshake.auth.role === 'host').length === 0) await engine.pause(code);
      if (playerId && (await io.in(`player:${playerId}`).fetchSockets()).length === 0) { await db.player.update({ where: { id: playerId }, data: { connected: false, lastSeenAt: new Date() } }); await engine.broadcast(code); }
    });
  });
  server.listen(port, host, () => { console.log(`WannaGetDrunk: http://localhost:${port}`); for (const list of Object.values(networkInterfaces())) for (const address of list ?? []) if (address.family === 'IPv4' && !address.internal) console.log(`Network: http://${address.address}:${port}`); });
}
main().catch(e => { console.error(e); process.exit(1); });
