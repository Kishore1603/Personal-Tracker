'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addToast } from '@/hooks/use-toast'

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  accounts: { id: string; accountName: string; color?: string | null }[]
  defaultType?: 'INCOME' | 'EXPENSE'
}

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Health & Fitness', 'Bills & Utilities', 'Education', 'Travel',
  'Personal Care', 'Investments', 'Other',
]

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Gift', 'Other']

export function TransactionForm({ open, onClose, onSuccess, accounts, defaultType = 'EXPENSE' }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(defaultType)
  const [form, setForm] = useState({
    accountId: accounts[0]?.id || '',
    amount: '',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  // accountId is '' on first render (accounts not yet loaded); sync when they arrive
  useEffect(() => {
    if (!form.accountId && accounts.length > 0) {
      setForm(f => ({ ...f, accountId: accounts[0].id }))
    }
  }, [accounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accountId || !form.amount || !form.category) return

    setLoading(true)
    try {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), type }),
      })

      if (res.ok) {
        addToast({ type: 'success', title: `${type === 'INCOME' ? 'Income' : 'Expense'} recorded!` })
        onSuccess()
        onClose()
        setForm({ accountId: accounts[0]?.id || '', amount: '', category: 'Food & Dining', date: new Date().toISOString().split('T')[0], note: '' })
      } else {
        const data = await res.json()
        addToast({ type: 'error', title: 'Failed to save transaction', message: data.error })
      }
    } catch {
      addToast({ type: 'error', title: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Transaction" size="md">
      {/* Type toggle */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-4">
        {(['EXPENSE', 'INCOME'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              type === t
                ? t === 'EXPENSE'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'EXPENSE' ? '↓ Expense' : '↑ Income'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Account"
          value={form.accountId}
          onChange={(e) => setForm((p) => ({ ...p, accountId: e.target.value }))}
          options={accounts.map((a) => ({ value: a.id, label: a.accountName }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (₹)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            required
          />
        </div>

        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          options={categories.map((c) => ({ value: c, label: c }))}
        />

        <Textarea
          label="Note (optional)"
          placeholder="Add a description..."
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          rows={2}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className={`flex-1 ${
              type === 'EXPENSE'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400'
            }`}
          >
            Add {type === 'EXPENSE' ? 'Expense' : 'Income'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
