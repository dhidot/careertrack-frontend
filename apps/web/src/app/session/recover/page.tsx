import type { Metadata } from "next";

import { SessionRecovery } from "@/features/auth/components/session-recovery";

export const metadata: Metadata = {
  title: "Restoring Session",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SessionRecoveryPage() {
  return <SessionRecovery />;
}