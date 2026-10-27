'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gameSchema } from '@/lib/validation';

type Answer = { text: string; isCorrect: boolean };
type Question = { text: string; countdownSeconds: number; answers: Answer[] };
type Game = {
  name: string;
  description: string;
  teamMode: boolean;
  maxTeams: number | null;
  autoActivateBuzzer: boolean;
  questions: Question[];
};

const freshQuestion = (): Question => ({
  text: '',
  countdownSeconds: 10,
  answers: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
});
const colors = ['RED', 'BLUE', 'YELLOW', 'GREEN'];

export default function Editor({ id }: { id?: string }) {
  const router = useRouter();
  const [game, setGame] = useState<Game>({
    name: '', description: '', teamMode: false, maxTeams: null,
    autoActivateBuzzer: false, questions: [freshQuestion()],
  });
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/games/${id}`).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); return; }
      setGame({
        name: d.name,
        description: d.description,
        teamMode: d.teamMode,
        maxTeams: d.maxTeams,
        autoActivateBuzzer: d.autoActivateBuzzer ?? false,
        questions: d.questions.map((q: { text: string; countdownSeconds: number; answers: Answer[] }) => ({
          text: q.text,
          countdownSeconds: q.countdownSeconds,
          answers: q.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })),
        })),
      });
    }).catch(() => setError('Could not load the quiz'));
  }, [id]);

  function changeQuestion(update: (question: Question) => Question) {
    setGame(current => ({
      ...current,
      questions: current.questions.map((question, index) => index === active ? update(question) : question),
    }));
  }

  function reorder(direction: number) {
    const to = active + direction;
    if (to < 0 || to >= game.questions.length) return;
    setGame(current => {
      const questions = [...current.questions];
      [questions[active], questions[to]] = [questions[to], questions[active]];
      return { ...current, questions };
    });
    setActive(to);
  }

  async function save() {
    setError('');
    setSaving(true);
    try {
      const response = await fetch(id ? `/api/games/${id}` : '/api/games', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      router.push('/setup');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save quiz');
    } finally {
      setSaving(false);
    }
  }

  const question = game.questions[active];
  const valid = gameSchema.safeParse(game).success;

  return <main className="shell">
    <header className="page-header">
      <Link href="/setup" className="brand">✦ WANNA GET DRUNK</Link>
      <Link href="/setup" className="small-link">← Back to games</Link>
    </header>
    <div className="section-head">
      <div>
        <div className="eyebrow">QUIZ BUILDER</div>
        <h1>{id ? 'Edit your quiz' : 'New quiz'}<span className="dot">.</span></h1>
        <p>Give the room something to shout about. {!valid && 'Fill in the quiz name, question, and every answer to save.'}</p>
      </div>
      <button className="btn primary" onClick={save} disabled={saving || !valid}>{saving ? 'Saving…' : 'Save quiz ↗'}</button>
    </div>
    {error && <div className="error">{error}</div>}
    <div className="editor-grid">
      <aside className="editor-sidebar">
        <div className="panel">
          <h3>THE BASICS</h3>
          <label>Quiz name<input value={game.name} maxLength={100} placeholder="Friday night trivia" onChange={event => setGame({ ...game, name: event.target.value })}/></label>
          <label>Description<textarea rows={2} value={game.description} maxLength={1000} placeholder="A little something about this quiz" onChange={event => setGame({ ...game, description: event.target.value })}/></label>
          <label className="check-row"><input type="checkbox" checked={game.teamMode} onChange={event => setGame({ ...game, teamMode: event.target.checked, maxTeams: null })}/> Team mode</label>
          {game.teamMode && <label>Maximum teams <small>(leave blank for unlimited)</small><input type="number" min={2} max={20} value={game.maxTeams ?? ''} onChange={event => setGame({ ...game, maxTeams: event.target.value ? Number(event.target.value) : null })}/></label>}
          <label className="check-row auto-buzzer-setting"><input type="checkbox" checked={game.autoActivateBuzzer} onChange={event => setGame({ ...game, autoActivateBuzzer: event.target.checked })}/> Automatically activate buzzer when each question starts</label>
          <p className="setting-help">{game.autoActivateBuzzer ? 'Answers appear and the buzzer opens as soon as each question starts.' : 'The host reveals the answers and opens the buzzer manually.'}</p>
        </div>
        <div className="panel question-nav">
          <h3>QUESTIONS <span>{game.questions.length}</span></h3>
          {game.questions.map((item, index) => <button key={index} className={active === index ? 'selected' : ''} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.text || 'Untitled question'}</button>)}
          <button className="add-question" onClick={() => { setGame(current => ({ ...current, questions: [...current.questions, freshQuestion()] })); setActive(game.questions.length); }}>+ Add question</button>
        </div>
      </aside>
      <section className="panel question-editor">
        <div className="editor-top">
          <div><div className="eyebrow">QUESTION {String(active + 1).padStart(2, '0')}</div><h2>Ask away.</h2></div>
          <div className="row">
            <button className="tiny" onClick={() => reorder(-1)} disabled={active === 0}>↑</button>
            <button className="tiny" onClick={() => reorder(1)} disabled={active === game.questions.length - 1}>↓</button>
            <button className="tiny" onClick={() => { setGame(current => ({ ...current, questions: [...current.questions, structuredClone(question)] })); setActive(game.questions.length); }}>Duplicate</button>
            <button className="tiny danger" disabled={game.questions.length === 1} onClick={() => { setGame(current => ({ ...current, questions: current.questions.filter((_, index) => index !== active) })); setActive(Math.max(0, active - 1)); }}>Delete</button>
          </div>
        </div>
        <label>Question text<textarea className="question-text" rows={3} value={question.text} maxLength={500} placeholder="What is the capital of Norway?" onChange={event => changeQuestion(current => ({ ...current, text: event.target.value }))}/></label>
        <div className="editor-subhead"><h3>ANSWER OPTIONS</h3><span>Select the one correct answer</span></div>
        <div className="answer-edit-list">
          {question.answers.map((answer, index) => <div className={`answer-edit answer-${index}${answer.isCorrect ? ' is-correct' : ''}`} key={index}>
            <span className="answer-letter">{colors[index][0]}</span>
            <input value={answer.text} maxLength={200} placeholder={`Answer ${index + 1}`} aria-label={`Answer ${index + 1}`} onChange={event => changeQuestion(current => ({ ...current, answers: current.answers.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))}/>
            <button type="button" className={`correct-choice${answer.isCorrect ? ' selected' : ''}`} aria-label={`Mark answer ${index + 1} as correct`} aria-pressed={answer.isCorrect} onClick={() => changeQuestion(current => ({ ...current, answers: current.answers.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === index })) }))}>{answer.isCorrect ? '✓ Correct answer' : 'Mark correct'}</button>
            <button className="remove-answer" aria-label={`Remove answer ${index + 1}`} disabled={question.answers.length <= 2} onClick={() => changeQuestion(current => {
              const answers = current.answers.filter((_, itemIndex) => itemIndex !== index);
              if (!answers.some(item => item.isCorrect)) return { ...current, answers: answers.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === 0 })) };
              return { ...current, answers };
            })}>×</button>
          </div>)}
        </div>
        <div className="editor-bottom">
          <button className="small-link" disabled={question.answers.length >= 4} onClick={() => changeQuestion(current => ({ ...current, answers: [...current.answers, { text: '', isCorrect: false }] }))}>+ Add answer</button>
          <label>Answer timer <select value={question.countdownSeconds} onChange={event => changeQuestion(current => ({ ...current, countdownSeconds: Number(event.target.value) }))}>{[3, 5, 10, 15, 20, 30, 45, 60].map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label>
        </div>
      </section>
    </div>
  </main>;
}
