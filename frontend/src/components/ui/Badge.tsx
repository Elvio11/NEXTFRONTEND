import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-white/5 text-content-subtle",
        primary: "border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-glow-blue/5",
        success: "border-green-500/20 bg-green-500/10 text-green-400 shadow-glow-green/5",
        warning: "border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-glow-orange/5",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400 shadow-glow-red/5",
        glass: "border-white/10 bg-white/[0.02] backdrop-blur-sm text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
