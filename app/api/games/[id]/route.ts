import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSchema } from '@/lib/validation';
import { saveTemplate, templateInclude } from '@/lib/templates';
import { localHostOnly } from '@/lib/hostAccess';

type Ctx = { params: Promise<{ id: string }> };
const activeStatus = { notIn: ['ENDED', 'COMPLETE'] };

export async function GET(request: Request, { params }: Ctx) {
  const denied = localHostOnly(request); if (denied) return denied;
  const { id } = await params;
  const game = await db.gameTemplate.findUnique({ where: { id }, include: templateInclude });
  return game ? NextResponse.json(game) : NextResponse.json({ error: 'Game not found' }, { status: 404 });
}

export async function PUT(request: Request, { params }: Ctx) {
  const denied = localHostOnly(request); if (denied) return denied;
  try {
    const { id } = await params;
    const existing = await db.gameTemplate.findUnique({ where: { id } });
    if (!existing || existing.archived) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    const active = await db.gameSession.count({ where: { gameTemplateId: id, status: activeStatus } });
    if (active) return NextResponse.json({ error: 'End this quiz’s active sessions before editing it.' }, { status: 409 });
    const game = gameSchema.parse(await request.json());
    const historical = await db.gameSession.count({ where: { gameTemplateId: id } });
    return NextResponse.json(await saveTemplate(game, historical ? undefined : id, historical ? id : undefined));
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Invalid game' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const denied = localHostOnly(request); if (denied) return denied;
  const { id } = await params;
  const existing = await db.gameTemplate.findUnique({ where: { id } });
  if (!existing || existing.archived) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (await db.gameSession.count({ where: { gameTemplateId: id, status: activeStatus } })) return NextResponse.json({ error: 'End this quiz’s active sessions before deleting it.' }, { status: 409 });
  if (await db.gameSession.count({ where: { gameTemplateId: id } })) await db.gameTemplate.update({ where: { id }, data: { archived: true } });
  else await db.gameTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
