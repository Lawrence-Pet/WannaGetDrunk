'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { importSchema } from '@/lib/validation';
import type { z } from 'zod';

type Item = { id: string; name: string; description: string; teamMode: boolean; updatedAt: string; _count: { questions: number } };
type Session = { sessionCode: string; gameTemplateId: string; status: string; phase: string; gameTemplate: { name: string }; _count: { players: number } };
type Import = z.infer<typeof importSchema>;

export default function Setup() {
  const [games, setGames] = useState<Item[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');
  const [pendingImport, setPendingImport] = useState<Import | null>(null);
  const [endingCode, setEndingCode] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    try {
      const [gamesResponse, sessionsResponse] = await Promise.all([fetch('/api/games'), fetch('/api/sessions')]);
      if (!gamesResponse.ok || !sessionsResponse.ok) throw Error('Could not load games and sessions');
      setGames(await gamesResponse.json());
      setSessions(await sessionsResponse.json());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load setup'); }
  }
  useEffect(() => { void refresh(); }, []);

  async function launch(id: string) {
    setError('');
    const response = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameTemplateId: id }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else router.push(`/host/${data.code}`);
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100_000) throw Error('File is too large');
      setPendingImport(importSchema.parse(JSON.parse(await file.text())));
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid file'); }
  }

  async function confirmImport() {
    if (!pendingImport) return;
    const response = await fetch('/api/games/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingImport) });
    const data = await response.json();
    if (!response.ok) setError(data.error);
    else { setPendingImport(null); void refresh(); }
  }

  async function remove(id: string) {
    if (!confirm('Delete this quiz from the shelf? Past results will be kept.')) return;
    const response = await fetch(`/api/games/${id}`, { method: 'DELETE' });
    if (!response.ok) setError((await response.json()).error); else void refresh();
  }

  async function endSession(session: Session) {
    if (!confirm(`End session ${session.sessionCode} for ${session.gameTemplate.name}? Players will see final results.`)) return;
    setEndingCode(session.sessionCode);
    setError('');
    try {
      const response = await fetch(`/api/setup/sessions/${session.sessionCode}/end`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? 'Could not end session');
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not end session'); }
    finally { setEndingCode(null); }
  }

  const openSessions = sessions.filter(session => !['ENDED', 'COMPLETE'].includes(session.status));
  const recentEnded = sessions.filter(session => ['ENDED', 'COMPLETE'].includes(session.status)).slice(0, 5);

  return <main className="shell">
    <header className="page-header"><Link href="/" className="brand">✦ WANNA GET DRUNK</Link><Link href="/join" className="small-link">Join with a code ↗</Link></header>
    <div className="section-head">
      <div><div className="eyebrow">HOST STUDIO</div><h1>Your game shelf<span className="dot">.</span></h1><p>Pick a quiz, launch a lobby, and invite everyone in.</p></div>
      <div className="row"><label className="btn ghost file-button">Import JSON<input type="file" accept="application/json,.json" hidden onChange={event => importFile(event.target.files?.[0])}/></label><Link className="btn primary" href="/setup/new">Create a quiz +</Link></div>
    </div>
    {error && <div className="error">{error}</div>}
    {pendingImport && <div className="import-preview panel"><div className="eyebrow">IMPORT PREVIEW</div><h2>{pendingImport.game.name}</h2><p>{pendingImport.game.description || 'No description'}</p><div className="meta"><span>{pendingImport.game.questions.length} questions</span><span>{pendingImport.game.teamMode ? 'Team play' : 'Individual play'}</span></div><div className="row"><button className="btn primary" onClick={confirmImport}>Import this quiz</button><button className="btn ghost" onClick={() => setPendingImport(null)}>Cancel</button></div></div>}
    <div className="game-list">{games.map((game, index) => <article className="game-card" key={game.id}>
      <div className="game-number">{String(index + 1).padStart(2, '0')}</div>
      <div className="game-info"><h2>{game.name}</h2><p>{game.description || 'Ready for a new round?'}</p><div className="meta"><span>{game._count.questions} questions</span><span>{game.teamMode ? 'Team play' : 'Individual play'}</span>{openSessions.some(session => session.gameTemplateId === game.id) && <span>Session open</span>}</div></div>
      <div className="game-actions"><button className="btn primary" onClick={() => launch(game.id)}>Host game ↗</button><Link className="icon-link" href={`/setup/${game.id}`}>Edit</Link><a className="icon-link" href={`/api/games/${game.id}/export`}>Export</a><button className="icon-link danger" onClick={() => remove(game.id)}>Delete</button></div>
    </article>)}</div>
    {!games.length && <div className="empty"><div className="empty-icon">✦</div><h2>No quizzes yet</h2><p>Make your first quiz and get the room buzzing.</p><Link className="btn primary" href="/setup/new">Create a quiz +</Link></div>}
    <section className="sessions-section">
      <div className="sessions-heading"><div><div className="eyebrow">SESSION CONTROL</div><h2>Open sessions</h2></div><button className="small-link" onClick={() => void refresh()}>Refresh ↻</button></div>
      {openSessions.length ? <div className="session-list">{openSessions.map(session => <article className="session-card" key={session.sessionCode}>
        <div><strong>{session.gameTemplate.name}</strong><div className="meta"><span>CODE {session.sessionCode}</span><span>{session.status}</span><span>{session._count.players} players</span></div></div>
        <div className="row"><Link className="btn ghost" href={`/host/${session.sessionCode}`}>Open host</Link><button className="btn danger-button" disabled={endingCode === session.sessionCode} onClick={() => endSession(session)}>{endingCode === session.sessionCode ? 'Ending…' : 'End session'}</button></div>
      </article>)}</div> : <p className="muted">No open sessions.</p>}
      {!!recentEnded.length && <div className="recent-ended"><h3>RECENTLY ENDED</h3>{recentEnded.map(session => <div key={session.sessionCode}><span>{session.gameTemplate.name} · {session.sessionCode}</span><Link href={`/host/${session.sessionCode}`}>View results →</Link></div>)}</div>}
    </section>
  </main>;
}
