'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { RenewalItem } from '@/types'

interface RenewalsCalendarProps {
  items: RenewalItem[]
}

const URGENCY_DOT: Record<string, string> = {
  overdue: 'bg-red-500',
  critical: 'bg-orange-500',
  warning: 'bg-amber-400',
  ok: 'bg-green-500',
  unknown: 'bg-gray-400',
}

export function RenewalsCalendar({ items }: RenewalsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Index items by renewal date
  const itemsByDate = new Map<string, RenewalItem[]>()
  for (const item of items) {
    if (!item.contract.renewalDate) continue
    const d = parseISO(item.contract.renewalDate)
    if (!isValid(d)) continue
    const key = format(d, 'yyyy-MM-dd')
    if (!itemsByDate.has(key)) itemsByDate.set(key, [])
    itemsByDate.get(key)!.push(item)
  }

  const selectedItems = selectedDate
    ? itemsByDate.get(format(selectedDate, 'yyyy-MM-dd')) ?? []
    : []

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
          className="rounded p-1.5 hover:bg-gray-100 text-gray-600"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
          className="rounded p-1.5 hover:bg-gray-100 text-gray-600"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayItems = itemsByDate.get(key) ?? []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const todayDay = isToday(day)

          return (
            <button
              key={key}
              onClick={() => {
                if (dayItems.length > 0) {
                  setSelectedDate(isSelected ? null : day)
                }
              }}
              className={cn(
                'relative min-h-[64px] p-1.5 text-left border-b border-r border-gray-100 transition-colors',
                !isCurrentMonth && 'bg-gray-50',
                isCurrentMonth && 'hover:bg-gray-50',
                isSelected && 'bg-brand-50',
                dayItems.length > 0 && 'cursor-pointer'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  todayDay && 'bg-brand-600 text-white',
                  !todayDay && isCurrentMonth && 'text-gray-700',
                  !isCurrentMonth && 'text-gray-400'
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Renewal dots */}
              {dayItems.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {dayItems.slice(0, 3).map((item, i) => (
                    <span
                      key={i}
                      className={cn('h-1.5 w-1.5 rounded-full', URGENCY_DOT[item.urgency])}
                      title={item.contract.productName}
                    />
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-xs text-gray-400 leading-none">+{dayItems.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected date details */}
      {selectedDate && selectedItems.length > 0 && (
        <div className="border-t border-gray-200 px-5 py-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Renewals on {format(selectedDate, 'MMMM d, yyyy')}
          </h4>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <Link
                key={item.contract.id}
                href={`/contracts/${item.contract.id}`}
                className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-brand-50 hover:border-brand-200 transition-colors"
              >
                <span className={cn('h-2 w-2 rounded-full flex-shrink-0', URGENCY_DOT[item.urgency])} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.contract.productName}</div>
                  <div className="text-xs text-gray-500">{item.vendor.name}</div>
                </div>
                {item.contract.internalOwner && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{item.contract.internalOwner}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-gray-100 px-5 py-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium text-gray-600">Legend:</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Overdue</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> ≤30 days</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> ≤90 days</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> &gt;90 days</span>
      </div>
    </div>
  )
}
