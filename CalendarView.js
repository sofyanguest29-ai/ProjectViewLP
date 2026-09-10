'use client'
import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { id } from 'date-fns/locale'

export default function CalendarView({ logs, selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ?? new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const logsByDate = useMemo(() => {
    const map = {}
    for (const log of logs) {
      const key = log.log_date
      if (!map[key]) map[key] = []
      map[key].push(log)
    }
    return map
  }, [logs])

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&larr;</button>
        <h2>{format(currentMonth, 'MMMM yyyy', { locale: id })}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&rarr;</button>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
          <div key={d} className="weekday">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayLogs = logsByDate[key] ?? []
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          return (
            <button
              type="button"
              key={key}
              className={`calendar-cell ${isSameMonth(day, currentMonth) ? '' : 'outside-month'} ${
                isSameDay(day, new Date()) ? 'today' : ''
              } ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDate(day)}
            >
              <div className="cell-date">{format(day, 'd')}</div>
              {dayLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="cell-event" title={log.title}>
                  {log.title}
                </div>
              ))}
              {dayLogs.length > 3 && <div className="cell-event-more">+{dayLogs.length - 3} lagi</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
