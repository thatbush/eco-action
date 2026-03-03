import { cn } from "@/lib/utils"
import { Label as ShadcnLabel } from "@/components/ui/label"

interface LabelProps extends React.ComponentProps<typeof ShadcnLabel> {
  required?: boolean
}

export function Label({ 
  className, 
  required = false,
  children, 
  ...props 
}: LabelProps) {
  return (
    <ShadcnLabel 
      className={cn(
        "text-sm font-semibold tracking-tight text-forest-800",
        "before:mr-1 before:text-red-500 before:font-bold",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500">*</span>}
    </ShadcnLabel>
  )
}
