import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, token } from '@/lib/security';
import { randomBytes } from 'node:crypto';
import { localHostOnly } from '@/lib/hostAccess';
export async function GET(request: Request) {
  const denied = localHostOnly(request); if (denied) return denied;
  return NextResponse.json(await db.gameSession.findMany({
    orderBy: { createdAt: 'desc' }, take: 50,
    select: { sessionCode: true, gameTemplateId: true, status: true, phase: true, createdAt: true, endedAt: true, gameTemplate: { select: { name: true } }, _count: { select: { players: true } } },
  }));
}
export async function POST(request: Request) {
  const denied = localHostOnly(request); if (denied) return denied;
  try {
    const { gameTemplateId } = await request.json();
    if (typeof gameTemplateId !== 'string' || !await db.gameTemplate.findFirst({ where: { id: gameTemplateId, archived: false } })) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    const hostToken = token(); let session;
    for (let tries = 0; tries < 5; tries++) {
      const code = randomBytes(5).toString('hex').slice(0, 6).toUpperCase();
      try { session = await db.gameSession.create({ data: { gameTemplateId, sessionCode: code, hostTokenHash: hash(hostToken) } }); break; } catch { /* retry collision */ }
    }
    if (!session) throw Error('Unable to create a unique session');
    const response = NextResponse.json({ code: session.sessionCode }, { status: 201 });
    response.cookies.set(`host_${session.sessionCode}`, hostToken, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production' && request.url.startsWith('https:') });
    return response;
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to create session' }, { status: 400 }); }
}
