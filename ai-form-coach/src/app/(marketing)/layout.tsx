import ErrorBoundary from "@/components/ErrorBoundary";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <ErrorBoundary>
        <main id="main-content" className="flex-1">{children}</main>
      </ErrorBoundary>
      <SiteFooter />
    </>
  );
}
