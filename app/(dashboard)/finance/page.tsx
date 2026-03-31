'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TransactionForm } from '@/components/finance/transaction-form'
import { addToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import {
  Wallet, Plus, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight,
  ArrowDownRight, Trash2, Filter
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const CATEGORY_COLORS = ['#059669','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6','#a78bfa','#34d399','#fbbf24']

interface Account { id: string; accountName: string; balance: number; color?: string | null; _count?: { transactions: number } }
interface Transaction {
  id: string; accountId: string; amount: number; category: string; type: 'INCOME' | 'EXPENSE'
  date: string; note?: string | null; account?: { accountName: string; color?: string | null }
}

function AccountCard({ account, selected, onClick }: { account: Account; selected: boolean; onClick: () => void }) {
  const color = account.color || '#10b981'
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
        selected ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
        >
          <Wallet className="h-5 w-5" style={{ color }} />
        </div>
        {selected && <Badge variant="info" size="sm">Selected</Badge>}
      </div>
      <p className="text-sm text-gray-500">{account.accountName}</p>
      <p className={`text-xl font-bold mt-0.5 ${account.balance >= 0 ? 'text-gray-900' : 'text-red-400'}`}>
        {formatCurrency(account.balance)}
      </p>
      <p className="text-xs text-gray-500 mt-1">{account._count?.transactions ?? 0} transactions</p>
    </motion.div>
  )
}

export default function FinancePage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [txFormOpen, setTxFormOpen] = useState(false)
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [accsRes, txsRes] = await Promise.all([
        fetch('/api/finance/accounts'),
        fetch(`/api/finance/transactions?month=${monthFilter}&limit=100${selectedAccount ? `&accountId=${selectedAccount}` : ''}`),
      ])
      if (accsRes.ok) { const { data } = await accsRes.json(); setAccounts(data) }
      if (txsRes.ok) { const { data } = await txsRes.json(); setTransactions(data) }
    } catch {} finally { setLoading(false) }
  }, [selectedAccount, monthFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return
    setAddingAccount(true)
    try {
      const res = await fetch('/api/finance/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName: newAccountName }),
      })
      if (res.ok) {
        addToast({ type: 'success', title: 'Account created!' })
        setNewAccountName(''); setAccountFormOpen(false); fetchData()
      }
    } catch { addToast({ type: 'error', title: 'Failed to create account' })
    } finally { setAddingAccount(false) }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    const res = await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) { addToast({ type: 'success', title: 'Transaction deleted' }); fetchData() }
  }

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const netSavings = totalIncome - totalExpense

  // Category breakdown
  type CategoryMap = Record<string, number>
  const expenseByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce<CategoryMap>((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {})
  const categoryData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Monthly trends (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i)
    const label = format(month, 'MMM')
    return { month: label, income: 0, expense: 0 }
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Finance Tracker" subtitle="Track your income, expenses, and savings" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Accounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Accounts</h2>
            <Button size="sm" variant="glass" icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setAccountFormOpen(true)}>
              Add Account
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {accounts.map(acc => (
              <AccountCard key={acc.id} account={acc}
                selected={selectedAccount === acc.id}
                onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
              />
            ))}
            {accounts.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 flex flex-col items-center py-8 text-gray-500 rounded-2xl border border-dashed border-gray-200"
              >
                <Wallet className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No accounts yet</p>
                <Button size="sm" className="mt-3" onClick={() => setAccountFormOpen(true)}>
                  Add your first account
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Income', value: formatCurrency(totalIncome), icon: TrendingUp, color: '#10b981' },
            { label: 'Expenses', value: formatCurrency(totalExpense), icon: TrendingDown, color: '#ef4444' },
            { label: 'Net Savings', value: formatCurrency(netSavings), icon: PiggyBank, color: netSavings >= 0 ? '#8b5cf6' : '#ef4444' },
          ].map(s => (
            <Card key={s.label} glass className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${s.color}20` }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category breakdown */}
          {categoryData.length > 0 && (
            <Card glass>
              <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="value" paddingAngle={2}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                        formatter={(v: any) => formatCurrency(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {categoryData.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="text-gray-500 truncate flex-1">{c.name}</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions list */}
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <input type="month" value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900"
                  />
                  <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setTxFormOpen(true)}>Add</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <p className="text-sm">No transactions this month</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {transactions.slice(0, 20).map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 group"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                        tx.type === 'INCOME' ? 'bg-green-500/15' : 'bg-red-500/15'
                      }`}>
                        {tx.type === 'INCOME'
                          ? <ArrowDownRight className="h-4 w-4 text-green-400" />
                          : <ArrowUpRight className="h-4 w-4 text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tx.category}</p>
                        <p className="text-xs text-gray-500">{formatDate(tx.date)} · {tx.account?.accountName}</p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionForm
        open={txFormOpen} onClose={() => setTxFormOpen(false)}
        onSuccess={fetchData} accounts={accounts}
      />

      <Modal open={accountFormOpen} onClose={() => setAccountFormOpen(false)} title="Add Account">
        <div className="space-y-4">
          <Input label="Account Name" placeholder="e.g., SBI Savings, KVB..."
            value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setAccountFormOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddAccount} loading={addingAccount} className="flex-1">Create Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
