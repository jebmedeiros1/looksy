"use client";
import { useState, useEffect } from "react";
import {
  Brain, RefreshCw, CheckCircle2, AlertCircle, Loader2,
  BookOpen, FileText, Save, ChevronDown, ChevronUp,
} from "lucide-react";
import clsx from "clsx";

interface KnowledgeFile {
  filename: string;
  content: string;
}

interface Status {
  exists: boolean;
  chunks: number;
}

export default function KnowledgePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<{ ok?: boolean; files?: number; chunks?: number; error?: string } | null>(null);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchStatus();
    fetchFiles();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/knowledge/status");
      if (res.ok) setStatus(await res.json());
      else setStatus({ exists: false, chunks: 0 });
    } catch {
      setStatus({ exists: false, chunks: 0 });
    }
  }

  async function fetchFiles() {
    try {
      const res = await fetch("/api/user/knowledge");
      if (res.ok) setFiles(await res.json());
    } catch { /* ignore */ }
  }

  async function handleBuild() {
    setBuilding(true);
    setBuildResult(null);
    try {
      const res = await fetch("/api/knowledge/build", { method: "POST" });
      const data = await res.json();
      setBuildResult(data);
      await fetchStatus();
    } catch {
      setBuildResult({ error: "Falha na conexão" });
    } finally {
      setBuilding(false);
    }
  }

  async function handleSave(filename: string) {
    const content = drafts[filename];
    if (content === undefined) return;
    setSaving(filename);
    try {
      const res = await fetch("/api/user/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content }),
      });
      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.filename === filename ? { ...f, content } : f))
        );
        setSaveResult((prev) => ({ ...prev, [filename]: true }));
        setTimeout(() => setSaveResult((prev) => ({ ...prev, [filename]: false })), 2000);
      }
    } finally {
      setSaving(null);
    }
  }

  function toggleEdit(filename: string) {
    if (editingFile === filename) {
      setEditingFile(null);
    } else {
      setEditingFile(filename);
      const file = files.find((f) => f.filename === filename);
      if (file && drafts[filename] === undefined) {
        setDrafts((prev) => ({ ...prev, [filename]: file.content }));
      }
    }
  }

  const FILE_LABELS: Record<string, string> = {
    "estilo-pessoal.md": "Estilo Pessoal",
    "cores-e-paleta.md": "Cores e Paleta",
    "ocasioes-e-dress-code.md": "Ocasiões e Dress Code",
    "cerebro1.md": "Psicologia da Moda — Base Teórica",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mb-4">
          <Brain className="w-8 h-8 text-brand-700" />
        </div>
        <h1 className="text-3xl font-extrabold text-brand-900 mb-2">Essência de Estilo</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Suas notas são a voz interna que guia cada composição. Edite e indexe para que a IA conheça a linguagem do seu ser.
        </p>
      </div>

      {/* Status + Index */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" /> Estado do conhecimento
          </h2>
          {status === null ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : status.exists ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Ativo — {status.chunks} fragmentos de memória
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              <AlertCircle className="w-4 h-4" /> Ainda não indexado
            </span>
          )}
        </div>

        <button
          onClick={handleBuild}
          disabled={building}
          className="btn-primary flex items-center gap-2 w-full justify-center"
        >
          {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {building ? "Ativando..." : "Ativar conhecimento"}
        </button>

        {buildResult && (
          <div
            className={clsx(
              "mt-4 p-3 rounded-xl text-sm font-medium",
              buildResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            )}
          >
            {buildResult.error
              ? `Erro: ${buildResult.error}`
              : `Conhecimento ativado — ${buildResult.files} arquivo(s), ${buildResult.chunks} fragmento(s).`}
          </div>
        )}
      </div>

      {/* File Editor */}
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="card p-6 text-center text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
            Carregando sua essência...
          </div>
        ) : (
          files.map((file) => {
            const isOpen = editingFile === file.filename;
            const label = FILE_LABELS[file.filename] ?? file.filename.replace(/\.md$/, "");
            const draft = drafts[file.filename] ?? file.content;
            const isDirty = drafts[file.filename] !== undefined && drafts[file.filename] !== file.content;

            return (
              <div key={file.filename} className="card overflow-hidden">
                <button
                  onClick={() => toggleEdit(file.filename)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{file.filename}</p>
                    </div>
                    {isDirty && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" title="Alterações não salvas" />
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <textarea
                      value={draft}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [file.filename]: e.target.value }))
                      }
                      rows={12}
                      className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm font-mono text-gray-800 focus:outline-none focus:border-brand-400 transition resize-y"
                      spellCheck={false}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">
                        Use <code className="bg-gray-100 px-1 rounded">## Seção</code> para dividir em fragmentos
                      </p>
                      <button
                        onClick={() => handleSave(file.filename)}
                        disabled={saving === file.filename || !isDirty}
                        className={clsx(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition",
                          saveResult[file.filename]
                            ? "bg-green-100 text-green-700"
                            : isDirty
                            ? "btn-primary"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {saving === file.filename ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saveResult[file.filename] ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {saveResult[file.filename] ? "Salvo!" : "Salvar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-center text-gray-400 mt-6">
        Após editar, <strong>ative o conhecimento</strong> para que a IA incorpore sua essência.
      </p>
    </div>
  );
}
