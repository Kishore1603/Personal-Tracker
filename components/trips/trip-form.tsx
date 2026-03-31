'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addToast } from '@/hooks/use-toast'

interface TripFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: string
    destination: string
    startDate: string
    endDate: string
    notes?: string | null
  }
}

export function TripForm({ open, onClose, onSuccess, editData }: TripFormProps) {
  const isEditing = !!editData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    destination: editData?.destination || '',
    startDate: editData?.startDate
      ? new Date(editData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: editData?.endDate
      ? new Date(editData.endDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: editData?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.destination.trim()) return

    setLoading(true)
    try {
      const url = isEditing ? `/api/trips/${editData.id}` : '/api/trips'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        addToast({ type: 'success', title: isEditing ? 'Trip updated!' : 'Trip created! ✈️' })
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        addToast({ type: 'error', title: 'Failed to save', message: data.error })
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
      title={isEditing ? 'Edit Trip' : 'Add New Trip'}
      description="Track your travel expenses"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Destination *"
          placeholder="e.g., Goa, Paris, New York..."
          value={form.destination}
          onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
          />
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="Trip highlights, things to remember..."
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? 'Update Trip' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface AddExpenseFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  tripId: string
}

const TRIP_CATEGORIES = ['TRAVEL', 'STAY', 'FOOD', 'ACTIVITIES', 'SHOPPING', 'OTHER']

export function AddExpenseForm({ open, onClose, onSuccess, tripId }: AddExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    category: 'FOOD',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount) return

    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })

      if (res.ok) {
        addToast({ type: 'success', title: 'Expense added!' })
        onSuccess()
        onClose()
        setForm({ category: 'FOOD', amount: '', note: '', date: new Date().toISOString().split('T')[0] })
      } else {
        const data = await res.json()
        addToast({ type: 'error', title: 'Failed to add expense', message: data.error })
      }
    } catch {
      addToast({ type: 'error', title: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            options={TRIP_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Amount (₹)"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            required
          />
        </div>
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
        />
        <Textarea
          label="Note (optional)"
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          rows={2}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Add Expense</Button>
        </div>
      </form>
    </Modal>
  )
}
