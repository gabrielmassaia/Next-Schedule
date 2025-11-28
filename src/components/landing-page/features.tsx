import { Bot, Calendar, Clock, MessageSquare, Shield, Zap } from "lucide-react";
import Image from "next/image";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const features = [
  {
    title: "Agentes Inteligentes",
    description:
      "IA treinada para entender o contexto da sua clínica e responder dúvidas dos pacientes instantaneamente.",
    header: (
      <div className="relative h-full min-h-[6rem] w-full overflow-hidden rounded-xl">
        <Image
          src="/landingpage/features/ai-agents.png"
          alt="Agentes Inteligentes"
          fill
          className="object-cover"
        />
      </div>
    ),
    icon: <Bot className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-2",
  },
  {
    title: "Agendamento Automático",
    description:
      "Integração direta com sua agenda. O paciente escolhe o horário e o sistema confirma tudo sozinho.",
    header: (
      <div className="relative h-full min-h-[6rem] w-full overflow-hidden rounded-xl">
        <Image
          src="/landingpage/features/auto-scheduling.png"
          alt="Agendamento Automático"
          fill
          className="object-cover"
        />
      </div>
    ),
    icon: <Calendar className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
  },
  {
    title: "Disponibilidade 24/7",
    description:
      "Nunca mais perca um paciente por demorar a responder. Sua clínica aberta o tempo todo.",
    header: (
      <div className="relative h-full min-h-[6rem] w-full overflow-hidden rounded-xl">
        <Image
          src="/landingpage/features/availability-24-7.png"
          alt="Disponibilidade 24/7"
          fill
          className="object-cover"
        />
      </div>
    ),
    icon: <Clock className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
  },
  {
    title: "WhatsApp Integrado",
    description:
      "Tudo acontece onde seu paciente já está. Sem necessidade de instalar apps extras.",
    header: (
      <div className="relative h-full min-h-[6rem] w-full overflow-hidden rounded-xl">
        <Image
          src="/landingpage/features/whatsapp-integration.png"
          alt="WhatsApp Integrado"
          fill
          className="object-cover"
        />
      </div>
    ),
    icon: <MessageSquare className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-2",
  },
  {
    title: "Segurança de Dados",
    description:
      "Criptografia de ponta a ponta e conformidade com LGPD para proteger os dados dos seus pacientes.",
    header: (
      <div className="relative h-full min-h-[6rem] w-full overflow-hidden rounded-xl">
        <Image
          src="/landingpage/features/data-security.png"
          alt="Segurança de Dados"
          fill
          className="object-cover"
        />
      </div>
    ),
    icon: <Shield className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
  },
  {
    title: "Redução de Faltas",
    description:
      "Lembretes automáticos e confirmações inteligentes reduzem drasticamente o no-show.",
    header: (
      <div className="relative h-full min-h-[6rem] w-full overflow-hidden rounded-xl">
        <Image
          src="/landingpage/features/reduce-no-shows.png"
          alt="Redução de Faltas"
          fill
          className="object-cover"
        />
      </div>
    ),
    icon: <Zap className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-2",
  },
];

export function Features() {
  return (
    <section id="features" className="relative z-10 bg-black py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tudo que sua clínica precisa
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Tecnologia de ponta simplificada para maximizar seus resultados.
          </p>
        </div>

        <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
