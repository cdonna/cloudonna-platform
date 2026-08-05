import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DonnaAIExperience } from "@/components/donna-ai/DonnaAIExperience";

export const metadata: Metadata = {
  title: "Donna AI — Enterprise Decision Assistant · ClouDonna",
  description:
    "A guided, six-step assessment that produces an evidence-based enterprise technology recommendation. Public Alpha preview.",
};

export default function DonnaAIPage() {
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

      <DonnaAIExperience />
    </div>
  );
}
