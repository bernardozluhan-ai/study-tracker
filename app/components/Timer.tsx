'use client'
import { useRef, useState } from 'react'

type Subject = { id: number; name: string }
type Props = { subjects: Subject[]; onStop: () => void }

export default function Timer({ subjects, onStop }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  function start() {
    setRunning(true)
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  function pause() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  async function stop() {
    pause()
    if (elapsed > 0 && selectedId) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedId, duration: elapsed }),
      })
      onStop()
    }
    setElapsed(0)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-medium text-gray-400">Cronômetro</h2>
      <select
        className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white"
        value={selectedId ?? ''}
        onChange={e => setSelectedId(Number(e.target.value))}
      >
        <option value="">Selecione a matéria...</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <p className="text-4xl font-mono text-center text-white">{fmt(elapsed)}</p>
      <div className="flex gap-2 justify-center">
        {!running
          ? <button onClick={start} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm text-white">▶ Start</button>
          : <button onClick={pause} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm text-white">⏸ Pause</button>
        }
        <button onClick={stop} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg text-sm text-white">⏹ Stop</button>
      </div>
    </div>
  )
}