'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white shadow-glow-blue hover:bg-blue-500",
        destructive: "bg-red-600 text-white shadow-glow-red hover:bg-red-500",
        outline: "border border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.05] hover:border-white/20",
        ghost: "text-content-subtle hover:bg-white/[0.05] hover:text-white",
        glass: "bg-white/[0.03] border border-white/10 backdrop-blur-md text-white hover:bg-white/[0.06] hover:border-white/20 shadow-xl",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-9 px-4 rounded-xl",
        lg: "h-14 px-10 rounded-3xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
