import { CarouselSection } from "@/components/landing-page/carousel-section";
import { Features } from "@/components/landing-page/features";
import { Footer } from "@/components/landing-page/footer";
import { Hero } from "@/components/landing-page/hero";
import { Navbar } from "@/components/landing-page/navbar";
import { Pricing } from "@/components/landing-page/pricing";
import { WhatsAppButton } from "@/components/landing-page/whatsapp-button";

export default function Home() {
  return (
    <div className="selection:bg-primary/30 relative min-h-screen bg-black text-white">
      {/* Global Background Grid */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="bg-primary/20 absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-20 blur-[100px]"></div>
      </div>

      <Navbar />
      <main>
        <Hero />
        <CarouselSection />
        <Features />
        <Pricing />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
