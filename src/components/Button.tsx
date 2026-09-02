import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  full?: boolean
  size?: 'md' | 'lg' | 'xl'
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-race-red)] text-white hover:brightness-110 active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--color-race-text)] hover:bg-white/5',
  outline:
    'border border-[var(--color-race-border)] bg-[var(--color-race-card)] text-[var(--color-race-text)] hover:border-[var(--color-race-red)]',
  danger:
    'bg-[#7f1010] text-white hover:brightness-110',
}

const SIZES: Record<string, string> = {
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  xl: 'h-14 px-6 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  full,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
