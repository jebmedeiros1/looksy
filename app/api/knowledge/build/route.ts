import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildIndex } from "@/lib/rag";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const result = await buildIndex(session.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error("knowledge build error", err);
    const msg = err instanceof Error ? err.message : "Erro ao indexar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
