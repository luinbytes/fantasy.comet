"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * @component AlertDialog
 * @description A modal dialog that interrupts the user with important content and expects a response.
 * Built using Radix UI's AlertDialogPrimitive.Root.
 * @see https://www.radix-ui.com/docs/primitives/components/alert-dialog
 */
const AlertDialog = AlertDialogPrimitive.Root

/**
 * @component AlertDialogTrigger
 * @description The element that opens the AlertDialog.
 */
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/**
 * @component AlertDialogPortal
 * @description Portals the AlertDialog content to the end of the `body` element.
 */
const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
 * @component AlertDialogOverlay
 * @description A semi-transparent overlay that covers the screen when the AlertDialog is open.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>} ref - Ref to the underlying DOM element.
 */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/**
 * @component AlertDialogContent
 * @description The main content area of the AlertDialog.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>} ref - Ref to the underlying DOM element.
 */
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

/**
 * @component AlertDialogHeader
 * @description A container for the AlertDialog title and description.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 */
const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

/**
 * @component AlertDialogFooter
 * @description A container for the AlertDialog action and cancel buttons.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 */
const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

/**
 * @component AlertDialogTitle
 * @description The title of the AlertDialog.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>} ref - Ref to the underlying DOM element.
 */
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

/**
 * @component AlertDialogDescription
 * @description The descriptive text of the AlertDialog.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>} ref - Ref to the underlying DOM element.
 */
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

/**
 * @component AlertDialogAction
 * @description A button that performs the primary action of the AlertDialog.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>} ref - Ref to the underlying DOM element.
 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

/**
 * @component AlertDialogCancel
 * @description A button that cancels the AlertDialog.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>} ref - Ref to the underlying DOM element.
 */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
