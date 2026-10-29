import Image from "next/image";
import Link from "next/link";

export function BrandLockup({
  href = "/",
  inverse = false,
  subtitle = "Western Region",
}: {
  href?: string;
  inverse?: boolean;
  subtitle?: string;
}) {
  return (
    <Link className="brand-lockup" href={href} aria-label={`MGSOSA West ${subtitle} home`}>
      <Image
        src="/brand/mgsosa-mark-transparent.png"
        alt=""
        width={64}
        height={64}
        priority
      />
      <div style={{ color: inverse ? "white" : undefined }}>
        <strong>MGSOSA West</strong>
        <span style={{ color: inverse ? "rgba(255,255,255,.68)" : undefined }}>{subtitle}</span>
      </div>
    </Link>
  );
}
