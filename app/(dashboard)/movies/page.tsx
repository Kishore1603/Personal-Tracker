'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, ProgressBar } from '@/components/ui/badge'
import { MovieForm } from '@/components/movies/movie-form'
import { addToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Film, Plus, Star, Trash2, Trophy, TrendingUp } from 'lucide-react'
import { format, getYear } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const GENRE_COLORS = ['#059669','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6','#a78bfa']

interface Movie {
  id: string; movieName: string; genre?: string | null; rating?: number | null
  watchedDate: string; notes?: string | null
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [yearFilter, setYearFilter] = useState(String(getYear(new Date())))

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/movies?year=${yearFilter}`)
      if (res.ok) { const { data } = await res.json(); setMovies(data) }
    } catch {} finally { setLoading(false) }
  }, [yearFilter])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this movie?')) return
    const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' })
    if (res.ok) { addToast({ type: 'success', title: 'Movie removed' }); fetchMovies() }
  }

  // Stats
  const avgRating = movies.filter(m => m.rating).length > 0
    ? (movies.filter(m => m.rating).reduce((s, m) => s + (m.rating || 0), 0) / movies.filter(m => m.rating).length).toFixed(1)
    : '—'

  type GenreMap = Record<string, number>
  const genreData = Object.entries(
    movies.reduce<GenreMap>((acc, m) => ({ ...acc, [m.genre || 'Unknown']: (acc[m.genre || 'Unknown'] || 0) + 1 }), {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const milestone50Progress = Math.min(movies.length, 50)
  const milestone100Progress = Math.min(movies.length, 100)

  return (
    <div className="flex flex-col h-full">
      <Header title="Movie Tracker" subtitle="Log movies, track ratings, unlock milestones" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Watched', value: movies.length, color: '#ec4899' },
            { label: 'Avg Rating', value: `${avgRating}/10`, color: '#f59e0b' },
            { label: 'Genres', value: genreData.length, color: '#8b5cf6' },
            { label: 'Year', value: yearFilter, color: '#059669' },
          ].map(s => (
            <Card key={s.label} glass className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Milestones */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { target: 50, badge: '🎬', label: '50 Movies Milestone' },
            { target: 100, badge: '🏆', label: '100 Movies Milestone' },
          ].map(m => (
            <Card key={m.target} glass className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{m.badge}</span>
                <div>
                  <p className="font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500">{movies.length}/{m.target} movies</p>
                </div>
                {movies.length >= m.target && <Badge variant="success" size="sm" className="ml-auto">Unlocked!</Badge>}
              </div>
              <ProgressBar value={movies.length} max={m.target} color="#ec4899" size="md" />
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Genre chart */}
          {genreData.length > 0 && (
            <Card glass>
              <CardHeader><CardTitle>Genre Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={genreData.slice(0, 6)} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}>
                      {genreData.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {genreData.slice(0, 5).map((g, i) => (
                    <div key={g.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                      <span className="text-gray-500 flex-1">{g.name}</span>
                      <span className="text-gray-900 font-medium">{g.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Movie list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Movies ({movies.length})</h2>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-900"
                >
                  {[2026, 2025, 2024, 2023].map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditData(null); setFormOpen(true) }}>
                Log Movie
              </Button>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
              </div>
            ) : movies.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-500">
                <Film className="h-14 w-14 mb-4 opacity-20" />
                <p className="font-medium">No movies logged this year</p>
                <Button className="mt-4" onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>Log First Movie</Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {movies.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-gray-300 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400 font-bold text-sm">
                      {movie.movieName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{movie.movieName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {movie.genre && <span className="text-xs text-gray-500">{movie.genre}</span>}
                        {movie.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-yellow-400">{movie.rating}/10</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(movie.watchedDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditData(movie); setFormOpen(true) }}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(movie.id)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/20 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MovieForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null) }}
        onSuccess={fetchMovies} editData={editData} />
    </div>
  )
}
