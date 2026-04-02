'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

type Subject = { id: number; name: string; weeklyGoal: number }
type DashData = {
  totalMinutes: number
  totalQuestions: number
  subjectCount: number
  bySubject: { id: number; name: string; weeklyGoal: number; minutes: number; questions: number }[]
  daily: { date: string; questions: number; minutes: number }[]
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [dash, setDash] = useState<DashData | null>(null)
  const [newName, setNewName] = useState('')
  const [newGoal, setNewGoal] = useState('40')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [qCount, setQCount] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  async function load() {
    const [s, d] = await Promise.all([
      fetch('/api/subjects').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ])
    setSubjects(s)
    setDash(d)
  }

  useEffect(() => { load() }, [])

  function startTimer() {
    setRunning(true)
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  function pauseTimer() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  async function stopTimer() {
    pauseTimer()
    if (elapsed > 0 && selectedId) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedId, duration: elapsed }),
      })
      await load()
    }
    setElapsed(0)
  }

  async function addSubject() {
    if (!newName.trim()) return
    await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, weeklyGoal: newGoal }),
    })
    setNewName('')
    setNewGoal('40')
    await load()
  }

  async function logQuestions() {
    if (!qCount || !selectedId) return
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: selectedId, count: qCount }),
    })
    setQCount('')
    await load()
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <h1 className="text-2xl font-semibold mb-6">📚 Study Tracker</h1>

      {/* Métricas */}
      {dash && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Horas estudadas', value: `${Math.floor(dash.totalMinutes / 3600)}h ${Math.floor((dash.totalMinutes % 3600) / 60)}m` },
            { label: 'Questões resolvidas', value: dash.totalQuestions },
            { label: 'Matérias ativas', value: dash.subjectCount },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{m.label}</p>
              <p className="text-2xl font-semibold">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Cronômetro */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Cronômetro</h2>
          <select
            className="w-full bg-gray-800 rounded-lg p-2 mb-4 text-sm"
            value={selectedId ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            <option value="">Selecione a matéria...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p className="text-4xl font-mono text-center mb-4">{fmt(elapsed)}</p>
          <div className="flex gap-2 justify-center">
            {!running
              ? <button onClick={startTimer} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">▶ Start</button>
              : <button onClick={pauseTimer} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm">⏸ Pause</button>
            }
            <button onClick={stopTimer} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg text-sm">⏹ Stop</button>
          </div>
        </div>

        {/* Registro de questões */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Registrar questões</h2>
          <select
            className="w-full bg-gray-800 rounded-lg p-2 mb-3 text-sm"
            value={selectedId ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            <option value="">Selecione a matéria...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            type="number"
            placeholder="Quantas questões?"
            className="w-full bg-gray-800 rounded-lg p-2 mb-3 text-sm"
            value={qCount}
            onChange={e => setQCount(e.target.value)}
          />
          <button onClick={logQuestions} className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded-lg text-sm">
            Salvar questões
          </button>

          {/* Meta semanal */}
          {dash && (
            <div className="mt-4 space-y-2">
              {dash.bySubject.map(s => (
                <div key={s.id}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{s.name}</span>
                    <span>{s.questions}/{s.weeklyGoal}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round(s.questions / s.weeklyGoal * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráficos */}
      {dash && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Tempo por matéria (min)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dash.bySubject}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none' }} />
                <Bar dataKey="minutes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Evolução diária</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dash.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="questions" stroke="#7c3aed" dot={false} />
                <Line type="monotone" dataKey="minutes" stroke="#10b981" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cadastro de matérias */}
      <div className="bg-gray-900 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Cadastrar matéria</h2>
        <div className="flex gap-3">
          <input
            placeholder="Nome da matéria"
            className="flex-1 bg-gray-800 rounded-lg p-2 text-sm"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Meta semanal"
            className="w-32 bg-gray-800 rounded-lg p-2 text-sm"
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
          />
          <button onClick={addSubject} className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg text-sm">
            Adicionar
          </button>
        </div>
      </div>
    </main>
  )
}