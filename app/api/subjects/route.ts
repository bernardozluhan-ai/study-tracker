import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'weekly'

  let since: Date | undefined
  const now = new Date()
  if (filter === 'weekly') {
    since = new Date()
    since.setDate(now.getDate() - 7)
  } else if (filter === 'monthly') {
    since = new Date()
    since.setMonth(now.getMonth() - 1)
  }

  const subjects = await prisma.subject.findMany()

  const sessions = await prisma.studySession.findMany({
    where: since ? { date: { gte: since } } : undefined,
    include: { subject: true },
    orderBy: { date: 'asc' },
  })

  const questions = await prisma.questionLog.findMany({
    where: since ? { date: { gte: since } } : undefined,
    include: { subject: true },
    orderBy: { date: 'asc' },
  })

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalQuestions = questions.reduce((acc, q) => acc + q.count, 0)

  const bySubject = subjects.map((sub) => {
    const mins = sessions.filter(s => s.subjectId === sub.id).reduce((a, s) => a + s.duration, 0)
    const qs = questions.filter(q => q.subjectId === sub.id).reduce((a, q) => a + q.count, 0)
    return { id: sub.id, name: sub.name, weeklyGoal: sub.weeklyGoal, archived: sub.archived, minutes: mins, questions: qs }
  })

  // Weekly goal progress (current week)
  const weekStart = new Date()
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekQuestions = await prisma.questionLog.findMany({
    where: { date: { gte: weekStart } },
    include: { subject: true },
  })
  const goalProgress = subjects
    .filter(s => !s.archived)
    .map(sub => {
      const done = weekQuestions.filter(q => q.subjectId === sub.id).reduce((a, q) => a + q.count, 0)
      return { name: sub.name, done, goal: sub.weeklyGoal, pct: Math.min(100, Math.round((done / sub.weeklyGoal) * 100)) }
    })

  // Historical monthly trend
  const allSessions = await prisma.studySession.findMany({ orderBy: { date: 'asc' } })
  const allQuestions = await prisma.questionLog.findMany({ orderBy: { date: 'asc' } })
  const monthMap: Record<string, { minutes: number; questions: number }> = {}
  allSessions.forEach(s => {
    const key = s.date.toISOString().slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { minutes: 0, questions: 0 }
    monthMap[key].minutes += s.duration
  })
  allQuestions.forEach(q => {
    const key = q.date.toISOString().slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { minutes: 0, questions: 0 }
    monthMap[key].questions += q.count
  })
  const historical = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }))

  // Daily for line chart
  const days = filter === 'monthly' ? 30 : 7
  const dailyMap: Record<string, { questions: number; minutes: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dailyMap[d.toISOString().slice(0, 10)] = { questions: 0, minutes: 0 }
  }
  sessions.forEach(s => {
    const key = s.date.toISOString().slice(0, 10)
    if (dailyMap[key]) dailyMap[key].minutes += s.duration
  })
  questions.forEach(q => {
    const key = q.date.toISOString().slice(0, 10)
    if (dailyMap[key]) dailyMap[key].questions += q.count
  })
  const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

  return NextResponse.json({ totalMinutes, totalQuestions, subjectCount: subjects.filter(s => !s.archived).length, bySubject, daily, historical, goalProgress })
}