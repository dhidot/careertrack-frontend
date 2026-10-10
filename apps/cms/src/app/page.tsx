
import { Button } from "@careertrack/ui/components/button";
import { Input } from "@careertrack/ui/components/input";
import { Label } from "@careertrack/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@careertrack/ui/components/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CareerTrack</CardTitle>
          <CardDescription>
            Shared UI Component Testing
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
              />
            </div>

            <Button type="button" className="w-full">
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
