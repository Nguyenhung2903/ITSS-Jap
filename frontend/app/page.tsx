import Header from "@/components/layouts/Header-1";
import Footer from "@/components/layouts/Footer";
import HeroSection from "@/components/pages/home/HeroSection";
import MissionSection from "@/components/pages/home/MissionSection";
import EventsSection from "@/components/pages/home/EventsSection";
import StatsSection from "@/components/pages/home/StatsSection";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(231,111,81,0.10),transparent_32%),linear-gradient(180deg,#F8F4EA_0%,#F3EFE4_45%,#EEF5F2_100%)] font-sans text-[#181D1B]">
      <Header />
      <main className="mx-auto mt-18 flex w-full max-w-[1280px] flex-1 flex-col items-center gap-12 px-5 py-8 md:px-8 md:py-10 lg:gap-14">
        <HeroSection />
        <MissionSection />
        <EventsSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}
