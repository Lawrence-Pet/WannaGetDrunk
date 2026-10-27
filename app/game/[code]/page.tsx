import Player from './screen';
export default async function PlayerPage({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <Player code={code.toUpperCase()}/>; }
