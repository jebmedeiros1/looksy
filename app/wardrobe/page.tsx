"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  GarmentItem, GARMENT_CATEGORIES,
  CLOTHING_TYPES, FIT_OPTIONS, LENGTH_OPTIONS,
  STYLE_OPTIONS, OCCASION_OPTIONS, MATERIAL_OPTIONS,
} from "@/lib/types";
import { compressImage, generateId } from "@/lib/storage";
import { Upload, X, Loader2, ShirtIcon, Trash2, Plus, AlertCircle, Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface PendingItem {
  imageUrl: string;
  type: string;
  color: string;
  colorHex: string;
  length?: string;
  fit?: string;
  style: string[];
  occasions: string[];
  season: string;
  material?: string;
  confidence?: number;
}

// ── Editable card for each detected item ──────────────────────────────────────
function PendingItemCard({
  item,
  saving,
  onChange,
  onSave,
  onDiscard,
}: {
  item: PendingItem;
  saving: boolean;
  onChange: (u: Partial<PendingItem>) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const fitOpts = FIT_OPTIONS[item.type] ?? [];
  const lengthOpts = LENGTH_OPTIONS[item.type] ?? [];

  function toggleArr(key: "style" | "occasions", val: string) {
    const arr = item[key];
    onChange({ [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] });
  }

  function changeType(t: string) {
    onChange({ type: t, fit: undefined, length: undefined });
  }

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex gap-4 items-start">
        {/* photo */}
        <img
          src={item.imageUrl}
          alt={item.type}
          className="w-24 h-24 object-cover rounded-xl shadow flex-shrink-0"
        />

        <div className="flex-1 min-w-0 space-y-3">
          {/* type + color */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tipo</p>
              <div className="relative">
                <select
                  value={item.type}
                  onChange={(e) => changeType(e.target.value)}
                  className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 bg-white focus:outline-none focus:border-brand-400 capitalize"
                >
                  {CLOTHING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Cor</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                  title={item.colorHex}
                />
                <input
                  type="text"
                  value={item.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 w-32 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>
          </div>

          {/* comprimento */}
          {lengthOpts.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Comprimento</p>
              <div className="flex flex-wrap gap-1.5">
                {lengthOpts.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onChange({ length: item.length === opt ? undefined : opt })}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-lg border font-medium transition-all",
                      item.length === opt
                        ? "bg-brand-700 text-white border-brand-700"
                        : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* modelagem */}
          {fitOpts.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Modelagem</p>
              <div className="flex flex-wrap gap-1.5">
                {fitOpts.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onChange({ fit: item.fit === opt ? undefined : opt })}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-lg border font-medium transition-all",
                      item.fit === opt
                        ? "bg-accent-600 text-white border-accent-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-accent-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* estilo */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Estilo</p>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleArr("style", s)}
                  className={clsx(
                    "text-xs px-2 py-1 rounded-lg border font-medium transition-all",
                    item.style.includes(s)
                      ? "bg-brand-100 text-brand-700 border-brand-300"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ocasião */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Ocasião</p>
            <div className="flex flex-wrap gap-1.5">
              {OCCASION_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => toggleArr("occasions", o)}
                  className={clsx(
                    "text-xs px-2 py-1 rounded-lg border font-medium transition-all",
                    item.occasions.includes(o)
                      ? "bg-accent-100 text-accent-600 border-accent-300"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* estação + material */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Estação</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { val: "verao", label: "Verão" },
                  { val: "inverno", label: "Inverno" },
                  { val: "meia-estacao", label: "Meia-estação" },
                  { val: "todas", label: "Todas" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => onChange({ season: val })}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-lg border font-medium transition-all",
                      item.season === val
                        ? "bg-gray-700 text-white border-gray-700"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Material</p>
              <div className="relative">
                <select
                  value={item.material ?? ""}
                  onChange={(e) => onChange({ material: e.target.value || undefined })}
                  className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 bg-white focus:outline-none focus:border-brand-400"
                >
                  <option value="">—</option>
                  {MATERIAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onDiscard}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Descartar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Salvar no armário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function WardrobePage() {
  const [items, setItems] = useState<GarmentItem[]>([]);
  const [category, setCategory] = useState("all");
  const [preview, setPreview] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/user/garments");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = category === "all" ? items : items.filter((i) => {
    const t = i.type.toLowerCase();
    if (category === "top") return ["camiseta","blusa","camisa","top","body","regata"].some((x) => t.includes(x));
    if (category === "bottom") return ["calca","saia","shorts","bermuda","legging"].some((x) => t.includes(x));
    if (category === "dress") return ["vestido","macacao"].some((x) => t.includes(x));
    if (category === "outerwear") return ["jaqueta","blazer","casaco","cardigan"].some((x) => t.includes(x));
    if (category === "shoes") return ["sapato","tenis","sandalia","bota","chinelo"].some((x) => t.includes(x));
    if (category === "accessory") return ["bolsa","cinto","chapeu","oculos","colar","brinco","anel","pulseira","acessorio"].some((x) => t.includes(x));
    return true;
  });

  async function handleFile(file: File) {
    setError(null);
    setPendingItems([]);
    setPreview(null);
    try {
      const compressed = await compressImage(file, 600);
      setPreview(compressed);
      setClassifying(true);
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: compressed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const detected: Array<Record<string, unknown>> = data.items ?? [data];
      if (!detected.length) throw new Error("Nenhuma peça identificada. Tente outra foto.");

      setPendingItems(
        detected.map((item) => ({
          imageUrl: compressed,
          type: String(item.type ?? "outro"),
          color: String(item.color ?? ""),
          colorHex: String(item.colorHex ?? "#888888"),
          length: item.length != null ? String(item.length) : undefined,
          fit: item.fit != null ? String(item.fit) : undefined,
          style: Array.isArray(item.style) ? item.style.map(String) : [String(item.style)].filter(Boolean),
          occasions: Array.isArray(item.occasions) ? item.occasions.map(String) : [String(item.occasions)].filter(Boolean),
          season: String(item.season ?? "todas"),
          material: item.material != null ? String(item.material) : undefined,
          confidence: typeof item.confidence === "number" ? item.confidence : undefined,
        }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setClassifying(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }

  function updatePending(idx: number, updates: Partial<PendingItem>) {
    setPendingItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  }

  function discardPending(idx: number) {
    setPendingItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) setPreview(null);
      return next;
    });
  }

  function clearAll() {
    setPendingItems([]);
    setPreview(null);
    setError(null);
  }

  async function savePending(idx: number) {
    const item = pendingItems[idx];
    setSavingIndex(idx);
    try {
      await fetch("/api/user/garments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: generateId(),
          ...item,
          createdAt: new Date().toISOString(),
        } as GarmentItem),
      });
      await load();
      discardPending(idx);
    } finally {
      setSavingIndex(null);
    }
  }

  async function saveAllPending() {
    setSavingAll(true);
    try {
      await Promise.all(
        pendingItems.map((item) =>
          fetch("/api/user/garments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: generateId(),
              ...item,
              createdAt: new Date().toISOString(),
            } as GarmentItem),
          })
        )
      );
      await load();
      clearAll();
    } finally {
      setSavingAll(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/user/garments/${id}`, { method: "DELETE" });
    await load();
    setDeleteId(null);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-900">Meu Guarda-Roupa</h1>
          <p className="text-gray-500 mt-1">
            {items.length} {items.length === 1 ? "peça registrada" : "peças registradas"}
          </p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Registrar peça
        </button>
      </div>

      {/* ── Upload zone (idle / classifying) ── */}
      {pendingItems.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !preview && !classifying && fileRef.current?.click()}
          className={clsx(
            "card border-2 border-dashed p-8 mb-8 text-center transition-all",
            classifying || preview
              ? "border-brand-300 cursor-default"
              : "border-gray-200 hover:border-brand-400 hover:bg-brand-50 cursor-pointer"
          )}
        >
          {classifying ? (
            <div className="flex flex-col md:flex-row gap-6 items-start text-left">
              {preview && (
                <img src={preview} alt="preview" className="w-40 h-40 object-cover rounded-xl shadow flex-shrink-0" />
              )}
              <div className="flex items-center gap-3 text-brand-700 self-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Identificando as peças da foto...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col md:flex-row gap-6 items-start text-left">
              {preview && (
                <div className="relative flex-shrink-0">
                  <img src={preview} alt="preview" className="w-40 h-40 object-cover rounded-xl shadow" />
                  <button
                    onClick={(e) => { e.stopPropagation(); clearAll(); }}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-red-500 text-sm self-center">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Upload className="w-10 h-10 text-brand-300" />
              <div>
                <p className="font-semibold text-gray-600">Traga uma foto da peça ou look</p>
                <p className="text-sm mt-1">A IA identifica todas as peças visíveis. JPG, PNG ou WEBP.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Pending items editor ── */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={pendingItems[0].imageUrl}
                alt="foto"
                className="w-12 h-12 object-cover rounded-lg shadow-sm"
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {pendingItems.length === 1
                    ? "1 peça identificada"
                    : `${pendingItems.length} peças identificadas`}
                </p>
                <p className="text-sm text-gray-500">Revise e ajuste antes de salvar</p>
              </div>
            </div>
            <div className="flex gap-2">
              {pendingItems.length > 1 && (
                <button
                  onClick={saveAllPending}
                  disabled={savingAll}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar todas
                </button>
              )}
              <button onClick={clearAll} className="btn-secondary text-sm p-2.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {pendingItems.map((item, idx) => (
              <PendingItemCard
                key={idx}
                item={item}
                saving={(savingIndex === idx) || savingAll}
                onChange={(updates) => updatePending(idx, updates)}
                onSave={() => savePending(idx)}
                onDiscard={() => discardPending(idx)}
              />
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {GARMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
              category === cat.id
                ? "bg-brand-700 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand-300"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loadingItems ? (
        <div className="text-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShirtIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Seu guarda-roupa aguarda suas histórias</p>
          <p className="text-sm mt-1">Comece registrando as peças que mais expressam quem você é</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Nenhuma peça nesta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="card group relative overflow-visible hover:shadow-md transition-shadow">
              <img src={item.imageUrl} alt={item.type} className="w-full aspect-square object-cover" />
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 border" style={{ backgroundColor: item.colorHex }} />
                  <span className="text-xs font-semibold text-gray-700 capitalize truncate">{item.type}</span>
                </div>
                <span className="text-xs text-gray-400 capitalize">{item.color}</span>
                {(item.length || item.fit) && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.length && (
                      <span className="text-xs text-brand-600 font-medium">{item.length}</span>
                    )}
                    {item.fit && (
                      <span className="text-xs text-gray-500">{item.length ? "· " : ""}{item.fit}</span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setDeleteId(item.id)}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6 animate-slide-up">
            <h3 className="font-bold text-lg mb-2">Remover peça?</h3>
            <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 text-white font-semibold px-4 py-3 rounded-xl hover:bg-red-600 transition active:scale-95"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
