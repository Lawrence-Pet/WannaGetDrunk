import Editor from '../editor';
export default async function EditGame({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Editor id={id}/>; }
