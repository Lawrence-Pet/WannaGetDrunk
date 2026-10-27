import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { io } from 'socket.io-client';
const base = process.env.TEST_BASE_URL || 'http://localhost:3100';
const file = join(tmpdir(), 'wgd-restart-fixture.json');
async function api(path, method = 'GET', data) { const r = await fetch(base + path, { method, headers: data ? { 'Content-Type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined }); return { data: await r.json(), cookie: r.headers.get('set-cookie'), status: r.status }; }
function connect(code, role, token, cookie) { return new Promise((resolve, reject) => { const socket = io(base, { auth: { code, role, token }, extraHeaders: cookie ? { Cookie: cookie } : undefined, reconnection: false }); socket.once('connect', () => resolve(socket)); socket.once('connect_error', reject); }); }
function send(socket, event, payload = {}) { return new Promise(resolve => socket.emit(event, payload, resolve)); }
if (process.argv[2] === 'prepare') {
  const quiz = await api('/api/games', 'POST', { name: 'Restart check', description: '', teamMode: false, maxTeams: null, questions: [1, 2].map(i => ({ text: `Question ${i}?`, countdownSeconds: 10, answers: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] })) }); assert.equal(quiz.status, 201);
  const session = await api('/api/sessions', 'POST', { gameTemplateId: quiz.data.id }); assert.equal(session.status, 201); const code = session.data.code; const cookie = session.cookie.split(';')[0];
  const join = await api(`/api/sessions/${code}/join`, 'POST', { displayName: 'Restart player' }); assert.equal(join.status, 201);
  const host = await connect(code, 'host', undefined, cookie); const player = await connect(code, 'player', join.data.token);
  assert.equal((await send(host, 'host:start')).ok, true); assert.equal((await send(host, 'host:open')).ok, true); assert.equal((await send(player, 'buzzer:press')).ok, true);
  const current = (await api(`/api/sessions/${code}`)).data; const answerId = current.question.answers.find(a => a.text === 'Yes').id;
  assert.equal((await send(player, 'answer:submit', { answerId })).ok, true); assert.equal((await send(host, 'host:next')).ok, true); assert.equal((await send(host, 'host:open')).ok, true);
  writeFileSync(file, JSON.stringify({ code, cookie, token: join.data.token, playerId: join.data.playerId }));
  console.log(`Prepared active session ${code} with one persisted point. Keep this process connected until the server stops.`);
} else if (process.argv[2] === 'verify') {
  const { code, cookie, token, playerId } = JSON.parse(readFileSync(file, 'utf8'));
  const state = (await api(`/api/sessions/${code}`)).data;
  assert.equal(state.phase, 'PAUSED'); assert.equal(state.status, 'PAUSED'); assert.equal(state.questionIndex, 1); assert.equal(state.players.find(p => p.id === playerId).score, 1);
  const host = await connect(code, 'host', undefined, cookie); const player = await connect(code, 'player', token);
  assert.equal((await send(host, 'host:resume')).ok, true); assert.equal((await send(player, 'buzzer:press')).ok, true);
  host.disconnect(); player.disconnect(); console.log('Restart recovery passed: paused phase, question index, score, reconnect, resume, and buzzer.');
} else throw Error('Use prepare or verify');
