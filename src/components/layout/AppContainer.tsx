import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  size?: "6xl" | "7xl";
}

export function AppContainer({
  children,
  className,
  size = "7xl",
}: AppContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 lg:px-8",
        size === "6xl" ? "max-w-6xl" : "max-w-7xl",
        className,
      )}>
      {children}
    </div>
  );
}
