"use client";
import { useState, useEffect, useRef } from "react";
import { GarmentItem, Look, MOODS, EVENT_CHIPS, FEELING_OPTIONS, AvatarConfig, MannequinConfig, mannequinToPrompt } from "@/lib/types";
import { compressImage } from "@/lib/storage";
import {
  Wand2, Loader2, Sparkles, Heart, BookmarkCheck, RefreshCw,
  AlertCircle, ArrowRight, Shirt, Image as ImageIcon, Upload,
  User, Box, X, Download, ZoomIn,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

type VisualMode = "choose" | "photo" | "loading" | "result" | "error";
type ModelChoice = "dalle3" | "gpt-image-1";

interface VisualState {
  look: Look | null;
  mode: VisualMode;
  imageUrl: string | null;
  error: string | null;
  userPhoto: string | null;
  modelChoice: ModelChoice;
}

export default function GeneratePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [event, setEvent] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [looks, setLooks] = useState<Look[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [feelings, setFeelings] = useState<Record<string, { emoji: string; label: string }>>({});
  const [showFeelingFor, setShowFeelingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [garments, setGarments] = useState<GarmentItem[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(true);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);

  const [visual, setVisual] = useState<VisualState>({
    look: null, mode: "choose", imageUrl: null, error: null, userPhoto: null, modelChoice: "gpt-image-1",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoadingGarments(true);
      try {
        const [gRes, lRes, aRes] = await Promise.all([
          fetch("/api/user/garments"),
          fetch("/api/user/looks"),
          fetch("/api/user/avatar"),
        ]);
        if (gRes.ok) setGarments(await gRes.json());
        if (lRes.ok) {
          const existingLooks: Look[] = await lRes.json();
          setSaved(new Set(existingLooks.filter((l) => l.saved).map((l) => l.id)));
        }
        if (aRes.ok) {
          const { avatar: a } = await aRes.json();
          setAvatar(a ?? null);
        }
      } finally {
        setLoadingGarments(false);
      }
    }
    loadData();
  }, []);

  function toggleMood(id: string) {
    setMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  async function generate() {
    setError(null);
    setLoading(true);
    setStep(3);
    try {
      const moodLabels = moods.map((id) => MOODS.find((m) => m.id === id)?.label ?? id);
      const res = await fetch("/api/generate-look", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garments, eventContext: event, moods: moodLabels }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLooks(data.looks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar looks");
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(look: Look) {
    const updated = { ...look, saved: true };
    await fetch("/api/user/looks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaved((prev) => new Set([...Array.from(prev), look.id]));
  }

  async function handleFeelingSelect(lookId: string, emoji: string, label: string) {
    setFeelings((prev) => ({ ...prev, [lookId]: { emoji, label } }));
    setShowFeelingFor(null);
    await fetch(`/api/user/looks/${lookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feelingEmoji: emoji, feeling: label }),
    });
  }

  function reset() {
    setLooks([]);
    setError(null);
    setStep(1);
    setEvent("");
    setMoods([]);
  }

  function openVisualModal(look: Look) {
    setVisual((v) => ({ look, mode: "choose", imageUrl: null, error: null, userPhoto: null, modelChoice: v.modelChoice }));
  }

  function closeVisualModal() {
    setVisual((v) => ({ look: null, mode: "choose", imageUrl: null, error: null, userPhoto: null, modelChoice: v.modelChoice }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, 1024);
    const base64 = dataUrl.split(",")[1];
    setVisual((v) => ({ ...v, userPhoto: base64, mode: "photo" }));
  }

  function toPngDataUrl(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    });
  }

  async function generateVisual(withPhoto: boolean, overridePhoto?: string) {
    if (!visual.look) return;
    setVisual((v) => ({ ...v, mode: "loading" }));
    try {
      const isPng = visual.modelChoice === "gpt-image-1";
      const photoSrc = overridePhoto ?? (withPhoto ? visual.userPhoto : null);

      const lookGarments = isPng
        ? await Promise.all(visual.look.garments.map(async (g) => ({
            ...g,
            imageUrl: await toPngDataUrl(g.imageUrl),
          })))
        : visual.look.garments;

      let userPhotoPayload: string | undefined;
      if (photoSrc) {
        if (isPng) {
          const src = photoSrc.startsWith("data:") ? photoSrc : `data:image/jpeg;base64,${photoSrc}`;
          const pngUrl = await toPngDataUrl(src);
          userPhotoPayload = pngUrl;
        } else {
          userPhotoPayload = photoSrc;
        }
      }

      // mannequin from saved avatar (only when no photo)
      let mannequinPayload: MannequinConfig | undefined;
      if (!userPhotoPayload && avatar?.type === "mannequin") {
        mannequinPayload = avatar.mannequin;
      }

      const res = await fetch("/api/generate-look-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          look: {
            name: visual.look.name,
            garments: lookGarments,
            moodTags: visual.look.moodTags,
            eventContext: visual.look.eventContext,
          },
          modelChoice: visual.modelChoice,
          ...(userPhotoPayload ? { userPhotoBase64: userPhotoPayload } : {}),
          ...(mannequinPayload ? { mannequinConfig: mannequinPayload } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVisual((v) => ({ ...v, mode: "result", imageUrl: data.imageUrl }));
    } catch (e: unknown) {
      setVisual((v) => ({ ...v, mode: "error", error: e instanceof Error ? e.message : "Erro ao gerar imagem" }));
    }
  }

  if (loadingGarments) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (garments.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Shirt className="w-16 h-16 mx-auto text-brand-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Guarda-roupa vazio</h2>
        <p className="text-gray-500 mb-6">Registre ao menos 3 peças antes de compor sua primeira expressão.</p>
        <Link href="/wardrobe" className="btn-primary inline-flex items-center gap-2">
          Ir ao Guarda-Roupa <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-brand-900 mb-2">Compor Look</h1>
          <p className="text-gray-500">{garments.length} peças disponíveis no guarda-roupa</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step >= s ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-400"
              )}>
                {s}
              </div>
              {s < 3 && <div className={clsx("w-12 h-1 rounded", step > s ? "bg-brand-700" : "bg-gray-200")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Event */}
        {step === 1 && (
          <div className="card p-8 max-w-2xl mx-auto animate-slide-up">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Qual é o contexto?</h2>
            <p className="text-gray-500 text-sm mb-6">O contexto molda a expressão. Descreva a ocasião ou escolha uma sugestão.</p>
            <textarea
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="Ex: reunião com clientes no restaurante, jantar romântico, churrasco na laje..."
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-800 text-sm resize-none focus:outline-none focus:border-brand-400 transition mb-4"
              rows={3}
            />
            <div className="flex flex-wrap gap-2 mb-6">
              {EVENT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setEvent(chip)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
                    event === chip ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700"
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              disabled={!event.trim()}
              onClick={() => setStep(2)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Mood */}
        {step === 2 && (
          <div className="card p-8 max-w-2xl mx-auto animate-slide-up">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Que energia quer vestir?</h2>
            <p className="text-gray-500 text-sm mb-6">Escolha até 3 estados emocionais. Pode pular para uma composição livre.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => toggleMood(mood.id)}
                  className={clsx(
                    "border-2 rounded-2xl p-4 flex flex-col items-center gap-2 text-sm font-semibold transition-all",
                    moods.includes(mood.id)
                      ? "border-brand-500 bg-brand-50 scale-105 shadow"
                      : "border-gray-200 hover:border-brand-300 bg-white"
                  )}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className={moods.includes(mood.id) ? "text-brand-700" : "text-gray-600"}>{mood.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Voltar</button>
              <button onClick={generate} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4" /> Compor Looks
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="text-center py-24">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-100 rounded-full mb-6">
                  <Sparkles className="w-10 h-10 text-brand-700 animate-pulse" />
                </div>
                <p className="text-xl font-bold text-brand-800 mb-2">Compondo sua expressão...</p>
                <p className="text-gray-500 text-sm">Lendo o vocabulário do seu guarda-roupa...</p>
                <div className="flex justify-center gap-1 mt-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="card p-8 max-w-md mx-auto text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="font-semibold text-gray-800 mb-2">Algo deu errado</p>
                <p className="text-sm text-red-500 mb-6">{error}</p>
                <button onClick={reset} className="btn-primary">Tentar novamente</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-brand-900">Suas 3 composições</h2>
                    <p className="text-gray-500 text-sm mt-1">Contexto: <span className="font-medium text-gray-700">{event}</span></p>
                  </div>
                  <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm py-2">
                    <RefreshCw className="w-4 h-4" /> Nova composição
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {looks.map((look) => (
                    <div key={look.id} className="card hover:shadow-lg transition-shadow flex flex-col">
                      <div className="grid grid-cols-2 gap-1 p-1 bg-gray-50">
                        {look.garments.slice(0, 4).map((g, i) => (
                          <img key={i} src={g.imageUrl} alt={g.type} className="w-full aspect-square object-cover rounded-lg" />
                        ))}
                        {look.garments.length === 1 && <div className="aspect-square bg-gray-100 rounded-lg" />}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-extrabold text-gray-900 text-lg mb-2">{look.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {look.moodTags.map((tag) => (
                            <span key={tag} className="badge bg-brand-100 text-brand-700">{tag}</span>
                          ))}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed flex-1">{look.explanation}</p>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                          <p className="text-xs text-gray-400 font-medium">
                            {look.garments.map((g) => g.type).join(" · ")}
                          </p>
                          <button
                            onClick={() => openVisualModal(look)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-accent-50 text-accent-700 hover:bg-accent-100 border border-accent-200"
                          >
                            <ImageIcon className="w-4 h-4" /> Visualizar
                          </button>
                          <button
                            onClick={() => handleSave(look)}
                            disabled={saved.has(look.id)}
                            className={clsx(
                              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                              saved.has(look.id)
                                ? "bg-green-100 text-green-700 cursor-default"
                                : "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200"
                            )}
                          >
                            {saved.has(look.id)
                              ? <><BookmarkCheck className="w-4 h-4" /> Guardado!</>
                              : <><Heart className="w-4 h-4" /> Guardar look</>}
                          </button>

                          {/* Feeling picker — shown after saving */}
                          {saved.has(look.id) && (
                            feelings[look.id] ? (
                              <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-600 bg-pink-50 rounded-xl">
                                <span className="text-lg">{feelings[look.id].emoji}</span>
                                <span className="font-medium">{feelings[look.id].label}</span>
                              </div>
                            ) : showFeelingFor === look.id ? (
                              <div className="mt-1">
                                <p className="text-xs text-center text-gray-500 mb-2">Como você se sentiu?</p>
                                <div className="grid grid-cols-5 gap-1">
                                  {FEELING_OPTIONS.map((f) => (
                                    <button
                                      key={f.value}
                                      onClick={() => handleFeelingSelect(look.id, f.emoji, f.label)}
                                      title={f.label}
                                      className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl hover:bg-pink-50 transition"
                                    >
                                      <span className="text-xl">{f.emoji}</span>
                                      <span className="text-[10px] text-gray-500 leading-tight text-center">{f.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowFeelingFor(look.id)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 transition"
                              >
                                <span className="text-base">💭</span> Como me senti
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Visual Modal */}
      {visual.look && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeVisualModal(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">{visual.look.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Visualização simbólica por IA</p>
              </div>
              <button onClick={closeVisualModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {(visual.mode === "choose" || visual.mode === "photo") && (
              <div className="px-6 pt-4 pb-0">
                <p className="text-xs text-gray-500 font-medium mb-2">Modelo de IA</p>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold">
                  <button
                    onClick={() => setVisual((v) => ({ ...v, modelChoice: "gpt-image-1" }))}
                    className={clsx("flex-1 py-2 transition-colors", visual.modelChoice === "gpt-image-1" ? "bg-brand-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50")}
                  >
                    gpt-image-1 <span className="text-xs opacity-70 ml-1">✦ mais fiel</span>
                  </button>
                  <button
                    onClick={() => setVisual((v) => ({ ...v, modelChoice: "dalle3" }))}
                    className={clsx("flex-1 py-2 transition-colors border-l border-gray-200", visual.modelChoice === "dalle3" ? "bg-brand-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50")}
                  >
                    DALL·E 3
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              {visual.mode === "choose" && (
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm text-center mb-1">Como quer ver essa composição ganhar vida?</p>

                  {/* Saved avatar option */}
                  {avatar && (
                    <button
                      onClick={() => {
                        if (avatar.type === "photo") {
                          generateVisual(false, avatar.photoBase64);
                        } else {
                          generateVisual(false);
                        }
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-brand-400 bg-brand-50 hover:bg-brand-100 transition group"
                    >
                      {avatar.type === "photo" ? (
                        <img src={avatar.photoBase64} alt="Seu avatar" className="w-12 h-12 rounded-xl object-cover border-2 border-brand-200 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🪆</div>
                      )}
                      <div className="text-left flex-1">
                        <p className="font-bold text-brand-800 text-sm">
                          {avatar.type === "photo" ? "Usar minha foto cadastrada" : "Usar meu manequim"}
                        </p>
                        <p className="text-xs text-brand-600 mt-0.5 line-clamp-1">
                          {avatar.type === "mannequin"
                            ? mannequinToPrompt(avatar.mannequin)
                            : "Foto salva no seu perfil"}
                        </p>
                      </div>
                      <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    </button>
                  )}

                  {/* Upload new photo */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition group"
                  >
                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center group-hover:bg-brand-200 transition flex-shrink-0">
                      <User className="w-6 h-6 text-brand-700" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800 text-sm">
                        {avatar?.type === "photo" ? "Enviar outra foto" : "Usar minha foto agora"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Veja a expressão no seu próprio corpo</p>
                    </div>
                    <Upload className="w-4 h-4 text-brand-400 ml-auto" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                  {/* Mannequin without config */}
                  {!avatar && (
                    <button
                      onClick={() => generateVisual(false)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition group"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition flex-shrink-0">
                        <Box className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800 text-sm">Gerar com manequim genérico</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ou configure um manequim personalizado no{" "}
                          <span className="text-brand-600 underline">Perfil</span>
                        </p>
                      </div>
                      <Sparkles className="w-4 h-4 text-gray-400 ml-auto" />
                    </button>
                  )}

                  {avatar?.type === "mannequin" && (
                    <button
                      onClick={() => generateVisual(false)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition group"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition flex-shrink-0">
                        <Box className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800 text-sm">Manequim genérico</p>
                        <p className="text-xs text-gray-500 mt-0.5">Sem referência de corpo</p>
                      </div>
                      <Box className="w-4 h-4 text-gray-400 ml-auto" />
                    </button>
                  )}
                </div>
              )}

              {visual.mode === "photo" && visual.userPhoto && (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm text-center">Foto pronta. Quer visualizar a composição?</p>
                  <div className="flex justify-center">
                    <img src={`data:image/jpeg;base64,${visual.userPhoto}`} alt="Sua foto" className="w-40 h-40 object-cover rounded-2xl shadow border-2 border-brand-200" />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setVisual((v) => ({ ...v, mode: "choose", userPhoto: null }))} className="btn-secondary flex-1 text-sm py-2.5">Trocar foto</button>
                    <button onClick={() => generateVisual(true)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                      <Wand2 className="w-4 h-4" /> Gerar imagem
                    </button>
                  </div>
                </div>
              )}

              {visual.mode === "loading" && (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                    <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
                  </div>
                  <p className="font-bold text-brand-800 mb-1">Compondo a visualização...</p>
                  <p className="text-sm text-gray-500">
                    {visual.modelChoice === "gpt-image-1" ? "Analisando cada peça em detalhe — pode levar ~30s" : "Isso pode levar alguns segundos"}
                  </p>
                </div>
              )}

              {visual.mode === "result" && visual.imageUrl && (
                <div className="space-y-4">
                  <div className="relative group">
                    <img src={visual.imageUrl} alt={`Visualização: ${visual.look.name}`} className="w-full rounded-2xl shadow-md" />
                    <a href={visual.imageUrl} target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition" title="Ver em tamanho real">
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setVisual((v) => ({ ...v, mode: "choose", imageUrl: null, userPhoto: null }))} className="btn-secondary flex-1 text-sm py-2.5">Recompor</button>
                    <a href={visual.imageUrl} download={`look-${visual.look.id}.jpg`} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                      <Download className="w-4 h-4" /> Baixar
                    </a>
                  </div>
                </div>
              )}

              {visual.mode === "error" && (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-800 mb-1">Erro ao gerar imagem</p>
                  <p className="text-sm text-red-500 mb-4">{visual.error}</p>
                  <button onClick={() => setVisual((v) => ({ ...v, mode: "choose", error: null }))} className="btn-primary text-sm py-2.5 px-6">Tentar novamente</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
