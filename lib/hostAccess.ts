import { NextResponse } from 'next/server';
export function localHostOnly(request: Request) { return request.headers.get('x-wgd-local') === '1' ? null : NextResponse.json({ error: 'Host setup is available only on the server computer through localhost.' }, { status: 403 }); }
