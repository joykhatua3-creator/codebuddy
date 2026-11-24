import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'running',
      timestamp: new Date().toISOString(),
      framework: 'Next.js App Router',
      env: process.env.NODE_ENV,
    },
  });
}
