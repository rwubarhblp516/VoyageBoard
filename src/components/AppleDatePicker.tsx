import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface AppleDatePickerProps {
  isOpen: boolean
  onClose: () => void
  value: string // yyyy-mm-dd
  onChange: (date: string) => void
}

export default function AppleDatePicker({ isOpen, onClose, value, onChange }: AppleDatePickerProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  
  // Create a dynamic range centered around current year
  const years = useMemo(() => Array.from({ length: 101 }, (_, i) => (currentYear - 50) + i), [currentYear])
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())

  const days = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [selectedYear, selectedMonth])

  const yearRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)
  const dayRef = useRef<HTMLDivElement>(null)

  const ITEM_HEIGHT = 44

  const syncScroll = (ref: React.RefObject<HTMLDivElement | null>, items: number[], target: number) => {
    if (!ref.current) return
    const index = items.indexOf(target)
    if (index !== -1) {
      ref.current.scrollTop = index * ITEM_HEIGHT
    }
  }

  const isInitialOpen = useRef(true)

  useEffect(() => {
    if (isOpen) {
      if (isInitialOpen.current) {
        // Only sync from 'value' prop on the very first open moment
        const date = value ? new Date(value) : new Date()
        const y = date.getFullYear()
        const m = date.getMonth() + 1
        const d = date.getDate()

        setSelectedYear(y)
        setSelectedMonth(m)
        setSelectedDay(d)

        const performSync = () => {
          syncScroll(yearRef, years, y)
          syncScroll(monthRef, months, m)
          syncScroll(dayRef, days, d)
        }

        performSync()
        const timer = setTimeout(performSync, 50)
        const timer2 = setTimeout(performSync, 150)
        
        isInitialOpen.current = false
        
        return () => {
          clearTimeout(timer)
          clearTimeout(timer2)
        }
      }
    } else {
      // Reset the flag when picker closes
      isInitialOpen.current = true
    }
  }, [isOpen, value, years, months, days])

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, items: number[], setter: (val: number) => void) => {
    if (!ref.current) return
    const index = Math.round(ref.current.scrollTop / ITEM_HEIGHT)
    if (items[index] !== undefined) {
      setter(items[index])
    }
  }

  const handleDone = () => {
    const y = selectedYear
    const m = String(selectedMonth).padStart(2, '0')
    const d = String(Math.min(selectedDay, days.length)).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    onClose()
  }

  const renderColumn = (
    ref: React.RefObject<HTMLDivElement | null>, 
    items: number[], 
    currentValue: number, 
    setter: (val: number) => void,
    format: (val: number) => string = (v) => v.toString()
  ) => (
    <div className="flex-1 relative h-full">
      <div 
        ref={ref}
        onScroll={() => handleScroll(ref, items, setter)}
        className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory relative z-20 px-2 scroll-smooth"
        style={{ scrollSnapStop: 'always' }}
      >
        {/* Exact padding to center 44px item in 240px container: (240 - 44) / 2 = 98px */}
        <div className="h-[98px]" />
        {items.map((item) => (
          <div 
            key={item} 
            className={`h-[44px] flex items-center justify-center snap-center text-[19px] transition-all duration-200 tracking-tight ${
              currentValue === item ? 'text-white font-medium' : 'text-white/20 font-light'
            }`}
          >
            {format(item)}
          </div>
        ))}
        <div className="h-[98px]" />
      </div>
    </div>
  )

  const portalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300, mass: 0.8 }}
            className="relative w-full max-w-lg bg-[#1C1C1E] border-t border-white/5 sm:border sm:border-white/10 rounded-t-[32px] sm:rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 bg-white/10 rounded-full" />
            </div>

            <div className="px-6 py-4 flex justify-between items-center border-b border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em]">Voyage Picker</span>
                <span className="text-lg font-medium text-white/90">选择日期</span>
              </div>
              <button 
                onClick={handleDone}
                className="text-[#0A84FF] text-[17px] font-semibold px-4 py-2 rounded-xl active:bg-white/5 active:scale-95 transition-all"
              >
                完成
              </button>
            </div>

            <div className="relative h-[240px] bg-[#1C1C1E]">
              {/* Highlight bar - Centered exactly in 240px height */}
              <div className="absolute top-[98px] left-6 right-6 h-[44px] bg-white/[0.04] rounded-xl z-10 pointer-events-none border-y border-white/5" />
              
              {/* Fade gradients */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#1C1C1E] via-[#1C1C1E]/80 to-transparent z-30 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/80 to-transparent z-30 pointer-events-none" />

              <div className="flex h-full relative px-4">
                {renderColumn(yearRef, years, selectedYear, setSelectedYear)}
                {renderColumn(monthRef, months, selectedMonth, setSelectedMonth, (v) => v < 10 ? `0${v}` : v.toString())}
                {renderColumn(dayRef, days, selectedDay, setSelectedDay, (v) => v < 10 ? `0${v}` : v.toString())}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(portalContent, document.body)
}
