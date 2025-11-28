"use client";

import { motion } from "framer-motion";
import { CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 right-0 left-0 z-50 flex justify-center pt-6 transition-all duration-300",
        scrolled ? "pt-4" : "pt-6",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between rounded-full border px-6 py-3 transition-all duration-300",
          scrolled
            ? "w-[90%] border-white/10 bg-black/80 shadow-lg backdrop-blur-md md:w-[70%] lg:w-[60%]"
            : "w-full max-w-7xl border-transparent bg-transparent",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white"
        >
          <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <CalendarClock className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "transition-opacity duration-300",
              scrolled ? "opacity-100" : "opacity-100",
            )}
          >
            NextSchedule
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
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
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden rounded-full text-zinc-400 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Link href="/authentication">Entrar</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-white px-6 text-black hover:bg-zinc-200"
              >
                <Link href="/authentication">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
