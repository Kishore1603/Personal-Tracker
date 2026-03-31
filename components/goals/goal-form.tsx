'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addToast } from '@/hooks/use-toast'
import { DAYS_OF_WEEK } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: string
    title: string
    description?: string | null
    isScheduled: boolean
    scheduleDays: string[]
    reward?: string | null
    pointValue: number
    color?: string | null
  }
}

const GOAL_COLORS = ['#059669', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6']

export function GoalForm({ open, onClose, onSuccess, editData }: GoalFormProps) {
  const isEditing = !!editData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    isScheduled: editData?.isScheduled ?? false,
    scheduleDays: editData?.scheduleDays || [],
    reward: editData?.reward || '',
    pointValue: editData?.pointValue || 10,
    color: editData?.color || '#059669',
  })

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter((d) => d !== day)
        : [...prev.scheduleDays, day],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    setLoading(true)
    try {
      const url = isEditing ? `/api/goals/${editData.id}` : '/api/goals'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        addToast({
          type: 'success',
          title: isEditing ? 'Goal updated!' : 'Goal created!',
          message: isEditing ? 'Changes saved' : 'Start tracking from today',
        })
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        addToast({ type: 'error', title: 'Failed to save goal', message: data.error })
      }
    } catch {
      addToast({ type: 'error', title: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Goal' : 'Create New Goal'}
      description="Track your daily habits and build streaks"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Title *"
          placeholder="e.g., Morning workout, Read 30 minutes..."
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          required
        />

        <Textarea
          label="Description (optional)"
          placeholder="Add more context about this goal..."
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />

        {/* Color picker */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2">
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((p) => ({ ...p, color: c }))}
                className={cn(
                  'h-7 w-7 rounded-full transition-all',
                  form.color === c && 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a] scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Schedule toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Specific Days Only</label>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isScheduled: !p.isScheduled }))}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                form.isScheduled ? 'bg-emerald-500' : 'bg-white/20'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  form.isScheduled && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {form.isScheduled && (
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-xs font-medium transition-all',
                    form.scheduleDays.includes(day)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Points Value"
            type="number"
            min="1"
            max="100"
            value={form.pointValue}
            onChange={(e) => setForm((p) => ({ ...p, pointValue: parseInt(e.target.value) || 10 }))}
          />
          <Input
            label="Reward (optional)"
            placeholder="e.g., Watch a movie..."
            value={form.reward}
            onChange={(e) => setForm((p) => ({ ...p, reward: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
