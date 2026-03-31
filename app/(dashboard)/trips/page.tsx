'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TripForm, AddExpenseForm } from '@/components/trips/trip-form'
import { addToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Map, Plus, Plane, Utensils, Home, Zap, ShoppingBag, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { differenceInDays, format } from 'date-fns'

const CATEGORY_ICONS: Record<string, any> = {
  TRAVEL: Plane, STAY: Home, FOOD: Utensils, ACTIVITIES: Zap, SHOPPING: ShoppingBag, OTHER: Map
}
const CATEGORY_COLORS: Record<string, string> = {
  TRAVEL: '#059669', STAY: '#8b5cf6', FOOD: '#f59e0b', ACTIVITIES: '#10b981', SHOPPING: '#ec4899', OTHER: '#6b7280'
}

interface Trip {
  id: string; destination: string; startDate: string; endDate: string
  totalCost: number; notes?: string | null
  expenses: { id: string; category: string; amount: number; note?: string | null; date: string }[]
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [tripFormOpen, setTripFormOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trips')
      if (res.ok) { const { data } = await res.json(); setTrips(data) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('Delete this trip and all its expenses?')) return
    const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    if (res.ok) { addToast({ type: 'success', title: 'Trip deleted' }); fetchTrips() }
  }

  const totalSpend = trips.reduce((s, t) => s + t.totalCost, 0)
  const avgCost = trips.length > 0 ? totalSpend / trips.length : 0

  return (
    <div className="flex flex-col h-full">
      <Header title="Trip Tracker" subtitle="Log your adventures and travel expenses" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Trips', value: trips.length, color: '#f59e0b' },
            { label: 'Total Spent', value: formatCurrency(totalSpend), color: '#ef4444' },
            { label: 'Avg Per Trip', value: formatCurrency(avgCost), color: '#8b5cf6' },
          ].map(s => (
            <Card key={s.label} glass className="p-4 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setTripFormOpen(true)}>
            Add Trip
          </Button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Map className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No trips yet</p>
            <Button className="mt-4" onClick={() => setTripFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Log your first trip
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip, i) => {
              const duration = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
              const isExpanded = expandedTrip === trip.id
              const catBreakdown = trip.expenses.reduce<Record<string, number>>((acc, e) => ({
                ...acc, [e.category]: (acc[e.category] || 0) + e.amount
              }), {})

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden"
                >
                  {/* Trip header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/15 text-2xl">
                          ✈️
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{trip.destination}</h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(trip.startDate), 'MMM d')} – {format(new Date(trip.endDate), 'MMM d, yyyy')}
                            <span className="ml-2 text-gray-500">({duration} days)</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(trip.totalCost)}</p>
                          <p className="text-xs text-gray-500">{trip.expenses.length} expenses</p>
                        </div>
                        <button onClick={() => handleDeleteTrip(trip.id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {Object.keys(catBreakdown).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(catBreakdown).map(([cat, amt]) => {
                          const Icon = CATEGORY_ICONS[cat] || Map
                          return (
                            <div key={cat} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1">
                              <Icon className="h-3 w-3" style={{ color: CATEGORY_COLORS[cat] }} />
                              <span className="text-xs text-gray-500">{cat}</span>
                              <span className="text-xs font-medium text-gray-900">{formatCurrency(amt)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" variant="glass" icon={<Plus className="h-3.5 w-3.5" />}
                        onClick={() => { setSelectedTripId(trip.id); setExpenseFormOpen(true) }}>
                        Add Expense
                      </Button>
                      {trip.expenses.length > 0 && (
                        <Button size="sm" variant="ghost"
                          icon={isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}>
                          {isExpanded ? 'Hide' : 'Show'} Expenses
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expense list */}
                  {isExpanded && trip.expenses.length > 0 && (
                    <div className="border-t border-gray-200 px-5 pb-5 pt-3">
                      <div className="space-y-2">
                        {trip.expenses.map(exp => {
                          const Icon = CATEGORY_ICONS[exp.category] || Map
                          return (
                            <div key={exp.id} className="flex items-center gap-3 text-sm">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${CATEGORY_COLORS[exp.category]}20` }}>
                                <Icon className="h-3.5 w-3.5" style={{ color: CATEGORY_COLORS[exp.category] }} />
                              </div>
                              <span className="flex-1 text-gray-500">{exp.note || exp.category}</span>
                              <span className="text-xs text-gray-400">{format(new Date(exp.date), 'MMM d')}</span>
                              <span className="font-medium text-gray-900">{formatCurrency(exp.amount)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <TripForm open={tripFormOpen} onClose={() => setTripFormOpen(false)} onSuccess={fetchTrips} />
      {selectedTripId && (
        <AddExpenseForm
          open={expenseFormOpen}
          onClose={() => { setExpenseFormOpen(false); setSelectedTripId(null) }}
          onSuccess={fetchTrips}
          tripId={selectedTripId}
        />
      )}
    </div>
  )
}
