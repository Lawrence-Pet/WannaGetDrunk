import { NextResponse } from 'next/server';
import { networkInterfaces } from 'node:os';
export async function GET() { const addresses = Object.values(networkInterfaces()).flatMap(list => list ?? []).filter(a => a.family === 'IPv4' && !a.internal).map(a => a.address); return NextResponse.json({ addresses }); }
