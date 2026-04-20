"use client";

import { cn } from "@/lib/utils";

interface MongolianTextProps {
 children: React.ReactNode;
 className?: string;
 size?: "sm" | "md" | "lg" | "xl" | "2xl";
 color?: string;
}

const sizeMap = {
 sm: "text-[18px]",
 md: "text-[28px]",
 lg: "text-[44px]",
 xl: "text-[64px]",
 "2xl": "text-[88px]",
};

export function MongolianText({
 children,
 className,
 size = "md",
 color,
}: MongolianTextProps) {
 return (
  <span
   className={cn(
    "mongolian font-mongolian leading-relaxed",
    sizeMap[size],
    className
   )}
   style={color ? { color } : undefined}
  >
   {children}
  </span>
 );
}
