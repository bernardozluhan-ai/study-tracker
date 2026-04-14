'use client'
import { useState } from 'react'

type Subject = { id: number; name: string; weeklyGoal: number; questions: number }
type Props = { subjects: Subject[]; onSave: () => void }

export default function QuestionLogger({ subjects, onSave }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [count, setCount] = useState('')

  async function save() {
    if (!count || !selectedId) return
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: selectedId, count }),
    })
    setCount('')
    onSave()
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-3">
      <h2 className="text-sm font-medium text-gray-400">Registrar questões</h2>
      <select
        className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white"
        value={selectedId ?? ''}
        onChange={e => setSelectedId(Number(e.target.value))}
      >
        <option value="">Selecione a matéria...</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input
        type="number"
        placeholder="Quantas questões?"
        className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white"
        value={count}
        onChange={e => setCount(e.target.value)}
      />
      <button onClick={save} className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded-lg text-sm text-white">
        Salvar questões
      </button>
      <div className="space-y-2 mt-2">
        {subjects.map(s => (
          <div key={s.id}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{s.name}</span>
              <span>{s.questions}/{s.weeklyGoal}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((s.questions / s.weeklyGoal) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}