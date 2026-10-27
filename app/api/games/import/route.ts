import { NextResponse } from 'next/server';
import { importSchema } from '@/lib/validation';
import { saveTemplate } from '@/lib/templates';
import { localHostOnly } from '@/lib/hostAccess';
export async function POST(request: Request) { const denied = localHostOnly(request); if (denied) return denied; try { const data = importSchema.parse(await request.json()); return NextResponse.json(await saveTemplate(data.game), { status: 201 }); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid import file' }, { status: 400 }); } }
