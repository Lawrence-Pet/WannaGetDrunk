import { db } from './db';
import type { GameInput } from './validation';
export const templateInclude = { questions: { orderBy: { displayOrder: 'asc' as const }, include: { answers: { orderBy: { displayOrder: 'asc' as const } } } } };
export async function saveTemplate(game: GameInput, id?: string, archiveId?: string) {
  return db.$transaction(async tx => {
    if (archiveId) await tx.gameTemplate.update({ where: { id: archiveId }, data: { archived: true } });
    if (id) {
      await tx.gameTemplate.update({ where: { id }, data: { name: game.name, description: game.description, teamMode: game.teamMode, maxTeams: game.maxTeams, autoActivateBuzzer: game.autoActivateBuzzer } });
      await tx.question.deleteMany({ where: { gameTemplateId: id } });
    }
    const template = id ? { id } : await tx.gameTemplate.create({ data: { name: game.name, description: game.description, teamMode: game.teamMode, maxTeams: game.maxTeams, autoActivateBuzzer: game.autoActivateBuzzer } });
    for (let i = 0; i < game.questions.length; i++) {
      const q = game.questions[i];
      await tx.question.create({ data: { gameTemplateId: template.id, text: q.text, displayOrder: i, countdownSeconds: q.countdownSeconds, answers: { create: q.answers.map((a, j) => ({ text: a.text, displayOrder: j, isCorrect: a.isCorrect })) } } });
    }
    return tx.gameTemplate.findUniqueOrThrow({ where: { id: template.id }, include: templateInclude });
  });
}
export function portableGame(t: Awaited<ReturnType<typeof saveTemplate>>) {
  return { schemaVersion: 1, game: { name: t.name, description: t.description, teamMode: t.teamMode, maxTeams: t.maxTeams, autoActivateBuzzer: t.autoActivateBuzzer, questions: t.questions.map(q => ({ text: q.text, countdownSeconds: q.countdownSeconds, answers: q.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })) })) } };
}
