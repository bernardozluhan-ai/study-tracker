import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const subjects = await prisma.subject.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(subjects)
}

export async function POST(req: Request) {
  const { name, weeklyGoal } = await req.json()
  const subject = await prisma.subject.create({
    data: { name, weeklyGoal: Number(weeklyGoal) },
  })
  return NextResponse.json(subject)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await prisma.subject.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}