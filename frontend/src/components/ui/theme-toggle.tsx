"use client";

// shadcn/ui Next.js dark-mode menu, adapted for Arabic and radio selection.
// https://ui.shadcn.com/docs/dark-mode/next
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "./dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <DropdownMenu dir="rtl">
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon" aria-label="مظهر التطبيق" className="relative shrink-0 rounded-xl">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="light"><Sun className="h-4 w-4" />فاتح</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark"><Moon className="h-4 w-4" />داكن</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system"><Monitor className="h-4 w-4" />حسب الجهاز</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
