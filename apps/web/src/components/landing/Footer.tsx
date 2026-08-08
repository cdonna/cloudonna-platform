import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
  { label: "Discovery", href: "/discovery" },
  { label: "Donna AI", href: "/donna-ai" },
  { label: "Independence", href: "/independence" },
];

const audienceLinks = [
  { label: "For Vendors", href: "/for-vendors" },
  { label: "For Partners", href: "/for-partners" },
  { label: "Become a Founding Tester", href: "/early-access" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Imprint", href: "/imprint" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="border-t border-titanium bg-obsidian px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/cloudonna-favicon-512.png"
                alt="ClouDonna"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-nova-ink">
                Clou<span className="text-nova-accent-strong">Donna</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-nova-ink-faint">
              Evidence over opinion. Decisions you can defend.
            </p>
          </div>

          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Audiences" links={audienceLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-titanium pt-8 text-sm text-nova-ink-faint sm:flex-row">
          <span>&copy; {new Date().getFullYear()} ClouDonna. All rights reserved.</span>
          <span className="rounded-full border border-titanium bg-carbon px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong">
            Public Alpha
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-ink-faint">{title}</div>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-nova-ink-muted transition duration-200 hover:text-nova-accent-strong">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
