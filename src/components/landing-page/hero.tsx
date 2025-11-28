import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      <Spotlight
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />

      <div className="relative z-10 container mx-auto px-4 text-center md:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 mb-8 inline-flex cursor-default items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm transition-colors duration-700 hover:bg-white/10">
          <Sparkles className="text-primary h-4 w-4" />
          <span>A revolução do agendamento com IA</span>
        </div>

        <h1 className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white delay-100 duration-1000 sm:text-6xl md:text-7xl lg:text-8xl">
          Sua clínica no <br />
          <span className="bg-linear-to-b from-white to-white/40 bg-clip-text text-transparent">
            piloto automático
          </span>
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 delay-200 duration-1000 md:text-xl">
          Agentes inteligentes que atendem seus pacientes 24/7, agendam
          consultas e reduzem faltas. Foque no atendimento, deixe a gestão com a
          IA.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both mt-10 flex flex-col items-center justify-center gap-4 delay-300 duration-1000 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-white px-8 text-base text-black transition-all hover:scale-105 hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Link href="/authentication">
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-white/10 bg-white/5 px-8 text-base text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/10 hover:text-white"
          >
            <Link href="#features">Conhecer Recursos</Link>
          </Button>
        </div>

        <div className="animate-in fade-in mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-zinc-500 delay-500 duration-1000">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Setup em 2 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Teste grátis</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Configuramos o sistema com você</span>
          </div>
        </div>
      </div>
    </section>
  );
}
