import { BrandLockup } from "@/components/brand/brand-lockup";
import { RoomExitLink } from "@/components/room/room-exit-link";

export default function RoomAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-shell" style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <header className="container topbar" style={{ borderBottom: "1px solid var(--line)" }}>
        <BrandLockup href="/room" />
        <RoomExitLink />
      </header>
      <div className="container" style={{ paddingBlock: "28px 60px" }}>
        {children}
      </div>
    </main>
  );
}
