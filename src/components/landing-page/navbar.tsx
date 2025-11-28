"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white"
        >
          <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <CalendarClock className="h-5 w-5" />
          </div>
          NextSchedule
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex">
          <Link href="#features" className="transition-colors hover:text-white">
            Recursos
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-white">
            Planos
          </Link>
          <Link href="#about" className="transition-colors hover:text-white">
            Sobre
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : session?.user ? (
            <Button
              asChild
              variant="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/dashboard">Ir para Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden text-zinc-400 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Link href="/authentication">Entrar</Link>
              </Button>
              <Button asChild className="bg-white text-black hover:bg-zinc-200">
                <Link href="/authentication">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
