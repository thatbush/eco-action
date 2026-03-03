import { cn } from "@/lib/utils"
import { Input as ShadcnInput } from "@/components/ui/input"

interface InputProps extends React.ComponentProps<typeof ShadcnInput> {
  variant?: "default" | "outline" | "filled"
  Icon?: React.ReactNode
}

export function Input({ 
  className, 
  variant = "default", 
  Icon,
  ...props 
}: InputProps) {
  const baseClasses = "h-12 px-4 py-3 text-base font-medium transition-all duration-200 focus-visible:outline-none"
  
  const variants = {
    default: "bg-white border-2 border-stone-200 hover:border-green-200 focus:border-green-400 shadow-sm hover:shadow-md",
    outline: "bg-transparent border-2 border-green-200/50 bg-green-50/50 backdrop-blur-sm hover:border-green-300",
    filled: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-inner hover:shadow-md"
  }

  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {Icon}
        </div>
      )}
      <ShadcnInput 
        className={cn(
          baseClasses,
          variants[variant],
          Icon && "pl-12",
          "placeholder:text-stone-500",
          className
        )}
        {...props}
      />
    </div>
  )
}
