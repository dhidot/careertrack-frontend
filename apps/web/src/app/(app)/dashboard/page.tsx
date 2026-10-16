"use client";

import { useAuth } from "@/features/auth/components/auth-provider";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { dashboardMock } from "@/features/dashboard/data/dashboard-mock";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardOverview
      data={dashboardMock}
      username={user?.username}
    />
  );
}