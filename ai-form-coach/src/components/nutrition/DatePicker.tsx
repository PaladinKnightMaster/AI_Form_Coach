"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/ui/DS';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  datesWithData?: string[]; // Optional: dates that have nutrition data
}

export default function DatePicker({ selectedDate, onDateChange, datesWithData = [] }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  
  const today = new Date();
  const selectedDateObj = new Date(selectedDate);
  
  // Get month name and year
  const monthYear = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Handle mounting and positioning
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, [isOpen]);

  // Handle window resize and scroll to update position
  useEffect(() => {
    if (isOpen) {
      const updatePosition = () => {
        if (buttonRef.current) {
          setButtonRect(buttonRef.current.getBoundingClientRect());
        }
      };
      
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);
  
  // Get days in month
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    calendarDays.push(date);
  }
  
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDateObj.toDateString();
  };
  
  const isFuture = (date: Date) => {
    return date > today;
  };
  
  const hasData = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return datesWithData.includes(dateStr);
  };
  
  const handleDateSelect = (date: Date) => {
    if (isFuture(date)) return;
    onDateChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };
  
  const goToToday = () => {
    const todayStr = today.toISOString().split('T')[0];
    onDateChange(todayStr);
    setCurrentMonth(today);
    setIsOpen(false);
  };
  
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  const getDateStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return { label: 'Today', color: 'text-blue-600 dark:text-blue-400' };
    } else if (date < today) {
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        return { label: 'Yesterday', color: 'text-gray-600 dark:text-gray-400' };
      } else if (diffDays <= 7) {
        return { label: `${diffDays} days ago`, color: 'text-gray-600 dark:text-gray-400' };
      } else {
        return { label: 'Previous', color: 'text-gray-500 dark:text-gray-500' };
      }
    } else {
      return { label: 'Future', color: 'text-gray-400 dark:text-gray-600' };
    }
  };
  
  return (
    <div className="relative z-[100]">
      {/* Date Display Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <Icon name="chart" className="text-white w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatDisplayDate(selectedDate)}
            </div>
            <div className={`text-sm ${getDateStatus(selectedDate).color}`}>
              {selectedDateObj.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })} • {getDateStatus(selectedDate).label}
            </div>
          </div>
        </div>
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          className={`text-gray-400 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Calendar Dropdown - Rendered via Portal */}
      {isOpen && mounted && buttonRect && createPortal(
        <div 
          className="fixed bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[99999] animate-slide-up backdrop-blur-sm"
          style={{
            top: Math.min(buttonRect.bottom + 8, window.innerHeight - 400),
            left: Math.max(8, Math.min(buttonRect.left, window.innerWidth - 320)),
            width: Math.max(buttonRect.width, 320),
            maxWidth: '90vw'
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Icon name="chevron-left" className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {monthYear}
              </h3>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Today
              </button>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Icon name="chevron-right" className="w-5 h-5" />
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-10" />;
                }
                
                const isCurrentDay = isToday(date);
                const isSelectedDay = isSelected(date);
                const isFutureDay = isFuture(date);
                const hasDataForDay = hasData(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    disabled={isFutureDay}
                    className={`
                      h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 relative
                      ${isSelectedDay 
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg scale-110' 
                        : isCurrentDay
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold'
                        : isFutureDay
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {date.getDate()}
                    {hasDataForDay && !isSelectedDay && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Quick Date Buttons */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  onDateChange(yesterday.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Yesterday
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  onDateChange(tomorrow.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                disabled
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 rounded-lg cursor-not-allowed"
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Backdrop - Also rendered via Portal */}
      {isOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[99998]" 
          onClick={() => setIsOpen(false)}
        />,
        document.body
      )}
    </div>
  );
}
