import Link from "next/link";
import { Sparkles, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-16">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-accent-500 px-8 py-12 text-white">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <WifiOff className="h-7 w-7" />
          </div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Looksy offline
          </p>
          <h1 className="text-4xl font-extrabold leading-tight">
            Sem internet agora, mas seu estilo continua por aqui.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Assim que a conexao voltar, recarregue o app para acessar geracao de looks, login e sincronizacoes.
          </p>
        </div>

        <div className="space-y-4 px-8 py-8">
          <p className="text-gray-600">
            O Looksy ja esta preparado como PWA: voce pode instalar no celular ou desktop e abrir como aplicativo.
          </p>
          <Link href="/" className="btn-primary inline-flex">
            Tentar voltar para o Looksy
          </Link>
        </div>
      </section>
    </div>
  );
}
