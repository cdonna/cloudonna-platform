import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/i18n/locales";
import { LoginForm } from "./LoginForm";

export { generateLoginMetadata as generateMetadata } from "./metadata";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <LoginForm locale={locale} />;
}
