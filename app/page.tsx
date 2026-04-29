"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getWardrobe, getLooks } from "@/lib/storage";
import { Sparkles, ShirtIcon, Wand2, ArrowRight, Heart, Zap, Star } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({ pieces: 0, looks: 0 });

  useEffect(() => {
    setStats({ pieces: getWardrobe().length, looks: getLooks().length });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Sparkles className="w-4 h-4" /> MVP de Testes
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-brand-900 mb-4 leading-tight">
          Veste-se com
          <span className="bg-gradient-to-r from-brand-700 to-accent-500 bg-clip-text text-transparent"> Consciência</span>
          <br />e Expressão
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Fotografe suas peças, diga que energia quer vestir, e a IA compõe looks que falam a linguagem da sua alma — com o que você já tem.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/wardrobe" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
            <ShirtIcon className="w-5 h-5" /> Meu Guarda-Roupa
          </Link>
          <Link href="/generate" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
            <Wand2 className="w-5 h-5" /> Compor Look
          </Link>
        </div>
      </div>

      {/* Stats */}
      {(stats.pieces > 0 || stats.looks > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-16 animate-slide-up">
          <div className="card p-6 text-center">
            <div className="text-4xl font-extrabold text-brand-700">{stats.pieces}</div>
            <div className="text-gray-500 font-medium mt-1">peças no guarda-roupa</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl font-extrabold text-accent-500">{stats.looks}</div>
            <div className="text-gray-500 font-medium mt-1">composições criadas</div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: ShirtIcon, color: "bg-brand-100 text-brand-700", title: "Registre cada peça", desc: "A IA lê o código estético de cada peça — tipo, cor, textura e energia simbólica." },
          { icon: Heart, color: "bg-pink-100 text-pink-700", title: "Escolha que energia vestir", desc: "Diga o estado emocional que quer expressar. A IA encontra a composição certa." },
          { icon: Wand2, color: "bg-purple-100 text-purple-700", title: "Receba 3 composições únicas", desc: "Cada look pensa no seu corpo, seu contexto e a narrativa que você quer contar ao mundo." },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="card p-6 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-brand-700 to-accent-500 rounded-3xl p-10 text-center text-white">
        <Zap className="w-10 h-10 mx-auto mb-4 opacity-90" />
        <h2 className="text-3xl font-extrabold mb-3">Pronta para se expressar?</h2>
        <p className="text-white/80 mb-6">Registre suas peças e deixe a IA revelar o que seu guarda-roupa tem a dizer.</p>
        <Link href="/wardrobe" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-3 rounded-xl hover:bg-brand-50 transition shadow-lg">
          Iniciar minha jornada <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        <Star className="inline w-3 h-3 mr-1" />
        MVP de testes — dados salvos localmente no seu navegador
      </p>
    </div>
  );
}
