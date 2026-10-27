import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { portableGame, templateInclude } from '@/lib/templates';
import { localHostOnly } from '@/lib/hostAccess';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const denied = localHostOnly(request); if (denied) return denied; const { id } = await params; const game = await db.gameTemplate.findUnique({ where: { id }, include: templateInclude }); if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 }); return new Response(JSON.stringify(portableGame(game), null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'quiz'}.json"` } }); }
