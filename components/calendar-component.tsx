"use client"

import { useEffect, useRef } from "react"
import { Calendar } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"

interface CalendarEvent {
  id: string
  title: string
  start: Date
  allDay?: boolean
  extendedProps?: any
}

interface CalendarComponentProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarComponent({ events, onEventClick }: CalendarComponentProps) {
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarInstanceRef = useRef<Calendar | null>(null)

  useEffect(() => {
    if (!calendarRef.current) return

    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      locale: esLocale,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek",
      },
      events: events,
      eventClick: (info) => {
        if (onEventClick) {
          const event = events.find((e) => e.id === info.event.id)
          if (event) onEventClick(event)
        }
      },
      height: "auto",
      contentHeight: "auto",
      eventColor: "#10b981",
      eventBackgroundColor: "#d1fae5",
      eventBorderColor: "#10b981",
      eventTextColor: "#065f46",
      dayMaxEvents: 3,
      dayMaxEventRows: true,
      eventDisplay: "block",
      weekends: true,
    })

    calendar.render()
    calendarInstanceRef.current = calendar

    return () => {
      calendar.destroy()
    }
  }, [events, onEventClick])

  return (
    <div className="w-full overflow-x-auto">
      <style>{`
        .fc {
          font-family: inherit;
        }
        .fc .fc-button-primary {
          background-color: #059669 !important;
          border-color: #059669 !important;
          color: white !important;
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
        }
        .fc .fc-button-primary:hover {
          background-color: #047857 !important;
          border-color: #047857 !important;
        }
        .fc .fc-button-primary.fc-button-active {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: #d1d5db !important;
          border-color: #d1d5db !important;
        }
        .fc .fc-daygrid-day.fc-day-other {
          background-color: #f9fafb;
        }
        .fc .fc-daygrid-day {
          background-color: white;
          border-color: #e5e7eb;
        }
        .fc .fc-daygrid-day:hover {
          background-color: #f0fdf4;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #dbeafe !important;
        }
        .fc .fc-daygrid-day-number {
          padding: 0.5rem 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }
        .fc .fc-col-header {
          background-color: #f3f4f6;
          border-color: #e5e7eb;
        }
        .fc .fc-col-header-cell {
          padding: 0.75rem 0.25rem;
          font-weight: 700;
          font-size: 0.875rem;
          color: #374151;
          background-color: #f3f4f6;
        }
        .fc .fc-daygrid-body {
          border-color: #e5e7eb;
        }
        .fc .fc-event {
          background-color: #d1fae5 !important;
          border-color: #10b981 !important;
          color: #065f46 !important;
          font-size: 0.75rem;
          padding: 0.125rem;
          margin: 0.125rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .fc .fc-event:hover {
          background-color: #a7f3d0 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        .fc .fc-event-title {
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          white-space: normal;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .fc-theme-standard .fc-daygrid-day-frame {
          min-height: 80px;
        }
        @media (max-width: 640px) {
          .fc-theme-standard .fc-daygrid-day-frame {
            min-height: 60px;
          }
          .fc .fc-col-header-cell {
            padding: 0.5rem 0.125rem;
            font-size: 0.75rem;
          }
          .fc .fc-daygrid-day-number {
            padding: 0.25rem;
            font-size: 0.75rem;
          }
          .fc .fc-button-primary {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          .fc .fc-event-title {
            font-size: 0.65rem;
            padding: 0.15rem 0.25rem;
          }
        }
        @media (max-width: 768px) {
          .fc-theme-standard .fc-daygrid-day-frame {
            min-height: 70px;
          }
        }
      `}</style>
      <div ref={calendarRef} className="w-full" />
    </div>
  )
}
