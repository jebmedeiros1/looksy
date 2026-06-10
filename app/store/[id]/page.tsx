"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WardrobeStore, GarmentItem, GARMENT_CATEGORIES } from "@/lib/types";
import {
  ArrowLeft, Store, Eye, Copy, ShirtIcon, Loader2,
  Tags, Download, Check, AlertCircle, Trash2,
} from "lucide-react";
import clsx from "clsx";
import { useSession } from "next-auth/react";

function GarmentModal({ garment, onClose }: { garment: GarmentItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <img src={garment.imageUrl} alt={garment.type} className="w-full h-64 object-cover" />
        <div className="p-5">
          <h3 className="font-bold text-xl capitalize">{garment.type}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ background: garment.colorHex }} />
            <span className="text-sm text-gray-500">{garment.color}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
            {garment.season && <span><b>Estação:</b> {garment.season}</span>}
            {garment.fit && <span><b>Fit:</b> {garment.fit}</span>}
            {garment.length && <span><b>Comprimento:</b> {garment.length}</span>}
            {garment.material && <span><b>Material:</b> {garment.material}</span>}
          </div>
          {garment.style.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {garment.style.map((s) => (
                <span key={s} className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
          <button onClick={onClose} className="btn-secondary w-full mt-4">Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [store, setStore] = useState<WardrobeStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [zoom, setZoom] = useState<GarmentItem | null>(null);

  useEffect(() => {
    fetch(`/api/store/${id}`)
      .then((r) => r.json())
      .then((data) => { setStore(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const filtered = store?.garments.filter(
    (g) => filter === "all" || g.type.toLowerCase().includes(filter)
  ) ?? [];

  async function cloneWardrobe() {
    setError(null);
    setCloning(true);
    try {
      const res = await fetch(`/api/store/${id}/clone`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCloned(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao clonar");
    } finally {
      setCloning(false);
    }
  }

  async function deleteStore() {
    if (!confirm("Tem certeza que quer remover esta loja?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/store/${id}`, { method: "DELETE" });
      router.push("/store");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Loja não encontrada.</p>
        <Link href="/store" className="btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar à loja
        </Link>
      </div>
    );
  }

  const isOwner = session?.user?.id === store.userId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/store" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Todas as lojas
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-5 h-5 text-brand-600" />
              <h1 className="text-2xl font-extrabold text-brand-900">{store.name}</h1>
            </div>
            <p className="text-gray-600 leading-relaxed">{store.description || "Sem descrição."}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {store.views} visualizações</span>
              <span className="flex items-center gap-1"><Copy className="w-4 h-4" /> {store.clones} clones</span>
              <span className="flex items-center gap-1"><ShirtIcon className="w-4 h-4" /> {store.garments.length} peças</span>
            </div>
            {store.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {store.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <Tags className="w-3 h-3" /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isOwner ? (
              <button
                onClick={deleteStore}
                disabled={deleting}
                className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remover loja
              </button>
            ) : (
              <button
                onClick={cloneWardrobe}
                disabled={cloning || cloned}
                className={clsx(
                  "flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition",
                  cloned
                    ? "bg-green-100 text-green-700"
                    : "btn-primary"
                )}
              >
                {cloning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : cloned ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {cloned ? "Adicionado ao meu guarda-roupa!" : "Adicionar ao meu guarda-roupa"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {cloned && (
          <div className="mt-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
            ✅ {store.garments.length} peças adicionadas ao seu guarda-roupa!{" "}
            <Link href="/wardrobe" className="font-semibold underline">Ver guarda-roupa</Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {GARMENT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id === "all" ? "all" : c.id)}
            className={clsx(
              "text-sm font-semibold px-4 py-2 rounded-xl border whitespace-nowrap transition",
              filter === c.id
                ? "bg-brand-700 text-white border-brand-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Garments grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((g) => (
          <button
            key={g.id}
            onClick={() => setZoom(g)}
            className="card p-0 overflow-hidden hover:shadow-md transition group text-left"
          >
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img src={g.imageUrl} alt={g.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm capitalize text-gray-800">{g.type}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ background: g.colorHex }} />
                <span className="text-xs text-gray-500">{g.color}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {zoom && <GarmentModal garment={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
