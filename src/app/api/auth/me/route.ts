// src/app/api/auth/me/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const verified = await verifyAuth(token);

  if (verified.success) {
    return NextResponse.json({ success: true, data: verified.payload }, { status: 200 });
  } else {
    return NextResponse.json({ success: false, message: verified.message }, { status: 401 });
  }
}
