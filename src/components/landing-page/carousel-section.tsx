"use client";

import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    image: "/landingpage/ConfigureSuaClinica.png",
    title: "Configuração Dinâmica",
    description:
      "Defina horários, convênios e modos de pagamento com total flexibilidade para sua clínica.",
  },
  {
    image: "/landingpage/CadastreProfissionais.png",
    title: "Gestão de Profissionais",
    description:
      "Configuração personalizada por profissional, com controle total de agenda e serviços.",
  },
  {
    image: "/landingpage/configure PersonaAgent.png",
    title: "Inteligência Artificial",
    description:
      "Personalize o comportamento do seu agente de IA para atender exatamente como você deseja.",
  },
  {
    image: "/landingpage/crieAgendamentos.png",
    title: "Agendamento Simplificado",
    description:
      "Controle de agendamento rápido e facilitado, otimizando o tempo da sua recepção.",
  },
  {
    image: "/landingpage/vejaIndicadores.png",
    title: "Gestão Baseada em Dados",
    description:
      "Visualização detalhada de indicadores para tomar as melhores decisões para o seu negócio.",
  },
];

export function CarouselSection() {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  return (
    <section className="bg-zinc-950 py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Por dentro do NextSchedule
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Uma visão completa das ferramentas que vão transformar sua gestão.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {slides.map((slide, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card className="overflow-hidden border-zinc-800 bg-zinc-900">
                      <CardContent className="flex flex-col items-center p-0">
                        <div className="relative aspect-video w-full bg-zinc-800">
                          <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                          />
                        </div>
                        <div className="w-full bg-zinc-900/50 p-6 text-center backdrop-blur-sm">
                          <h3 className="mb-2 text-2xl font-bold text-white">
                            {slide.title}
                          </h3>
                          <p className="text-zinc-400">{slide.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-12 hidden border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white md:flex" />
            <CarouselNext className="-right-12 hidden border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
