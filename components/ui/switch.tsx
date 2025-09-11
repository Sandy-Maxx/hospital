import * as React from "react";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ checked = false, onCheckedChange, ...props }: SwitchProps) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <span className={`w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${checked ? 'translate-x-4' : ''}`}></span>
      </span>
    </label>
  );
}

