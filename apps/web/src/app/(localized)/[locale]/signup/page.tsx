import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/i18n/locales";
import { SignupForm } from "./SignupForm";

export { generateSignupMetadata as generateMetadata } from "./metadata";

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <SignupForm locale={locale} />;
}
