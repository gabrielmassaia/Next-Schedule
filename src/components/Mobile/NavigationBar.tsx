"use client";

import { ChevronLeft, Home, LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavigationDropdownItem {
  text: string;
  onClick: () => void;
}

interface NavigationDropdownAction {
  type: "dropdown";
  icon: LucideIcon;
  items: NavigationDropdownItem[];
  ariaLabel?: string;
}

interface NavigationButtonAction {
  type?: "button";
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel?: string;
  variant?: "ghost" | "default" | "destructive" | "outline" | "secondary";
}

interface NavigationLinkAction {
  type: "link";
  icon?: LucideIcon;
  text?: string;
  href: string;
  ariaLabel?: string;
  className?: string;
}

type NavigationAction =
  | NavigationButtonAction
  | NavigationLinkAction
  | NavigationDropdownAction;

interface NavigationBarProps {
  title: string;
  onBack?: () => void;
  backUrl?: string;
  actions?: NavigationAction[];
  showBackButton?: boolean;
  showHome?: boolean;
  className?: string;
  backButtonAriaLabel?: string;
}

export function NavigationBar({
  title,
  onBack,
  backUrl,
  actions = [],
  showBackButton = true,
  showHome = false,
  className,
  backButtonAriaLabel = "Voltar",
}: NavigationBarProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "bg-background fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b px-3 py-2 sm:hidden",
        className,
      )}
    >
      <div className="flex flex-1 items-center justify-between gap-1">
        {showBackButton && (
          <div className="flex min-w-24 items-center gap-1">
            {/* Home */}
            {showHome && (
              <Button
                size="icon"
                variant="ghost"
                className="bg-background/80 rounded-full"
                aria-label="Ir para home"
                onClick={() => router.push("/dashboard")}
              >
                <Home className="h-6 w-6" />
              </Button>
            )}

            {backUrl ? (
              <Link href={backUrl}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-background/80 rounded-full"
                  aria-label={backButtonAriaLabel}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </Link>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={onBack || (() => router.back())}
                aria-label={backButtonAriaLabel}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 text-center">
          <h2 className="max-w-full truncate text-base leading-tight font-bold uppercase">
            {title}
          </h2>
        </div>

        {(showBackButton || actions.length > 0) && (
          <div className="flex min-w-12 items-center justify-end gap-1">
            <>
              {actions.map((action, index) => {
                if (action.type === "link") {
                  return (
                    <Link
                      key={index}
                      href={action.href}
                      className={cn(
                        "flex items-center gap-1",
                        action.className,
                      )}
                      aria-label={action.ariaLabel}
                    >
                      {action.icon && (
                        <action.icon className="h-4 w-4 shrink-0" />
                      )}
                      {action.text && <span>{action.text}</span>}
                    </Link>
                  );
                }

                if (action.type === "dropdown") {
                  return (
                    <DropdownMenu key={index}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full"
                          aria-label={action.ariaLabel}
                        >
                          <action.icon className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {action.items.map((item, itemIndex) => (
                          <DropdownMenuItem
                            key={itemIndex}
                            onClick={item.onClick}
                            className="cursor-pointer"
                          >
                            {item.text}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Button
                    key={index}
                    size="icon"
                    variant={action.variant || "ghost"}
                    className="rounded-full"
                    onClick={action.onClick}
                    aria-label={action.ariaLabel}
                  >
                    <action.icon className="h-6 w-6" />
                  </Button>
                );
              })}
            </>
          </div>
        )}
      </div>
    </div>
  );
}
