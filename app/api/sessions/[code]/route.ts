import { NextResponse } from 'next/server';
import { getSession, publicState } from '@/server/engine';
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) { const { code } = await params; const session = await getSession(code.toUpperCase()); return session ? NextResponse.json(publicState(session)) : NextResponse.json({ error: 'Game not found' }, { status: 404 }); }
