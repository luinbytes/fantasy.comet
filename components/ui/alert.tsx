import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * @function alertVariants
 * @description Defines the base styles and variants for the Alert component using `cva`.
 * @param {object} options - Options for the alert variants.
 * @param {object} options.variants - Defines different visual styles for the alert.
 * @param {string} options.variants.default - Default alert style.
 * @param {string} options.variants.destructive - Destructive alert style.
 * @param {object} options.defaultVariants - Default variant to apply if none is specified.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * @component Alert
 * @description A component used to display important messages to the user.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {("default" | "destructive")} [props.variant="default"] - The visual style of the alert.
 * @param {React.Ref<HTMLDivElement>} ref - Ref to the underlying DOM element.
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)} // Combines base styles with variant styles and any provided className.
    {...props}
  />
))
Alert.displayName = "Alert"

/**
 * @component AlertTitle
 * @description The title of the Alert component.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the underlying DOM element.
 */
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)} // Combines base styles with any provided className.
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

/**
 * @component AlertDescription
 * @description The descriptive content of the Alert component.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the underlying DOM element.
 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)} // Combines base styles with any provided className.
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
