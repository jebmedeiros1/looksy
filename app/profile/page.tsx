"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCircle,
  KeyRound,
} from "lucide-react";

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
              <button
                onClick={handleStartTwoFactor}
                disabled={securityLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {securityLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Ativar app autenticador
              </button>
            ) : (
              <>
                <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">
                    Chave manual
                  </p>
                  <p className="break-all font-mono text-sm text-brand-950">{twoFactorSecret}</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition"
                  placeholder="Codigo de 6 digitos"
                />
                <button
                  onClick={handleConfirmTwoFactor}
                  disabled={securityLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {securityLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar e ativar 2FA
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              2FA ativo nesta conta
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition"
              placeholder="Codigo atual para desativar"
            />
            <button
              onClick={handleDisableTwoFactor}
              disabled={securityLoading}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition"
            >
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

        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="w-full flex items-center justify-center gap-2 btn-secondary text-sm py-2.5 mb-3"
        >
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
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            Solicitar exclusao de conta
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-red-700 text-center">Tem certeza? Esta acao e irreversivel.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 text-sm py-2.5">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
              >
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
