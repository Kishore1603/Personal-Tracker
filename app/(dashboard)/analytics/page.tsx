'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Target, DollarSign, Film, Plane } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AnalyticsData {
  weeklyGoals: { week: string; completed: number; total: number; pct: number }[]
  monthlyGoals: { month: string; completed: number; total: number; pct: number }[]
  monthlyFinance: { month: string; income: number; expense: number; net: number }[]
  monthlyMovies: { month: string; count: number }[]
  topMovies: { title: string; rating: number }[]
  tripByCategory: { category: string; total: number }[]
  yearlyTripTotal: number
}

const COLORS = ['#059669', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6b7280']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-xl text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, moviesRes, financesRes, tripsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/movies'),
        fetch('/api/finance/transactions'),
        fetch('/api/trips'),
      ])

      const dashboard = dashRes.ok ? (await dashRes.json()).data : null
      const moviesData = moviesRes.ok ? (await moviesRes.json()).data : []
      const txData = financesRes.ok ? (await financesRes.json()).data : []
      const tripData = tripsRes.ok ? (await tripsRes.json()).data : []

      // Build monthly finance map
      const financeMap: Record<string, { income: number; expense: number }> = {}
      for (const tx of txData) {
        const m = tx.date.slice(0, 7)
        if (!financeMap[m]) financeMap[m] = { income: 0, expense: 0 }
        if (tx.type === 'INCOME') financeMap[m].income += tx.amount
        else financeMap[m].expense += tx.amount
      }
      const monthlyFinance = Object.entries(financeMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, vals]) => ({
          month: month.slice(5), income: vals.income, expense: vals.expense, net: vals.income - vals.expense
        }))

      // Monthly movies
      const movieMonthMap: Record<string, number> = {}
      for (const m of moviesData) {
        const key = (m.watchedAt || m.createdAt).slice(0, 7)
        movieMonthMap[key] = (movieMonthMap[key] || 0) + 1
      }
      const monthlyMovies = Object.entries(movieMonthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, count]) => ({ month: month.slice(5), count }))

      // Top rated movies
      const topMovies = [...moviesData]
        .filter((m: any) => m.rating > 0)
        .sort((a: any, b: any) => b.rating - a.rating)
        .slice(0, 5)
        .map((m: any) => ({ title: m.title, rating: m.rating }))

      // Trip category breakdown
      const catMap: Record<string, number> = {}
      let yearlyTripTotal = 0
      for (const trip of tripData) {
        yearlyTripTotal += trip.totalCost
        for (const exp of (trip.expenses || [])) {
          catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount
        }
      }
      const tripByCategory = Object.entries(catMap).map(([category, total]) => ({ category, total }))

      setData({
        weeklyGoals: dashboard?.weeklyStats || [],
        monthlyGoals: [],
        monthlyFinance,
        monthlyMovies,
        topMovies,
        tripByCategory,
        yearlyTripTotal,
      })
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" subtitle="Insights across all your activities" />
      <div className="flex-1 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" subtitle="Insights across all your activities" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Goal completion trend */}
        <Card glass glow>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-400" />Weekly Goal Completion</CardTitle></CardHeader>
          <CardContent>
            {(data?.weeklyGoals?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data!.weeklyGoals} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pct" name="Completion %" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm py-10 text-center">No goal data yet</p>}
          </CardContent>
        </Card>

        {/* Finance trends */}
        <Card glass>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-400" />Income vs Expense (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            {(data?.monthlyFinance?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data!.monthlyFinance} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm py-10 text-center">No finance data yet</p>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly movies */}
          <Card glass>
            <CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5 text-purple-400" />Movies Watched</CardTitle></CardHeader>
            <CardContent>
              {(data?.monthlyMovies?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data!.monthlyMovies} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name="Movies" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-sm py-10 text-center">No movie data yet</p>}
              {/* Top rated */}
              {data?.topMovies && data.topMovies.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Top Rated</p>
                  {data.topMovies.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 text-xs w-4">{i + 1}</span>
                      <span className="flex-1 text-gray-700 truncate">{m.title}</span>
                      <span className="text-yellow-400">{'★'.repeat(Math.round(m.rating / 2))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travel spend */}
          <Card glass>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5 text-yellow-400" />Travel Spend Breakdown</CardTitle></CardHeader>
            <CardContent>
              {(data?.tripByCategory?.length ?? 0) > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data!.tripByCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({ category }) => category}>
                        {data!.tripByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {data!.tripByCategory.map((c, i) => (
                      <div key={c.category} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-gray-500">{c.category}</span>
                        </span>
                        <span className="text-gray-900 font-medium">{formatCurrency(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-gray-400 text-sm py-10 text-center">No trip expense data yet</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
