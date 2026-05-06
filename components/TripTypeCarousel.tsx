'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TRIP_TYPES = [
  { emoji: '🎉', label: 'Stag dos', desc: 'Herd the lads, book the chaos' },
  { emoji: '💅', label: 'Hen parties', desc: 'Matching flights, not just robes' },
  { emoji: '🏖️', label: 'Lads holidays', desc: 'Sun, cheap flights, sorted' },
  { emoji: '👯‍♀️', label: 'Girls trips', desc: "Everyone's budget, one search" },
  { emoji: '⛳', label: 'Golf trips', desc: 'Tee times & transfers in one' },
  { emoji: '🏢', label: 'Work away days', desc: 'No more spreadsheet sign-ups' },
  { emoji: '👨‍👩‍👧‍👦', label: 'Family holidays', desc: 'Grandma flies from Spain? Easy' },
  { emoji: '🎂', label: 'Birthday trips', desc: 'Surprise-proof with organiser mode' },
]

export function TripTypeCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    return () => { if (el) el.removeEventListener('scroll', checkScroll) }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.7
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full bg-white border border-border shadow-md flex items-center justify-center hover:bg-bg-soft transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} className="text-primary" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full bg-white border border-border shadow-md flex items-center justify-center hover:bg-bg-soft transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} className="text-primary" />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TRIP_TYPES.map((item) => (
          <div
            key={item.label}
            className="flex-none w-[140px] sm:w-[160px] snap-start bg-white rounded-card border border-border p-3 sm:p-4 hover:border-accent/30 hover:shadow-sm transition-all text-center space-y-1"
          >
            <span className="text-2xl sm:text-3xl block">{item.emoji}</span>
            <p className="text-xs sm:text-sm font-semibold text-primary">{item.label}</p>
            <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
