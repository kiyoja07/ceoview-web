import { headers } from "next/headers";
import {
  buildShowcaseUrl,
  buildUrlForAudience,
} from "@/app/lib/audience-routing";
import { DEFAULT_SHOWCASE_SLUG } from "@/catalogs/showcase";
import SiteHeader from "@/app/_components/SiteHeader";
import HeroSection from "@/app/_components/landing/HeroSection";
import WhyCeoviewSection from "@/app/_components/landing/WhyCeoviewSection";
import ForCeoSection from "@/app/_components/landing/ForCeoSection";
import WehagoUploadSection from "@/app/_components/landing/WehagoUploadSection";
import TestimonialsSection from "@/app/_components/landing/TestimonialsSection";
import AudienceCardsSection from "@/app/_components/landing/AudienceCardsSection";
import FaqSection from "@/app/_components/landing/FaqSection";
import PricingSection from "@/app/_components/landing/PricingSection";
import FooterSection from "@/app/_components/landing/FooterSection";
import PayslipDeliverySection from "./_components/PayslipDeliverySection";

export default async function Home() {
  const headerList = await headers();
  const agentUrl = buildUrlForAudience("agent", "/agent/auth", headerList);
  const companyUrl = buildUrlForAudience("company", "/company", headerList);
  const employeeUrl = buildUrlForAudience("employee", "/employee", headerList);
  const showcaseUrl = buildShowcaseUrl(DEFAULT_SHOWCASE_SLUG, headerList);

  const audienceHref = {
    agent: agentUrl,
    company: companyUrl,
    employee: employeeUrl,
  } as const;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader
        navItems={[
          { href: agentUrl, label: "세무대리인으로 시작하기" },
          { href: companyUrl, label: "급여 담당자로 시작하기" },
          { href: employeeUrl, label: "급여 수령자로 시작하기" },
        ]}
      />
      <HeroSection showcaseUrl={showcaseUrl} />
      <WhyCeoviewSection agentUrl={agentUrl} />
      <WehagoUploadSection />
      <ForCeoSection companyUrl={companyUrl} />
      <PayslipDeliverySection />
      <TestimonialsSection />
      <AudienceCardsSection audienceHref={audienceHref} />
      <PricingSection />
      <FaqSection />
      <FooterSection />
    </main>
  );
}
