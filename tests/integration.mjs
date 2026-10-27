import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const base = process.env.TEST_BASE_URL || 'http://localhost:3100';
async function api(path, method = 'GET', data, cookie) { const r = await fetch(base + path, { method, headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: data ? JSON.stringify(data) : undefined }); return { status: r.status, body: await r.json(), cookie: r.headers.get('set-cookie') }; }
function connect(code, role, token, cookie) { return new Promise((resolve, reject) => { const socket = io(base, { auth: { code, role, token }, extraHeaders: cookie ? { Cookie: cookie } : undefined, reconnection: false }); socket.once('connect', () => resolve(socket)); socket.once('connect_error', reject); setTimeout(() => reject(Error('Socket connection timed out')), 5000); }); }
function send(socket, event, payload = {}) { return new Promise(resolve => socket.emit(event, payload, resolve)); }
function state(code) { return api(`/api/sessions/${code}`).then(r => r.body); }
const sockets = [];
try {
  const template = await api('/api/games', 'POST', { name: 'Integration quiz', description: '', teamMode: true, maxTeams: 2, questions: [{ text: 'Capital?', countdownSeconds: 5, answers: [{ text: 'Oslo', isCorrect: true }, { text: 'Bergen', isCorrect: false }, { text: 'Tromsø', isCorrect: false }] }] });
  assert.equal(template.status, 201);
  const exported = await api(`/api/games/${template.body.id}/export`); assert.equal(exported.status, 200); assert.equal(exported.body.schemaVersion, 1); assert.equal('id' in exported.body.game.questions[0], false);
  const imported = await api('/api/games/import', 'POST', exported.body); assert.equal(imported.status, 201); assert.notEqual(imported.body.id, template.body.id);
  const session = await api('/api/sessions', 'POST', { gameTemplateId: template.body.id }); assert.equal(session.status, 201); const code = session.body.code; const cookie = session.cookie.split(';')[0];
  const a = await api(`/api/sessions/${code}/join`, 'POST', { displayName: 'Alex', teamName: 'Blue' });
  const b = await api(`/api/sessions/${code}/join`, 'POST', { displayName: 'Sam', teamName: 'Blue' });
  assert.equal(a.status, 201); assert.equal(b.status, 201);
  assert.equal((await api(`/api/sessions/${code}/join`, 'POST', { displayName: 'alex', teamName: 'Blue' })).status, 409);
  const host = await connect(code, 'host', undefined, cookie); const alex = await connect(code, 'player', a.body.token); const sam = await connect(code, 'player', b.body.token); sockets.push(host, alex, sam);
  assert.equal((await send(host, 'host:start')).ok, true);
  const revisedGame = { name: 'Integration quiz revised', description: '', teamMode: true, maxTeams: 2, autoActivateBuzzer: false, questions: [{ text: 'Edited capital?', countdownSeconds: 5, answers: [{ text: 'Oslo', isCorrect: true }, { text: 'Bergen', isCorrect: false }] }] };
  assert.equal((await api(`/api/games/${template.body.id}`, 'PUT', revisedGame)).status, 409);
  let display = await state(code); assert.equal(display.phase, 'QUESTION_DISPLAY'); assert.equal(display.question.answers.length, 0);
  assert.equal((await send(host, 'host:open')).ok, true); assert.equal((await state(code)).question.answers.length, 3);
  const buzzes = await Promise.all([send(alex, 'buzzer:press'), send(sam, 'buzzer:press')]); assert.equal(buzzes.filter(r => r.ok).length, 1);
  let current = await state(code); const winner = current.selectedPlayerId === a.body.playerId ? alex : sam; const loser = winner === alex ? sam : alex;
  assert.equal(current.phase, 'ANSWER_COUNTDOWN'); assert.equal(current.question.answers.some(x => 'isCorrect' in x), false);
  const wrong = current.question.answers.find(x => x.text === 'Bergen'); assert.equal((await send(winner, 'answer:submit', { answerId: wrong.id })).ok, true);
  current = await state(code); assert.equal(current.phase, 'ANSWER_RESULT'); assert.equal(current.question.answers.length, 2); assert.equal(current.eliminatedPlayerIds.length, 1); assert.equal(current.players.reduce((n, p) => n + p.score, 0), 0);
  await new Promise(resolve => setTimeout(resolve, 2000)); assert.equal((await state(code)).phase, 'BUZZER_OPEN'); assert.equal((await send(winner, 'buzzer:press')).ok, false); assert.equal((await send(loser, 'buzzer:press')).ok, true);
  current = await state(code); const correct = current.question.answers.find(x => x.text === 'Oslo'); assert.equal((await send(loser, 'answer:submit', { answerId: correct.id })).ok, true); assert.equal((await send(loser, 'answer:submit', { answerId: correct.id })).ok, false);
  current = await state(code); assert.equal(current.phase, 'QUESTION_COMPLETE'); assert.equal(current.players.reduce((n, p) => n + p.score, 0), 1); assert.equal(current.teams[0].score, 1);
  loser.disconnect(); const reconnected = await connect(code, 'player', winner === alex ? b.body.token : a.body.token); sockets.push(reconnected); assert.equal((await state(code)).players.find(p => p.id === (winner === alex ? b.body.playerId : a.body.playerId)).score, 1);
  assert.equal((await send(host, 'host:next')).ok, true); assert.equal((await state(code)).phase, 'GAME_COMPLETE'); assert.equal((await state(code)).status, 'ENDED');
  const timedSession = await api('/api/sessions', 'POST', { gameTemplateId: template.body.id }); const timedCode = timedSession.body.code; const timedCookie = timedSession.cookie.split(';')[0];
  const timedJoin = await api(`/api/sessions/${timedCode}/join`, 'POST', { displayName: 'Timeout player', teamName: 'Red' });
  const timedHost = await connect(timedCode, 'host', undefined, timedCookie); const timedPlayer = await connect(timedCode, 'player', timedJoin.body.token); sockets.push(timedHost, timedPlayer);
  assert.equal((await send(timedHost, 'host:start')).ok, true); assert.equal((await send(timedHost, 'host:open')).ok, true); assert.equal((await send(timedPlayer, 'buzzer:press')).ok, true);
  await new Promise(resolve => setTimeout(resolve, 5300));
  const timedState = await state(timedCode); assert.equal(timedState.phase, 'QUESTION_COMPLETE'); assert.equal(timedState.result.timedOut, true); assert.equal(timedState.question.answers.length, 3); assert.equal(timedState.players[0].score, 0);
  assert.equal((await send(timedHost, 'host:next')).ok, true); assert.equal((await state(timedCode)).status, 'ENDED');
  const revised = await api(`/api/games/${template.body.id}`, 'PUT', revisedGame); assert.equal(revised.status, 200); assert.notEqual(revised.body.id, template.body.id);
  const shelf = (await api('/api/games')).body; assert.equal(shelf.some(game => game.id === template.body.id), false); assert.equal(shelf.some(game => game.id === revised.body.id), true);
  assert.equal((await state(code)).question.text, 'Capital?'); assert.equal((await state(code)).players.reduce((sum, player) => sum + player.score, 0), 1);
  const automatic = await api('/api/games', 'POST', { name: 'Automatic buzzer', description: '', teamMode: false, maxTeams: null, autoActivateBuzzer: true, questions: [1, 2].map(number => ({ text: `Question ${number}?`, countdownSeconds: 5, answers: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] })) });
  assert.equal(automatic.status, 201);
  const autoSession = await api('/api/sessions', 'POST', { gameTemplateId: automatic.body.id }); const autoCode = autoSession.body.code;
  const autoJoin = await api(`/api/sessions/${autoCode}/join`, 'POST', { displayName: 'Auto player' });
  const autoHost = await connect(autoCode, 'host', undefined, autoSession.cookie.split(';')[0]); const autoPlayer = await connect(autoCode, 'player', autoJoin.body.token); sockets.push(autoHost, autoPlayer);
  assert.equal((await send(autoHost, 'host:start')).ok, true);
  let autoState = await state(autoCode); assert.equal(autoState.phase, 'BUZZER_OPEN'); assert.equal(autoState.question.answers.length, 2);
  assert.equal((await send(autoPlayer, 'buzzer:press')).ok, true);
  assert.equal((await send(autoPlayer, 'answer:submit', { answerId: autoState.question.answers[0].id })).ok, true);
  assert.equal((await send(autoHost, 'host:next')).ok, true);
  autoState = await state(autoCode); assert.equal(autoState.questionIndex, 1); assert.equal(autoState.phase, 'BUZZER_OPEN'); assert.equal(autoState.question.answers.length, 2);
  const lobbySession = await api('/api/sessions', 'POST', { gameTemplateId: imported.body.id }); const lobbyCode = lobbySession.body.code;
  assert.equal((await api(`/api/setup/sessions/${lobbyCode}/end`, 'POST')).status, 200); assert.equal((await state(lobbyCode)).status, 'ENDED');
  assert.equal((await api('/api/sessions')).body.some(session => session.sessionCode === lobbyCode && session.status === 'ENDED'), true);
  console.log('Integration passed: automatic session ending, setup session listing, lobby end, edit after session via new quiz version, preserved results, and multiplayer gameplay.');
} finally { sockets.forEach(s => s.disconnect()); }
