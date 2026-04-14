'use client'
import { useState } from 'react'

type Subject = { id: number; name: string; weeklyGoal: number; archived: boolean }
type Props = { subjects: Subject[]; onUpdate: () => void }

export default function SubjectManager({ subjects, onUpdate }: Props) {
  const [newName, setNewName] = useState('')
  const [newGoal, setNewGoal] = useState('40')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  async function add() {
    if (!newName.trim()) return
    await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, weeklyGoal: newGoal }),
    })
    setNewName('')
    setNewGoal('40')
    onUpdate()
  }

  async function save(id: number) {
    await fetch('/api/subjects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName, weeklyGoal: editGoal }),
    })
    setEditId(null)
    onUpdate()
  }

  async function archive(id: number, archived: boolean) {
    await fetch('/api/subjects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived }),
    })
    onUpdate()
  }

  const active = subjects.filter(s => !s.archived)
  const archived = subjects.filter(s => s.archived)

  return (
    <div className="bg-gray-900 rounded-xl p-5">
      <h2 className="text-sm font-medium text-gray-400 mb-4">Gerenciar matérias</h2>

      {/* Cadastro */}
      <div className="flex gap-2 mb-5">
        <input placeholder="Nome da matéria" className="flex-1 bg-gray-800 rounded-lg p-2 text-sm text-white"
          value={newName} onChange={e => setNewName(e.target.value)} />
        <input type="number" placeholder="Meta" className="w-24 bg-gray-800 rounded-lg p-2 text-sm text-white"
          value={newGoal} onChange={e => setNewGoal(e.target.value)} />
        <button onClick={add} className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg text-sm text-white">
          Adicionar
        </button>
      </div>

      {/* Lista ativa */}
      <div className="space-y-2">
        {active.map(s => (
          <div key={s.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
            {editId === s.id ? (
              <>
                <input className="flex-1 bg-gray-700 rounded p-1 text-sm text-white"
                  value={editName} onChange={e => setEditName(e.target.value)} />
                <input type="number" className="w-20 bg-gray-700 rounded p-1 text-sm text-white"
                  value={editGoal} onChange={e => setEditGoal(e.target.value)} />
                <button onClick={() => save(s.id)} className="text-xs bg-green-700 hover:bg-green-800 px-2 py-1 rounded text-white">Salvar</button>
                <button onClick={() => setEditId(null)} className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-white">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-white">{s.name}</span>
                <span className="text-xs text-gray-400">meta: {s.weeklyGoal}</span>
                <button onClick={() => { setEditId(s.id); setEditName(s.name); setEditGoal(String(s.weeklyGoal)) }}
                  className="text-xs bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-white">Editar</button>
                <button onClick={() => archive(s.id, true)}
                  className="text-xs bg-yellow-700 hover:bg-yellow-800 px-2 py-1 rounded text-white">Arquivar</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Arquivadas */}
      {archived.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowArchived(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 mb-2">
            {showArchived ? '▲' : '▼'} Arquivadas ({archived.length})
          </button>
          {showArchived && archived.map(s => (
            <div key={s.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-2 mb-2 opacity-50">
              <span className="flex-1 text-sm text-white line-through">{s.name}</span>
              <button onClick={() => archive(s.id, false)}
                className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-white">Restaurar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}