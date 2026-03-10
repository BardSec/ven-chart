'use client'

import { cn } from '@/lib/utils'
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

interface FieldWrapperProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

export function FieldWrapper({ label, htmlFor, required, error, hint, className, children }: FieldWrapperProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300',
        className
      )}
      {...props}
    />
  )
}

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300',
        className
      )}
      rows={3}
      {...props}
    />
  )
}

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  placeholder?: string
}

export function Select({ className, error, placeholder, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
}

// Checkbox with label
interface CheckboxFieldProps {
  label: string
  description?: string
  id: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function CheckboxField({ label, description, id, checked, onChange, disabled }: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-5 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked ?? false}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  )
}

// Three-state boolean selector (Yes / No / Not Set)
interface TristateSelectorProps {
  label: string
  value: boolean | null | undefined
  onChange: (value: boolean | null) => void
  id: string
  hint?: string
}

export function TristateSelector({ label, value, onChange, id, hint }: TristateSelectorProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} hint={hint}>
      <select
        id={id}
        value={value === true ? 'yes' : value === false ? 'no' : ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === 'yes' ? true : v === 'no' ? false : null)
        }}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Not set</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </FieldWrapper>
  )
}

// Tag input (comma-separated)
interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const raw = (e.target as HTMLInputElement).value.trim()
      if (raw && !value.includes(raw)) {
        onChange([...value, raw])
        ;(e.target as HTMLInputElement).value = ''
      }
    }
    if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded-md border border-gray-300 px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-brand-600 hover:text-brand-900"
            aria-label={`Remove tag ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm focus:outline-none"
        placeholder={value.length === 0 ? placeholder : 'Add tag...'}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
