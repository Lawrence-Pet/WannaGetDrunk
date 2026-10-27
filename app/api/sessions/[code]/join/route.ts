import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/server/engine';
import { joinSchema } from '@/lib/validation';
import { hash, token } from '@/lib/security';
const colors = ['#ff5a6c', '#579bff', '#ffd555', '#52d5a2', '#bd85ff', '#ff9b59'];
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params; const session = await getSession(code.toUpperCase());
    if (!session) return NextResponse.json({ error: 'GAME NOT FOUND' }, { status: 404 });
    if (session.status !== 'LOBBY') return NextResponse.json({ error: 'GAME ALREADY STARTED' }, { status: 409 });
    const data = joinSchema.parse(await request.json());
    if (session.gameTemplate.teamMode && !data.teamName) return NextResponse.json({ error: 'Choose a team' }, { status: 400 });
    if (session.players.some(p => p.displayName.toLocaleLowerCase() === data.displayName.toLocaleLowerCase())) return NextResponse.json({ error: 'NAME ALREADY TAKEN' }, { status: 409 });
    let teamId: string | null = null;
    if (session.gameTemplate.teamMode && data.teamName) {
      const key = data.teamName.toLocaleLowerCase(); const existing = session.teams.find(t => t.nameKey === key);
      if (existing) teamId = existing.id;
      else {
        if (session.gameTemplate.maxTeams && session.teams.length >= session.gameTemplate.maxTeams) return NextResponse.json({ error: 'Team limit reached. Join an existing team.' }, { status: 409 });
        const team = await db.team.create({ data: { gameSessionId: session.id, name: data.teamName, nameKey: key, color: colors[session.teams.length % colors.length] } }); teamId = team.id;
      }
    }
    const reconnectToken = token();
    const player = await db.player.create({ data: { gameSessionId: session.id, displayName: data.displayName, nameKey: data.displayName.toLocaleLowerCase(), teamId, reconnectTokenHash: hash(reconnectToken), connected: false } });
    return NextResponse.json({ playerId: player.id, token: reconnectToken }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to join' }, { status: 400 }); }
}
