import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 font-extrabold text-2xl text-brand-800 mb-8">
        <Sparkles className="w-6 h-6 text-accent-500" />
        Looksy
      </Link>
      {children}
    </div>
  );
}
