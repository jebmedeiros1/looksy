"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { WardrobeStore, GarmentItem, GARMENT_CATEGORIES } from "@/lib/types";
import {
  Store, Search, Tags, Eye, Copy, ShirtIcon, Plus, Loader2,
  ArrowRight, Sparkles, X, Check,
} from "lucide-react";
import clsx from "clsx";

// ── Create store modal ────────────────────────────────────────────────────────
function CreateStoreModal({
  garments,
  onClose,
  onCreated,
}: {
  garments: GarmentItem[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const filtered = garments.filter(
    (g) => filter === "all" || g.type.toLowerCase().includes(filter)
  );

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Dê um nome para a sua loja.");
    if (selected.size === 0) return setError("Selecione ao menos uma peça.");
    setLoading(true);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, tags, garmentIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar loja");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-900">Criar Loja</h2>
            <p className="text-sm text-gray-500 mt-0.5">Compartilhe seu estilo com outras usuárias</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nome da loja <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cápsula Minimalista Verão"
              className="input w-full"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte sobre o estilo, inspiração ou curadoria desta coleção..."
              className="input w-full resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {t}
                  <button onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="casual, verão, minimalista..."
                className="input flex-1 text-sm"
              />
              <button onClick={addTag} className="btn-secondary text-sm px-4">
                + Tag
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Peças a incluir ({selected.size} selecionadas)
            </label>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {GARMENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id === "all" ? "all" : c.id)}
                  className={clsx(
                    "text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap transition",
                    filter === c.id
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {garments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhuma peça no guarda-roupa ainda.{" "}
                <Link href="/wardrobe" className="text-brand-600 font-semibold underline">
                  Adicionar peças
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {filtered.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggle(g.id)}
                    className={clsx(
                      "relative rounded-xl overflow-hidden border-2 transition aspect-square",
                      selected.has(g.id) ? "border-brand-500 shadow-md" : "border-gray-200 hover:border-brand-200"
                    )}
                  >
                    <img src={g.imageUrl} alt={g.type} className="w-full h-full object-cover" />
                    {selected.has(g.id) && (
                      <div className="absolute inset-0 bg-brand-700/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-brand-700 bg-white rounded-full p-0.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
            Publicar loja
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Store card ────────────────────────────────────────────────────────────────
function StoreCard({ store }: { store: WardrobeStore }) {
  const preview = store.garments.slice(0, 4);
  return (
    <Link href={`/store/${store.id}`} className="card p-0 overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="grid grid-cols-2 h-40 bg-gray-100">
        {preview.map((g, i) => (
          <img
            key={i}
            src={g.imageUrl}
            alt={g.type}
            className="w-full h-full object-cover"
          />
        ))}
        {Array.from({ length: Math.max(0, 4 - preview.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 flex items-center justify-center">
            <ShirtIcon className="w-6 h-6 text-gray-300" />
          </div>
        ))}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition line-clamp-1">
          {store.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{store.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {store.views}</span>
          <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> {store.clones}</span>
          <span className="flex items-center gap-1"><ShirtIcon className="w-3 h-3" /> {store.garments.length} peças</span>
        </div>
        {store.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {store.tags.slice(0, 3).map((t) => (
              <span key={t} className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StorePage() {
  const [stores, setStores] = useState<WardrobeStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [garments, setGarments] = useState<GarmentItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  async function load(q = "") {
    setLoading(true);
    try {
      const [sRes, gRes] = await Promise.all([
        fetch(`/api/store${q ? `?q=${encodeURIComponent(q)}` : ""}`),
        fetch("/api/user/garments"),
      ]);
      if (sRes.ok) setStores(await sRes.json());
      if (gRes.ok) setGarments(await gRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(query);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-6 h-6 text-brand-700" />
            <h1 className="text-3xl font-extrabold text-brand-900">Loja de Estilos</h1>
          </div>
          <p className="text-gray-500">Explore guarda-roupas de outras usuárias e adicione peças ao seu.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Publicar meu guarda-roupa
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, estilo ou tag..."
            className="input pl-10 w-full"
          />
        </div>
        <button type="submit" className="btn-secondary px-5">Buscar</button>
      </form>

      {/* Tags shortcut */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["casual", "minimalista", "festa", "trabalho", "verão", "boho", "streetwear"].map((tag) => (
          <button
            key={tag}
            onClick={() => { setQuery(tag); load(tag); }}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-brand-300 hover:text-brand-700 transition"
          >
            <Tags className="w-3 h-3" /> {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma loja encontrada.</p>
          <p className="text-gray-400 text-sm mt-1">Seja a primeira a publicar seu estilo!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-6 flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4" /> Criar minha loja
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {stores.map((s) => <StoreCard key={s.id} store={s} />)}
        </div>
      )}

      {showCreate && (
        <CreateStoreModal
          garments={garments}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
