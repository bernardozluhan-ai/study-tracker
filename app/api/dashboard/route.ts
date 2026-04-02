import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const subjects = await prisma.subject.findMany()

  const sessions = await prisma.studySession.findMany({
    where: { date: { gte: since } },
    include: { subject: true },
  })

  const questions = await prisma.questionLog.findMany({
    where: { date: { gte: since } },
    include: { subject: true },
  })

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalQuestions = questions.reduce((acc, q) => acc + q.count, 0)

  const bySubject = subjects.map((sub) => {
    const mins = sessions
      .filter((s) => s.subjectId === sub.id)
      .reduce((acc, s) => acc + s.duration, 0)
    const qs = questions
      .filter((q) => q.subjectId === sub.id)
      .reduce((acc, q) => acc + q.count, 0)
    return {
      id: sub.id,
      name: sub.name,
      weeklyGoal: sub.weeklyGoal,
      minutes: mins,
      questions: qs,
    }
  })

  const dailyMap: Record<string, { questions: number; minutes: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = { questions: 0, minutes: 0 }
  }
  sessions.forEach((s) => {
    const key = s.date.toISOString().slice(0, 10)
    if (dailyMap[key]) dailyMap[key].minutes += s.duration
  })
  questions.forEach((q) => {
    const key = q.date.toISOString().slice(0, 10)
    if (dailyMap[key]) dailyMap[key].questions += q.count
  })
  const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

  return NextResponse.json({
    totalMinutes,
    totalQuestions,
    subjectCount: subjects.length,
    bySubject,
    daily,
  })
}