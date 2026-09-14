"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  type = "auto",
  dir = "rtl",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const viewportChildren: React.ReactNode[] = [];
  const scrollBars: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && (child.type === ScrollBar || (child.props as {"data-slot"?: string})?.['data-slot'] === 'scroll-area-scrollbar')) {
      scrollBars.push(child);
    } else {
      viewportChildren.push(child);
    }
  });

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      dir={dir}
      type={type}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] outline-none"
        dir={dir}
      >
        {viewportChildren}
      </ScrollAreaPrimitive.Viewport>
      {scrollBars.length > 0 ? scrollBars : (
        <>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </>
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-0.5 select-none transition-all duration-300 z-20 data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "h-2 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-stone-300 hover:bg-stone-400 dark:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar }
