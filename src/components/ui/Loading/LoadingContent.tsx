import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingContentProps {
  className?: string;
  iconClassName?: string;
}

export function LoadingContent({
  className,
  iconClassName,
}: LoadingContentProps) {
  return (
    <div className={cn("flex w-full items-center", className)}>
      <Loader2
        className={cn("h-7 w-7 animate-spin sm:h-5 sm:w-5", iconClassName)}
      />
    </div>
  );
}
