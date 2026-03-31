'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Badge, ProgressBar } from '@/components/ui/badge'
import { addToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import {
  Plus, Trophy, Target, Calendar, TrendingUp, Edit2, Trash2,
  CheckCircle2, Clock, MoreVertical
} from 'lucide-react'
import { getDaysUntil, getProgressPercentage, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Resolution {
  id: string
  title: string
  description?: string | null
  targetValue: number
  currentValue: number
  unit?: string | null
  deadline: string
  reward?: string | null
  category?: string | null
  color?: string | null
  isCompleted: boolean
  createdAt: string
}

const RESOLUTION_COLORS = ['#8b5cf6', '#059669', '#10b981', '#f59e0b', '#ef4444']
const CATEGORIES = ['Personal', 'Health', 'Finance', 'Career', 'Education', 'Fitness', 'Relationships', 'Hobbies']

function ResolutionCard({ resolution, onUpdate, onEdit, onDelete }: {
  resolution: Resolution
  onUpdate: (id: string, value: number) => void
  onEdit: (r: Resolution) => void
  onDelete: (id: string) => void
}) {
  const progress = getProgressPercentage(resolution.currentValue, resolution.targetValue)
  const daysLeft = getDaysUntil(resolution.deadline)
  const color = resolution.color || '#8b5cf6'
  const [menuOpen, setMenuOpen] = useState(false)
  const [inputVal, setInputVal] = useState(String(resolution.currentValue))
  const [editing, setEditing] = useState(false)

  const handleUpdate = () => {
    const val = parseFloat(inputVal)
    if (!isNaN(val) && val >= 0) {
      onUpdate(resolution.id, val)
      setEditing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200 bg-gray-50 p-5 relative overflow-hidden"
    >
      {resolution.isCompleted && (
        <div className="absolute top-3 right-3">
          <Badge variant="success" size="sm">✓ Completed</Badge>
        </div>
      )}
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at 0% 0%, ${color}, transparent)` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3 pr-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{resolution.category}</p>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{resolution.title}</h3>
            {resolution.description && (
              <p className="text-xs text-gray-500 mt-1">{resolution.description}</p>
            )}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-xl border border-gray-200 bg-gray-50 shadow-xl">
                  <button onClick={() => { onEdit(resolution); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => { onDelete(resolution.id); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{resolution.currentValue}</span>
              <span className="text-gray-500 text-sm">/ {resolution.targetValue} {resolution.unit}</span>
            </div>
            <span className="text-lg font-bold" style={{ color }}>{progress}%</span>
          </div>
          <ProgressBar value={progress} max={100} color={color} size="lg" />
        </div>

        {/* Update progress */}
        {!resolution.isCompleted && (
          <div className="flex items-center gap-2 mb-4">
            {editing ? (
              <>
                <input
                  type="number"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-emerald-500/50 focus:outline-none"
                />
                <Button size="sm" onClick={handleUpdate}>Update</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="sm" variant="glass" icon={<TrendingUp className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>
                Update Progress
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(resolution.deadline)}</span>
          </div>
          {!resolution.isCompleted && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className={daysLeft < 30 ? 'text-orange-400' : ''}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
              </span>
            </div>
          )}
          {resolution.reward && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="h-3.5 w-3.5" />
              <span className="truncate max-w-[150px]">{resolution.reward}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ResolutionForm({
  open, onClose, onSuccess, editData
}: {
  open: boolean; onClose: () => void; onSuccess: () => void; editData?: Resolution | null
}) {
  const isEditing = !!editData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    targetValue: editData?.targetValue || 100,
    currentValue: editData?.currentValue || 0,
    unit: editData?.unit || '',
    deadline: editData?.deadline
      ? new Date(editData.deadline).toISOString().split('T')[0]
      : new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    reward: editData?.reward || '',
    category: editData?.category || 'Personal',
    color: editData?.color || '#8b5cf6',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEditing ? `/api/resolutions/${editData!.id}` : '/api/resolutions'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, targetValue: Number(form.targetValue), currentValue: Number(form.currentValue) }),
      })
      if (res.ok) {
        addToast({ type: 'success', title: isEditing ? 'Resolution updated!' : 'Resolution created! 🎯' })
        onSuccess(); onClose()
      } else {
        addToast({ type: 'error', title: 'Failed to save' })
      }
    } catch {
      addToast({ type: 'error', title: 'Network error' })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Resolution' : 'New Yearly Resolution'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title *" placeholder="e.g., Read 24 books this year..." value={form.title}
          onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required />
        <Textarea label="Description" placeholder="Why is this important to you?" value={form.description}
          onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Target *" type="number" value={form.targetValue}
            onChange={(e) => setForm(p => ({ ...p, targetValue: parseFloat(e.target.value) || 0 }))} required />
          <Input label="Current" type="number" value={form.currentValue}
            onChange={(e) => setForm(p => ({ ...p, currentValue: parseFloat(e.target.value) || 0 }))} />
          <Input label="Unit" placeholder="books, km, kg..." value={form.unit}
            onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category}
            onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
            options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          <Input label="Deadline" type="date" value={form.deadline}
            onChange={(e) => setForm(p => ({ ...p, deadline: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2">
            {RESOLUTION_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                className={cn('h-7 w-7 rounded-full transition-all', form.color === c && 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a] scale-110')}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <Input label="Reward (optional)" placeholder="What do you get when you complete this?" value={form.reward}
          onChange={(e) => setForm(p => ({ ...p, reward: e.target.value }))} />
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">{isEditing ? 'Update' : 'Create Resolution'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ResolutionsPage() {
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<Resolution | null>(null)

  const fetchResolutions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/resolutions')
      if (res.ok) { const { data } = await res.json(); setResolutions(data) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchResolutions() }, [fetchResolutions])

  const handleUpdate = async (id: string, currentValue: number) => {
    try {
      const res = await fetch(`/api/resolutions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue }),
      })
      if (res.ok) { addToast({ type: 'success', title: 'Progress updated!' }); fetchResolutions() }
    } catch { addToast({ type: 'error', title: 'Failed to update' }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resolution?')) return
    const res = await fetch(`/api/resolutions/${id}`, { method: 'DELETE' })
    if (res.ok) { addToast({ type: 'success', title: 'Resolution deleted' }); fetchResolutions() }
  }

  const completed = resolutions.filter(r => r.isCompleted).length
  const inProgress = resolutions.filter(r => !r.isCompleted).length
  const avgProgress = resolutions.length > 0
    ? Math.round(resolutions.reduce((s, r) => s + getProgressPercentage(r.currentValue, r.targetValue), 0) / resolutions.length)
    : 0

  return (
    <div className="flex flex-col h-full">
      <Header title="Yearly Resolutions" subtitle={`${new Date().getFullYear()} Goals`} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: resolutions.length, color: '#8b5cf6' },
            { label: 'Completed', value: completed, color: '#10b981' },
            { label: 'Avg Progress', value: `${avgProgress}%`, color: '#059669' },
          ].map(s => (
            <Card key={s.label} glass className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditData(null); setFormOpen(true) }}>
            New Resolution
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          </div>
        ) : resolutions.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Trophy className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No resolutions yet</p>
            <p className="text-sm mt-1 opacity-70">Set your {new Date().getFullYear()} goals</p>
            <Button className="mt-4" onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Add Resolution
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {resolutions.map((r) => (
              <ResolutionCard
                key={r.id} resolution={r}
                onUpdate={handleUpdate}
                onEdit={(r) => { setEditData(r); setFormOpen(true) }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
      <ResolutionForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null) }}
        onSuccess={fetchResolutions} editData={editData} />
    </div>
  )
}
