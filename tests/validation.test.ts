import { describe, expect, it } from 'vitest';
import { gameSchema } from '../lib/validation';
const game = { name: 'Quiz', description: '', teamMode: false, maxTeams: null, questions: [{ text: 'Question?', countdownSeconds: 10, answers: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] }] };
describe('game validation', () => {
  it('accepts a valid game', () => expect(gameSchema.safeParse(game).success).toBe(true));
  it('requires exactly one correct answer', () => expect(gameSchema.safeParse({ ...game, questions: [{ ...game.questions[0], answers: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }] }] }).success).toBe(false));
  it('requires two to four answers and a bounded countdown', () => { expect(gameSchema.safeParse({ ...game, questions: [{ ...game.questions[0], answers: [game.questions[0].answers[0]] }] }).success).toBe(false); expect(gameSchema.safeParse({ ...game, questions: [{ ...game.questions[0], countdownSeconds: 61 }] }).success).toBe(false); });
  it('defaults automatic buzzer activation off for older exports', () => expect(gameSchema.parse(game).autoActivateBuzzer).toBe(false));
});
