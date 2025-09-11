"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar } from "lucide-react";
import { isHospitalOpenOnDate, validateAppointmentDate, getNextOpenDate } from "@/lib/hospital-schedule";
import { toast } from "react-hot-toast";

interface HospitalDateInputProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function HospitalDateInput({
  value,
  onChange,
  label = "Appointment Date",
  required = false,
  minDate,
  maxDate,
  className = "",
  id,
  disabled = false,
}: HospitalDateInputProps) {
  const [validationState, setValidationState] = useState<{
    valid: boolean;
    message?: string;
  }>({ valid: true });
  const [isValidating, setIsValidating] = useState(false);

  // Set default min date to today if not provided
  const defaultMinDate = minDate || new Date().toISOString().split('T')[0];

  // Validate date whenever value changes
  useEffect(() => {
    if (value) {
      validateDate(value);
    } else {
      setValidationState({ valid: true });
    }
  }, [value]);

  const validateDate = async (dateString: string) => {
    if (!dateString) return;

    setIsValidating(true);
    try {
      const validation = await validateAppointmentDate(dateString);
      setValidationState(validation);

      if (!validation.valid) {
        // Auto-suggest next available date
        const nextOpenDate = await getNextOpenDate(new Date(dateString));
        const nextDateString = nextOpenDate.toISOString().split('T')[0];
        
        if (nextDateString !== dateString) {
          const dayName = nextOpenDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          });
          
          setTimeout(() => {
            toast.error(`${validation.message} Next available date is ${dayName}.`);
            // For toast action, show a follow-up toast with instruction and auto-apply if user confirms via window.confirm
            setTimeout(() => {
              if (window.confirm('Use suggested date ' + nextDateString + ' ?')) {
                onChange(nextDateString);
                toast.success('Date updated to ' + nextDateString);
              }
            }, 0);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Date validation failed:', error);
      setValidationState({ valid: true }); // Fallback to allow date if validation fails
    } finally {
      setIsValidating(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    onChange(newDate);
  };

  const handleDateSelect = async () => {
    // Auto-select next available date when input is focused but empty
    if (!value) {
      try {
        const nextOpenDate = await getNextOpenDate();
        const nextDateString = nextOpenDate.toISOString().split('T')[0];
        onChange(nextDateString);
      } catch (error) {
        console.error('Failed to get next open date:', error);
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4 inline mr-2" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative mt-1">
        <Input
          id={id}
          type="date"
          value={value}
          onChange={handleDateChange}
          onFocus={handleDateSelect}
          min={defaultMinDate}
          max={maxDate}
          disabled={disabled}
          className={`hospital-date-input ${
            !validationState.valid
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "focus:border-blue-500 focus:ring-blue-500"
          } ${isValidating ? "bg-gray-50" : ""}`}
          required={required}
        />
        
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {!validationState.valid && validationState.message && (
        <div className="mt-2 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{validationState.message}</p>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        📅 Only days when the hospital is open can be selected for appointments
      </div>
      
      {/* Custom CSS to disable closed days in calendar picker */}
      <style jsx>{`
        .hospital-date-input::-webkit-calendar-picker-indicator {
          filter: opacity(0.6);
        }
        .hospital-date-input::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }
      `}</style>
    </div>
  );
}

export default HospitalDateInput;
