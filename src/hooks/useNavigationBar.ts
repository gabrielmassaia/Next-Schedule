"use client";

import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface UseNavigationBarProps {
  title: string;
  backUrl?: string;
  onBack?: () => void;
  actions?: NavigationAction[];
  showHome?: boolean;
}

export function useNavigationBar({
  title,
  backUrl,
  onBack,
  actions = [],
  showHome = false,
}: UseNavigationBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return {
    title,
    onBack: handleBack,
    backUrl,
    actions,
    showHome,
  };
}
