import { Features } from "@/components/landing-page/features";
import { Footer } from "@/components/landing-page/footer";
import { Hero } from "@/components/landing-page/hero";
import { Navbar } from "@/components/landing-page/navbar";
import { Pricing } from "@/components/landing-page/pricing";

export default function Home() {
  return (
    <div className="selection:bg-primary/30 min-h-screen bg-black text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
