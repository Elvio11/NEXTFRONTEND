import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-white/[0.03] border border-white/5", className)}
      {...props}
    />
  )
}

export { Skeleton }
