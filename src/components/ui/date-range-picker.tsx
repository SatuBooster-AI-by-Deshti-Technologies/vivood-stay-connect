import * as React from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  accommodationType: string
}

export function DateRangePicker({ 
  className, 
  dateRange, 
  onDateRangeChange, 
  accommodationType 
}: DateRangePickerProps) {
  const [bookedDates, setBookedDates] = React.useState<Date[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (accommodationType) {
      loadBookedDates(accommodationType)
    }
  }, [accommodationType])

  const loadBookedDates = async (accommodationName: string) => {
    setLoading(true)
    try {
      // Получаем информацию о типе размещения для определения общего количества
      const { data: accommodationData, error: accommodationError } = await supabase
        .from('accommodation_types')
        .select('total_quantity')
        .eq('name_ru', accommodationName)
        .single()

      if (accommodationError) {
        console.error('Error loading accommodation info:', accommodationError)
        return
      }

      const totalQuantity = accommodationData?.total_quantity || 1

      // Получаем все подтвержденные бронирования для данного типа размещения
      const { data, error } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('accommodation_type', accommodationName)
        .eq('status', 'confirmed')

      if (error) {
        console.error('Error loading booked dates:', error)
        return
      }

      // Подсчитываем количество бронирований для каждой даты
      const dateBookingCount: { [key: string]: number } = {}
      
      data?.forEach(booking => {
        const checkIn = new Date(booking.check_in)
        const checkOut = new Date(booking.check_out)
        
        // Добавляем все даты между check_in и check_out (не включая check_out)
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]
          dateBookingCount[dateKey] = (dateBookingCount[dateKey] || 0) + 1
        }
      })

      // Создаем массив полностью занятых дат (когда количество бронирований >= общего количества)
      const fullyBookedDates: Date[] = []
      Object.entries(dateBookingCount).forEach(([dateKey, count]) => {
        if (count >= totalQuantity) {
          fullyBookedDates.push(new Date(dateKey))
        }
      })
      
      setBookedDates(fullyBookedDates)
    } catch (error) {
      console.error('Error loading booked dates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Функция для проверки, заблокирована ли дата
  const isDateDisabled = (date: Date) => {
    // Блокируем прошедшие даты
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return true

    // Блокируем занятые даты
    return bookedDates.some(bookedDate => {
      const bookedDateOnly = new Date(bookedDate)
      bookedDateOnly.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return bookedDateOnly.getTime() === checkDate.getTime()
    })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-12",
              !dateRange && "text-muted-foreground"
            )}
            disabled={loading}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy", { locale: ru })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: ru })
              )
            ) : (
              <span>Выберите даты</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            disabled={isDateDisabled}
            locale={ru}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              booked: bookedDates,
            }}
            modifiersStyles={{
              booked: { 
                backgroundColor: '#fee2e2', 
                color: '#dc2626',
                textDecoration: 'line-through'
              }
            }}
          />
          <div className="p-3 border-t border-border/50">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Занято</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
                <span>Выбрано</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}