"use client";

import { Bot, Building2, HammerIcon, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubscriptionPlanLimits } from "@/data/subscription-plans";

interface MobileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planLimits: SubscriptionPlanLimits;
}

interface SettingsOption {
  title: string;
  description: string;
  url: string;
  icon: typeof Building2;
  requiresLimit?: keyof SubscriptionPlanLimits;
}

const settingsOptions: SettingsOption[] = [
  {
    title: "Gerenciar Clínica",
    description: "Configure informações da sua clínica",
    url: "/clinic-settings",
    icon: Building2,
  },
  {
    title: "API Key",
    description: "Gerencie suas chaves de API",
    url: "/apikey",
    icon: KeyRound,
    requiresLimit: "apiKey",
  },
  {
    title: "Especialidades",
    description: "Gerencie especialidades disponíveis",
    url: "/specialties",
    icon: HammerIcon,
  },
  {
    title: "Personalidade IA",
    description: "Configure o comportamento do assistente",
    url: "/clinic-persona",
    icon: Bot,
    requiresLimit: "aiAgent",
  },
];

export function MobileSettingsModal({
  open,
  onOpenChange,
  planLimits,
}: MobileSettingsModalProps) {
  const router = useRouter();

  const handleOptionClick = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const visibleOptions = settingsOptions.filter((option) => {
    if (option.requiresLimit && !planLimits[option.requiresLimit]) {
      return false;
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Escolha uma opção para gerenciar sua clínica
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {visibleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.url}
                onClick={() => handleOptionClick(option.url)}
                className="hover:bg-accent flex items-start gap-4 rounded-lg border p-4 text-left transition-colors"
              >
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{option.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
