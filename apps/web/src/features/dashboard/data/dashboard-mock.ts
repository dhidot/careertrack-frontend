import type { DashboardData } from "../types/dashboard";

export const dashboardMock: DashboardData = {
  applications: [
    {
      id: "app-001",
      company: "Example Company",
      position: "Software Engineer",
      status: "INTERVIEW",
      updatedAt: "2026-10-14",
    },
    {
      id: "app-002",
      company: "Demo Labs",
      position: "Backend Developer",
      status: "SCREENING",
      updatedAt: "2026-10-12",
    },
    {
      id: "app-003",
      company: "Sample Technology",
      position: "Java Developer",
      status: "APPLIED",
      updatedAt: "2026-10-10",
    },
    {
      id: "app-004",
      company: "Placeholder Systems",
      position: "Software Engineer",
      status: "OFFER",
      updatedAt: "2026-10-08",
    },
    {
      id: "app-005",
      company: "Demo Digital",
      position: "Full Stack Developer",
      status: "REJECTED",
      updatedAt: "2026-10-05",
    },
  ],
};

export const emptyDashboardMock: DashboardData = {
  applications: [],
};