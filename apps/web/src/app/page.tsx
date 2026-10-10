import { Button } from "@careertrack/ui/components/button";
import { BrandTitle } from "@careertrack/ui/brand-title";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <BrandTitle subtitle="USER Application" />

      <div className="flex gap-3">
        <Button type="button">Login</Button>
        <Button type="button" variant="outline">
          Register
        </Button>
      </div>
    </main>
  );
}