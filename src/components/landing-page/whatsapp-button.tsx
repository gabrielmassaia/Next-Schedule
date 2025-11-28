import { MessageCircle } from "lucide-react";
import Link from "next/link";

export function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/5547991787358"
      target="_blank"
      rel="noopener noreferrer"
      className="animate-in fade-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-1000 hover:scale-110 hover:bg-[#20bd5a] focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="h-8 w-8 fill-current" />
      <span className="absolute right-full mr-3 hidden rounded-md bg-zinc-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
        Fale conosco
      </span>
    </Link>
  );
}
