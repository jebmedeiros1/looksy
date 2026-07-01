import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GarmentItem } from "@/lib/types";
import { searchKnowledge } from "@/lib/rag";
import { auth } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { garments, eventContext, moods }: {
      garments: GarmentItem[];
      eventContext: string;
      moods: string[];
    } = await req.json();

    if (!garments?.length) return NextResponse.json({ error: "Armário vazio" }, { status: 400 });

    const wardrobeList = garments
      .map(
        (g, i) =>
          `[${i}] id:${g.id} | tipo:${g.type} | cor:${g.color}(${g.colorHex}) | estilo:${g.style.join(",")} | ocasiões:${g.occasions.join(",")}`
      )
      .join("\n");

    const query = [eventContext, ...moods].filter(Boolean).join(" ");
    const knowledgeChunks = await searchKnowledge(session.user.id, query, 3);
    const knowledgeBlock =
      knowledgeChunks.length > 0
        ? `\nCONHECIMENTO PESSOAL DE ESTILO DA USUÁRIA:\n${knowledgeChunks.join("\n\n")}\n\nUse esse contexto para personalizar os looks: respeite as preferências de cores, silhuetas, ocasiões e restrições descritas acima.\n`
        : "";

    const prompt = `Você é uma consultora de estilo com formação em Psicologia da Moda e Subjetividade (método Maria Klien — R.A.I.Z. e S.E.R.V.I.R.). Seu olhar vai além da estética: você lê cada look como expressão simbólica, emocional e arquetípica. O vestir é linguagem do inconsciente, regulação do sistema nervoso e afirmação de identidade.

Crie 3 looks distintos usando as peças abaixo. Para cada look considere:
- A energia arquetípica que a combinação evoca (ex: Governante, Criadora, Cuidadora, Rebelde, Exploradora)
- Como cor, textura e forma funcionam como reguladores neuroafetivos para o estado emocional desejado
- O que o look sustenta, protege ou revela — o corpo como território emocional

EVENTO: ${eventContext || "casual"}
MOOD DESEJADO: ${moods.join(", ") || "versátil"}
${knowledgeBlock}
PEÇAS DISPONÍVEIS:
${wardrobeList}

REGRAS:
- Cada look deve ter pelo menos 2 peças (superior + inferior, ou vestido + acessório)
- Os 3 looks devem ser distintos entre si — cada um com uma energia emocional diferente
- Não combine peças incompatíveis (ex: vestido + saia, vestido longo + tênis esportivo)
- Use os índices das peças para referenciá-las
- Priorize harmonia de cores e adequação ao evento
- Se houver conhecimento pessoal de estilo disponível, priorize as preferências da usuária

Retorne SOMENTE um JSON válido (sem markdown) com esta estrutura:
{
  "looks": [
    {
      "name": "nome criativo em português",
      "garmentIndices": [0, 2, 5],
      "moodTags": ["Empoderada", "Sofisticada"],
      "explanation": "2-3 frases: descreva a combinação, a energia emocional ou arquetípica que transmite e por que serve ao mood desejado. Tom caloroso e consciente, em português."
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content?.trim() ?? "";
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const data = JSON.parse(clean);

    const looks = data.looks.map(
      (
        l: { name: string; garmentIndices: number[]; moodTags: string[]; explanation: string },
        i: number
      ) => ({
        id: `look-${Date.now()}-${i}`,
        name: l.name,
        garments: (l.garmentIndices || []).map((idx: number) => garments[idx]).filter(Boolean),
        moodTags: l.moodTags,
        explanation: l.explanation,
        eventContext,
        saved: false,
        createdAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({ looks });
  } catch (err: unknown) {
    console.error("generate-look error", err);
    return NextResponse.json({ error: "Erro ao gerar looks" }, { status: 500 });
  }
}
