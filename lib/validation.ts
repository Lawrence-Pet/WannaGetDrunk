import { z } from 'zod';
export const answerSchema = z.object({ text: z.string().trim().min(1).max(200), isCorrect: z.boolean() });
export const questionSchema = z.object({ text: z.string().trim().min(1).max(500), countdownSeconds: z.number().int().min(3).max(60), answers: z.array(answerSchema).min(2).max(4).refine(a => a.filter(x => x.isCorrect).length === 1, 'Exactly one answer must be correct') });
export const gameSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(1000).default(''), teamMode: z.boolean(), maxTeams: z.number().int().min(2).max(20).nullable().default(null), autoActivateBuzzer: z.boolean().default(false), questions: z.array(questionSchema).min(1).max(100) }).refine(g => g.teamMode || g.maxTeams === null, 'Team limit requires team mode');
export const importSchema = z.object({ schemaVersion: z.literal(1), game: gameSchema });
export type GameInput = z.infer<typeof gameSchema>;
export const joinSchema = z.object({ displayName: z.string().trim().min(1).max(24), teamName: z.string().trim().min(1).max(24).optional() });
