import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { indexStatus } from "@/lib/rag";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return NextResponse.json(await indexStatus(session.user.id));
}
