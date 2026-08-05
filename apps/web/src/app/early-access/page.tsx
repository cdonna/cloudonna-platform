import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EarlyAccess, { type Audience } from "@/components/landing/EarlyAccess";

export const metadata: Metadata = {
  title: "Request Early Access — ClouDonna",
  description:
    "Request early access to ClouDonna as an enterprise customer, software vendor, implementation partner, or community member.",
  alternates: { canonical: "/early-access" },
};

const validAudiences: Audience[] = ["customer", "vendor", "partner", "community"];

function parseAudience(value: string | string[] | undefined): Audience | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return validAudiences.find((audience) => audience === candidate);
}

export default async function EarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;
  const audience = parseAudience(params.type);

  return (
    <div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cloudonna-favicon-512.png"
            alt="ClouDonna"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-slate-950">
            Clou<span className="text-violet-600">Donna</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-violet-700"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <EarlyAccess audience={audience} />
    </div>
  );
}
