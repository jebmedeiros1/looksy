"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Download, Trash2, Loader2, AlertCircle,
  CheckCircle2, UserCircle, KeyRound, Camera, User2,
  Sparkles, X, Check,
} from "lucide-react";
import {
  AvatarConfig, MannequinConfig,
  AVATAR_HEIGHT_OPTIONS, AVATAR_SKIN_OPTIONS,
  AVATAR_BODY_OPTIONS, AVATAR_HAIR_COLOR_OPTIONS, AVATAR_HAIR_TYPE_OPTIONS,
  mannequinToPrompt,
} from "@/lib/types";
import { compressImage } from "@/lib/storage";
import clsx from "clsx";

// ── Avatar Builder ────────────────────────────────────────────────────────────
function AvatarSection() {
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [mode, setMode] = useState<"idle" | "mannequin" | "photo">("idle");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const photoRef = useRef<HTMLInputElement>(null);

  const [mannequin, setMannequin] = useState<MannequinConfig>({
    height: "media",
    skin: "morena",
    body: "ampulheta",
    hair: "castanho",
    hairType: "ondulado",
  });
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/avatar")
      .then((r) => r.json())
      .then(({ avatar: a }: { avatar: AvatarConfig | null }) => {
        if (a) {
          setAvatar(a);
          if (a.type === "mannequin") { setMannequin(a.mannequin); setMode("mannequin"); }
          else { setPhotoBase64(a.photoBase64); setMode("photo"); }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 512);
    setPhotoBase64(compressed);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const body: AvatarConfig = mode === "mannequin"
      ? { type: "mannequin", mannequin }
      : { type: "photo", photoBase64: photoBase64! };
    await fetch("/api/user/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setAvatar(body);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function remove() {
    setSaving(true);
    await fetch("/api/user/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(null),
    });
    setAvatar(null);
    setMode("idle");
    setPhotoBase64(null);
    setSaving(false);
  }

  const mannequinPreview = mode === "mannequin" ? mannequinToPrompt(mannequin) : null;

  return (
    <div className="card p-6 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-brand-600" />
        <h2 className="font-bold text-gray-800">Meu avatar para looks</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Configure como você quer aparecer nas imagens de look geradas pela IA.
      </p>

      {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>}

      {!loading && (
        <>
          {/* Current avatar status */}
          {avatar && mode !== "idle" && (
            <div className="flex items-center gap-3 bg-brand-50 rounded-xl p-3 mb-5">
              {avatar.type === "photo" ? (
                <img src={avatar.photoBase64} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-brand-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-2xl">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-brand-800">
                  {avatar.type === "photo" ? "Foto cadastrada" : "Manequim configurado"}
                </p>
                {avatar.type === "mannequin" && (
                  <p className="text-xs text-brand-600 truncate">{mannequinToPrompt(avatar.mannequin)}</p>
                )}
              </div>
              <button onClick={remove} disabled={saving} className="text-gray-400 hover:text-red-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mode picker */}
          {mode === "idle" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("mannequin")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-500 hover:bg-brand-50 transition"
              >
                <span className="text-4xl">🪆</span>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-sm">Criar Manequim</p>
                  <p className="text-xs text-gray-500 mt-0.5">Escolha altura, corpo, pele e cabelo</p>
                </div>
              </button>
              <button
                onClick={() => setMode("photo")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition"
              >
                <span className="text-4xl">📸</span>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-sm">Usar Foto</p>
                  <p className="text-xs text-gray-500 mt-0.5">A IA veste as peças em você</p>
                </div>
              </button>
            </div>
          )}

          {/* Mannequin builder */}
          {mode === "mannequin" && (
            <div className="space-y-5">
              {/* Height */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Altura</p>
                <div className="flex gap-2">
                  {AVATAR_HEIGHT_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setMannequin((m) => ({ ...m, height: o.id }))}
                      className={clsx(
                        "flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition",
                        mannequin.height === o.id
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600 hover:border-brand-200"
                      )}
                    >
                      <div>{o.label}</div>
                      <div className="text-xs font-normal text-gray-400">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin tone */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Tom de pele</p>
                <div className="flex gap-3">
                  {AVATAR_SKIN_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setMannequin((m) => ({ ...m, skin: o.id }))}
                      title={o.label}
                      className={clsx(
                        "relative w-10 h-10 rounded-full border-4 transition",
                        mannequin.skin === o.id ? "border-brand-500 scale-110 shadow-md" : "border-transparent hover:border-gray-300"
                      )}
                      style={{ background: o.hex }}
                    >
                      {mannequin.skin === o.id && (
                        <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {AVATAR_SKIN_OPTIONS.find((o) => o.id === mannequin.skin)?.label}
                </p>
              </div>

              {/* Body shape */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Formato do corpo</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_BODY_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setMannequin((m) => ({ ...m, body: o.id }))}
                      className={clsx(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition",
                        mannequin.body === o.id
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-500 hover:border-brand-200"
                      )}
                    >
                      <span className="text-xl leading-none">{o.icon}</span>
                      <span className="text-[11px] font-semibold text-center leading-tight">{o.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {AVATAR_BODY_OPTIONS.find((o) => o.id === mannequin.body)?.desc}
                </p>
              </div>

              {/* Hair color */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Cabelo — cor</p>
                <div className="flex gap-3">
                  {AVATAR_HAIR_COLOR_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setMannequin((m) => ({ ...m, hair: o.id }))}
                      title={o.label}
                      className={clsx(
                        "relative w-9 h-9 rounded-full border-4 transition",
                        mannequin.hair === o.id ? "border-brand-500 scale-110 shadow-md" : "border-transparent hover:border-gray-300"
                      )}
                      style={{ background: o.hex }}
                    >
                      {mannequin.hair === o.id && (
                        <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair type */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Cabelo — tipo</p>
                <div className="flex gap-2">
                  {AVATAR_HAIR_TYPE_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setMannequin((m) => ({ ...m, hairType: o.id }))}
                      className={clsx(
                        "flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition",
                        mannequin.hairType === o.id
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600 hover:border-brand-200"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {mannequinPreview && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 italic leading-relaxed">
                  <span className="font-semibold not-italic text-gray-700">Preview para IA: </span>
                  {mannequinPreview}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setMode("idle")} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  {saved ? "Salvo!" : "Salvar manequim"}
                </button>
              </div>
            </div>
          )}

          {/* Photo mode */}
          {mode === "photo" && (
            <div className="space-y-4">
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {photoBase64 ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={photoBase64} alt="Sua foto" className="w-32 h-32 rounded-2xl object-cover shadow border-2 border-brand-200" />
                  <button onClick={() => photoRef.current?.click()} className="text-sm text-brand-600 font-semibold underline">Trocar foto</button>
                </div>
              ) : (
                <button
                  onClick={() => photoRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-600">Enviar foto de referência</p>
                  <p className="text-xs text-gray-400">A IA vestirá as peças nessa foto</p>
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => setMode("idle")} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={save} disabled={saving || !photoBase64} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  {saved ? "Salvo!" : "Salvar foto"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main profile page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/security/2fa")
      .then((res) => res.json())
      .then((data) => setTwoFactorEnabled(Boolean(data.enabled)))
      .catch(() => setError("Erro ao carregar seguranca da conta"));
  }, []);

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/user/account");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "looksy-meus-dados.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erro ao exportar dados");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleStartTwoFactor() {
    setSecurityLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/user/security/2fa", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao iniciar 2FA");
      setTwoFactorSecret(data.secret);
      setMessage("Chave gerada. Cadastre no seu app autenticador e confirme o codigo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar 2FA");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function handleConfirmTwoFactor() {
    setSecurityLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/user/security/2fa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Codigo invalido");
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorCode("");
      setMessage("2FA ativado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar 2FA");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function handleDisableTwoFactor() {
    setSecurityLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/user/security/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Codigo invalido");
      setTwoFactorEnabled(false);
      setDisableCode("");
      setMessage("2FA desativado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar 2FA");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir conta");
      await signOut({ callbackUrl: "/auth/login" });
    } catch {
      setError("Erro ao excluir conta. Tente novamente.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mb-4">
          <UserCircle className="w-8 h-8 text-brand-700" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-900">Meu Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">{session?.user?.email}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-3 py-2 rounded-xl mb-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {message}
        </div>
      )}

      {/* Avatar section — NEW */}
      <AvatarSection />

      <div className="card p-6 mb-4">
        <h2 className="font-bold text-gray-800 mb-3">Informacoes da conta</h2>
        <div className="space-y-2 text-sm">
          {session?.user?.name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Nome</span>
              <span className="font-medium text-gray-700">{session.user.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-700">{session?.user?.email}</span>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-brand-600" />
          <h2 className="font-bold text-gray-800">Autenticacao em dois fatores</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Use Google Authenticator, Microsoft Authenticator, Authy ou 1Password para gerar codigos de 6 digitos.
        </p>
        {!twoFactorEnabled ? (
          <div className="space-y-3">
            {!twoFactorSecret ? (
              <button onClick={handleStartTwoFactor} disabled={securityLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {securityLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Ativar app autenticador
              </button>
            ) : (
              <>
                <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">Chave manual</p>
                  <p className="break-all font-mono text-sm text-brand-950">{twoFactorSecret}</p>
                </div>
                <input
                  type="text" inputMode="numeric" value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition"
                  placeholder="Codigo de 6 digitos"
                />
                <button onClick={handleConfirmTwoFactor} disabled={securityLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {securityLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar e ativar 2FA
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="w-4 h-4" /> 2FA ativo nesta conta
            </div>
            <input
              type="text" inputMode="numeric" value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition"
              placeholder="Codigo atual para desativar"
            />
            <button onClick={handleDisableTwoFactor} disabled={securityLoading} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition">
              Desativar 2FA
            </button>
          </div>
        )}
      </div>

      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
          <h2 className="font-bold text-gray-800">Privacidade e LGPD</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600 mb-5">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Seu email e nome sao armazenados criptografados com AES-256-GCM</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Seus dados nunca sao compartilhados com terceiros</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Voce pode exportar ou excluir seus dados a qualquer momento</span>
          </div>
        </div>
        <button onClick={handleExport} disabled={exportLoading} className="w-full flex items-center justify-center gap-2 btn-secondary text-sm py-2.5 mb-3">
          {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exportLoading ? "Exportando..." : "Exportar meus dados (JSON)"}
        </button>
      </div>

      <div className="card p-6 border-red-100">
        <h2 className="font-bold text-red-700 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Excluir conta
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Apaga permanentemente sua conta, armario, looks e notas de estilo. Esta acao nao pode ser desfeita.
        </p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition">
            Solicitar exclusao de conta
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-red-700 text-center">Tem certeza? Esta acao e irreversivel.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 text-sm py-2.5">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
