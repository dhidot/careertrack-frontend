export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

export type DashboardApplication = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  updatedAt: string;
};

export type DashboardData = {
  applications: DashboardApplication[];
};