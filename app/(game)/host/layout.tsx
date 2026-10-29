import { HostShell } from "@/components/host/host-shell";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return <HostShell>{children}</HostShell>;
}
