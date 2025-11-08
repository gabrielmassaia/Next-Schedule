import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSubscriptionPlans } from "@/data/subscription-plans";
import { auth } from "@/lib/auth";

import { SubscriptionPlan } from "../(protected)/subscription/_components/subscription-plan";

export default async function SubscriptionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }
  const plans = await getSubscriptionPlans();
  const userPlanSlug = session.user.plan ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 p-6">
      <div className="mb-10 w-full max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900">
          Transforme o agendamento da sua clínica com inteligência artificial
        </h1>
        <p className="mb-6 text-lg text-gray-600 md:text-xl">
          O Next Schedule combina automação, relatórios em tempo real e um agente
          de IA que responde pacientes em segundos. Escolha o plano ideal e
          conquiste uma operação eficiente desde o primeiro atendimento.
        </p>
        <div className="grid gap-4 text-left md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
            <p className="font-semibold">Atendimento em tempo recorde</p>
            <p>O agente de IA agenda consultas em até 30 segundos, 24/7.</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm">
            <p className="font-semibold">Operação sem atritos</p>
            <p>Integre profissionais, salas e clínicas em um painel intuitivo.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            <p className="font-semibold">Mais pacientes presentes</p>
            <p>Confirmações automáticas reduzem faltas com lembretes humanizados.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md lg:max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <SubscriptionPlan
              key={plan.slug}
              plan={plan}
              isActive={plan.slug === userPlanSlug}
              className="h-full"
            />
          ))}
        </div>
      </div>

      <div className="mt-12 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white/70 p-8 text-center shadow-lg backdrop-blur">
        <h2 className="text-2xl font-semibold text-gray-900">
          Por que clínicas líderes escolhem o Next Schedule?
        </h2>
        <p className="mt-4 text-sm text-gray-600 md:text-base">
          Nossos clientes registram uma economia média de 15 horas semanais com o
          agente de IA, que confirma consultas, envia lembretes personalizados e
          mantém sua agenda sempre cheia. Você tem visibilidade total dos dados
          para tomar decisões rápidas.
        </p>
        <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Integração total</p>
            <p className="mt-2 text-sm text-gray-600">
              Conecte prontuários, pagamentos e comunicação em um só lugar.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Escala ilimitada</p>
            <p className="mt-2 text-sm text-gray-600">
              Gerencie múltiplas unidades mantendo padrões e governança.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Onboarding assistido</p>
            <p className="mt-2 text-sm text-gray-600">
              Equipe especializada acompanha a configuração do seu fluxo ideal.
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs uppercase tracking-widest text-gray-400">
          Garantia de satisfação de 30 dias ou seu dinheiro de volta
        </p>
      </div>
    </div>
  );
}
