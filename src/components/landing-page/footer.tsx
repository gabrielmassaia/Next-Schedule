import { CalendarClock } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tighter text-white"
            >
              <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <CalendarClock className="h-5 w-5" />
              </div>
              NextSchedule
            </Link>
            <p className="max-w-xs text-zinc-400">
              A plataforma de agendamento inteligente que revoluciona a gestão
              da sua clínica com IA.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Produto</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link
                  href="#features"
                  className="transition-colors hover:text-white"
                >
                  Recursos
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="transition-colors hover:text-white"
                >
                  Planos
                </Link>
              </li>
              <li>
                <Link
                  href="/authentication"
                  className="transition-colors hover:text-white"
                >
                  Entrar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-zinc-500 md:flex-row">
          <p>
            © {new Date().getFullYear()} NextSchedule. Todos os direitos
            reservados.
          </p>
          <p>Feito com foco para clínicas do futuro.</p>
        </div>
      </div>
    </footer>
  );
}
