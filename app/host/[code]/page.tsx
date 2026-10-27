import Host from './screen';
export default async function HostPage({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <Host code={code.toUpperCase()}/>; }
