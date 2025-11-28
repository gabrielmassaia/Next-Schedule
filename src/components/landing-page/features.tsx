import { Bot, Calendar, Clock, MessageSquare, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Agentes Inteligentes",
    description:
      "IA treinada para entender o contexto da sua clínica e responder dúvidas dos pacientes instantaneamente.",
  },
  {
    icon: Calendar,
    title: "Agendamento Automático",
    description:
      "Integração direta com sua agenda. O paciente escolhe o horário e o sistema confirma tudo sozinho.",
  },
  {
    icon: Clock,
    title: "Disponibilidade 24/7",
    description:
      "Nunca mais perca um paciente por demorar a responder. Sua clínica aberta o tempo todo.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    description:
      "Tudo acontece onde seu paciente já está. Sem necessidade de instalar apps extras.",
  },
  {
    icon: Shield,
    title: "Segurança de Dados",
    description:
      "Criptografia de ponta a ponta e conformidade com LGPD para proteger os dados dos seus pacientes.",
  },
  {
    icon: Zap,
    title: "Redução de Faltas",
    description:
      "Lembretes automáticos e confirmações inteligentes reduzem drasticamente o no-show.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-zinc-950/50 py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tudo que sua clínica precisa
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Tecnologia de ponta simplificada para maximizar seus resultados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="bg-primary/10 text-primary group-hover:bg-primary/20 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
