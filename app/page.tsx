'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import MetricCard from './components/MetricCard'
import Timer from './components/Timer'
import QuestionLogger from './components/QuestionLogger'
import SubjectManager from './components/SubjectManager'

type Subject = { id: number; name: string; weeklyGoal: number; archived: boolean }
type DashData = {
  totalMinutes: number
  totalQuestions: number
  subjectCount: number
  bySubject: { id: number; name: string; weeklyGoal: number; archived: boolean; minutes: number; questions: number }[]
  daily: { date: string; questions: number; minutes: number }[]
  historical: { month: string; minutes: number; questions: number }[]
  goalProgress: { name: string; done: number; goal: number; pct: number }[]
}

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']
type Filter = 'weekly' | 'monthly' | 'alltime'

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [dash, setDash] = useState<DashData | null>(null)
  const [filter, setFilter] = useState<Filter>('weekly')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([
        fetch('/api/subjects').then(r => r.json()),
        fetch(`/api/dashboard?filter=${filter}`).then(r => r.json()),
      ])
      setSubjects(s)
      setDash(d)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const activeSubjects = subjects.filter(s => !s.archived)
  const fmtHours = (mins: number) => `${Math.floor(mins / 3600)}h ${Math.floor((mins % 3600) / 60)}m`

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">📚 Study Tracker</h1>
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'alltime'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm ${filter === f ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {f === 'weekly' ? 'Semanal' : f === 'monthly' ? 'Mensal' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Métricas */}
          {dash && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricCard label="Horas estudadas" value={fmtHours(dash.totalMinutes)} />
              <MetricCard label="Questões resolvidas" value={dash.totalQuestions} />
              <MetricCard label="Matérias ativas" value={dash.subjectCount} />
            </div>
          )}

          {/* Cronômetro + Questões */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Timer subjects={activeSubjects} onStop={load} />
            <QuestionLogger subjects={dash?.bySubject.filter(s => !s.archived) ?? []} onSave={load} />
          </div>

          {/* Gráficos */}
          {dash && (
            <>
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Barras por matéria */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-400 mb-4">Tempo por matéria (min)</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dash.bySubject}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ background: '#111827', border: 'none' }} />
                      <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                        {dash.bySubject.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pizza distribuição */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-400 mb-4">Distribuição de esforço</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dash.bySubject} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}>
                        {dash.bySubject.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#111827', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Linha diária */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-400 mb-4">Evolução diária</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dash.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ background: '#111827', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="questions" stroke="#7c3aed" dot={false} name="Questões" />
                      <Line type="monotone" dataKey="minutes" stroke="#10b981" dot={false} name="Minutos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Histórico mensal */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-gray-400 mb-4">Histórico mensal</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dash.historical}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ background: '#111827', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="questions" stroke="#7c3aed" dot={false} name="Questões" />
                      <Line type="monotone" dataKey="minutes" stroke="#10b981" dot={false} name="Minutos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Metas semanais */}
              <div className="bg-gray-900 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-medium text-gray-400 mb-4">Cumprimento de metas — semana atual</h2>
                <div className="grid grid-cols-2 gap-4">
                  {dash.goalProgress.map((g, i) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{g.name}</span>
                        <span>{g.done}/{g.goal} {g.pct >= 100 ? '✅' : ''}</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${g.pct}%`, background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{g.pct}% da meta</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Gerenciar matérias */}
          <SubjectManager subjects={subjects} onUpdate={load} />
        </>
      )}
    </main>
  )
}