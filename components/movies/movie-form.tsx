'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addToast } from '@/hooks/use-toast'
import { MOVIE_GENRES } from '@/lib/utils'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MovieFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: string
    movieName: string
    genre?: string | null
    rating?: number | null
    watchedDate: string
    notes?: string | null
  }
}

export function MovieForm({ open, onClose, onSuccess, editData }: MovieFormProps) {
  const isEditing = !!editData
  const [loading, setLoading] = useState(false)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [form, setForm] = useState({
    movieName: editData?.movieName || '',
    genre: editData?.genre || 'Action',
    rating: editData?.rating || 0,
    watchedDate: editData?.watchedDate
      ? new Date(editData.watchedDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: editData?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.movieName.trim()) return

    setLoading(true)
    try {
      const url = isEditing ? `/api/movies/${editData.id}` : '/api/movies'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: form.rating || undefined }),
      })

      if (res.ok) {
        addToast({
          type: 'success',
          title: isEditing ? 'Movie updated!' : 'Movie added! 🎬',
        })
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

  const displayRating = hoverRating ?? form.rating

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Movie' : 'Log Movie'}
      description="Add a movie to your watchlist"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Movie Title *"
          placeholder="e.g., Inception, The Dark Knight..."
          value={form.movieName}
          onChange={(e) => setForm((p) => ({ ...p, movieName: e.target.value }))}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Genre"
            value={form.genre}
            onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
            options={MOVIE_GENRES.map((g) => ({ value: g, label: g }))}
          />
          <Input
            label="Watched On"
            type="date"
            value={form.watchedDate}
            onChange={(e) => setForm((p) => ({ ...p, watchedDate: e.target.value }))}
          />
        </div>

        {/* Star rating */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Rating (out of 10)</label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setForm((p) => ({ ...p, rating: star }))}
                className="group relative"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-all duration-100',
                    star <= displayRating
                      ? 'fill-yellow-400 text-yellow-400 scale-110'
                      : 'text-gray-400 hover:text-gray-500'
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {form.rating > 0 ? `${form.rating}/10` : 'Not rated'}
            </span>
          </div>
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="Your thoughts about this movie..."
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? 'Update' : 'Add Movie'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
