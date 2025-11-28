import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full max-w-7xl -translate-x-1/2">
        <div className="bg-primary/20 absolute top-20 left-1/4 h-96 w-96 animate-pulse rounded-full opacity-30 blur-3xl" />
        <div className="absolute right-1/4 bottom-20 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 opacity-30 blur-3xl delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 text-center md:px-6">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm">
          <Sparkles className="text-primary h-4 w-4" />
          <span>A revolução do agendamento com IA</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Sua clínica funcionando <br />
          <span className="from-primary bg-linear-to-r to-purple-400 bg-clip-text text-transparent">
            no piloto automático
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
          Agentes inteligentes que atendem seus pacientes 24/7, agendam
          consultas e reduzem faltas. Foque no atendimento, deixe a gestão com a
          IA.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 bg-white px-8 text-base text-black hover:bg-zinc-200"
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
            className="h-12 border-white/10 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="#features">Conhecer Recursos</Link>
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Setup em 7 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>
  );
}
