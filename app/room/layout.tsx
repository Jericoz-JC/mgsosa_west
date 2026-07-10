import Link from "next/link";
import { LogOut } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";

export default function RoomAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-shell" style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <header className="container topbar" style={{ borderBottom: "1px solid var(--line)" }}>
        <BrandLockup href="/room" />
        <Link className="button button-ghost" href="/"><LogOut size={16} /> Exit room console</Link>
      </header>
      <div className="container" style={{ paddingBlock: "28px 60px" }}>{children}</div>
    </main>
  );
}
