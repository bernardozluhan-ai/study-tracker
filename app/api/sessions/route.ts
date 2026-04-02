import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request) {
  const { subjectId, duration } = await req.json()
  const session = await prisma.studySession.create({
    data: {
      subjectId: Number(subjectId),
      duration: Number(duration),
    },
  })
  return NextResponse.json(session)
}

export async function GET() {
  const sessions = await prisma.studySession.findMany({
    orderBy: { date: 'desc' },
    include: { subject: true },
  })
  return NextResponse.json(sessions)
}