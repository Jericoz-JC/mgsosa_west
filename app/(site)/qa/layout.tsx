import { QAProvider } from "@/components/qa/qa-provider";

export default function QALayout({ children }: { children: React.ReactNode }) {
  return <QAProvider>{children}</QAProvider>;
}
