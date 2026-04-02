import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request) {
  const { subjectId, count } = await req.json()
  const log = await prisma.questionLog.create({
    data: {
      subjectId: Number(subjectId),
      count: Number(count),
    },
  })
  return NextResponse.json(log)
}

export async function GET() {
  const logs = await prisma.questionLog.findMany({
    orderBy: { date: 'desc' },
    include: { subject: true },
  })
  return NextResponse.json(logs)
}