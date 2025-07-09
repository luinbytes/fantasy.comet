"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * @component Accordion
 * @description A foundational component for building accordions using Radix UI's AccordionPrimitive.Root.
 * @see https://www.radix-ui.com/docs/primitives/components/accordion
 */
const Accordion = AccordionPrimitive.Root

/**
 * @component AccordionItem
 * @description Represents an individual item within an Accordion.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.Ref<React.ElementRef<typeof AccordionPrimitive.Item>>} ref - Ref to the underlying DOM element.
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)} // Combines base styles with any provided className.
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

/**
 * @component AccordionTrigger
 * @description The interactive trigger that expands or collapses an AccordionItem.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.ReactNode} props.children - The content to be rendered inside the trigger.
 * @param {React.Ref<React.ElementRef<typeof AccordionPrimitive.Trigger>>} ref - Ref to the underlying DOM element.
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      {/* Chevron icon that rotates based on accordion item state */}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

/**
 * @component AccordionContent
 * @description The collapsible content area of an AccordionItem.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {React.ReactNode} props.children - The content to be rendered inside the collapsible area.
 * @param {React.Ref<React.ElementRef<typeof AccordionPrimitive.Content>>} ref - Ref to the underlying DOM element.
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
