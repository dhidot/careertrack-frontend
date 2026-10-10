import { Button } from "@careertrack/ui/components/button";
import { BrandTitle } from "@careertrack/ui/brand-title";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <BrandTitle subtitle="ADMIN Management System" />

      <Button type="button">Admin Login</Button>
    </main>
  );
}