import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSchema } from '@/lib/validation';
import { saveTemplate } from '@/lib/templates';
import { localHostOnly } from '@/lib/hostAccess';
export async function GET(request: Request) { const denied = localHostOnly(request); if (denied) return denied; return NextResponse.json(await db.gameTemplate.findMany({ where: { archived: false }, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, description: true, teamMode: true, maxTeams: true, updatedAt: true, _count: { select: { questions: true } } } })); }
export async function POST(request: Request) { const denied = localHostOnly(request); if (denied) return denied; try { const game = gameSchema.parse(await request.json()); return NextResponse.json(await saveTemplate(game), { status: 201 }); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid game' }, { status: 400 }); } }
