
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@careertrack/ui/components/card";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CareerTrack Admin</CardTitle>
          <CardDescription>
            Sign in to the administration portal
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Admin login form will be implemented here.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
