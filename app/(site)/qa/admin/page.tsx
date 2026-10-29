import type { Metadata } from "next";
import { QAAdmin } from "@/components/qa/qa-admin";

export const metadata: Metadata = {
  title: "Ask the Clergy admin",
  robots: { index: false },
};

export default function QAAdminPage() {
  return <QAAdmin />;
}
