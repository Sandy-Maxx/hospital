"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

// Lightweight RadioGroup implementation without Radix UI
// Supports props: className, value, onValueChange, name, children
type RadioGroupContextValue = {
  value?: string
  onValueChange?: (val: string) => void
  name?: string
}
const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (val: string) => void
  name?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  id?: string
  disabled?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext)
    const checked = ctx.value === value
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      if (disabled) return
      ctx.onValueChange && ctx.onValueChange(value)
    }
    return (
      <button
        id={id}
        ref={ref}
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {checked && (
          <span className="flex items-center justify-center">
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          </span>
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
