import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 });

    // ~8 MB limit: base64 overhead is ~4/3, so 8 MB binary ≈ 10.9 MB base64 chars
    const MAX_BASE64_CHARS = 11 * 1024 * 1024;
    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ error: "Imagem muito grande (máximo 8 MB)" }, { status: 413 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `Você é especialista em moda. Analise a imagem e identifique TODAS as peças de roupa/acessórios visíveis.

Retorne SOMENTE um JSON válido (sem markdown, sem \`\`\`):
{
  "items": [
    {
      "type": "camiseta|blusa|camisa|vestido|saia|calca|shorts|bermuda|jaqueta|blazer|casaco|macacao|top|body|cardigan|regata|sapato|tenis|sandalia|bota|chinelo|bolsa|cinto|chapeu|oculos|colar|brinco|anel|pulseira|acessorio|outro",
      "color": "nome da cor em português",
      "colorHex": "#RRGGBB",
      "length": "comprimento (null se não aplicável)",
      "fit": "modelagem (null se não aplicável)",
      "style": ["casual"|"formal"|"esportivo"|"festa"|"boho"|"streetwear"|"classico"|"romantico"],
      "occasions": ["trabalho"|"lazer"|"encontro"|"festa"|"cerimonia"|"praia"|"treino"|"casual"],
      "season": "verao|inverno|meia-estacao|todas",
      "material": "algodao|seda|linho|jeans|couro|tricot|sintetico|misto|desconhecido",
      "confidence": 0.0-1.0
    }
  ]
}

Comprimento (length) por tipo:
- calca: curta|capri|7/8|longa
- shorts: micro|curto|médio  bermuda: curto|médio
- saia: micro|curta|midi|longa
- vestido|macacao: micro|curto|midi|longo
- blusa|camiseta|camisa|regata: cropped|curta|regular|longa
- top: cropped|curto
- jaqueta|casaco|cardigan: curta|regular|longa  blazer: curto|regular
- calçados|bolsa|acessórios: null

Modelagem (fit) por tipo:
- calca: slim|confort|baggy|flare|wide leg
- shorts|bermuda: slim|confort|baggy
- saia: justa|evasê|rodada
- vestido: justo|reto|evasê|rodado
- macacao: justo|reto|largo
- blusa|camiseta|camisa|top|regata|body: justa|regular|oversize
- jaqueta|blazer: slim|regular|oversized
- casaco|cardigan: regular|oversized
- calçados|bolsa|acessórios: null`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identifique todas as peças nesta imagem." },
            { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
          ],
        },
      ],
    });

    const text = response.choices[0].message.content?.trim() ?? "";
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const data = JSON.parse(clean);

    // normalize: ensure items array
    if (!data.items) {
      data.items = [data];
    }

    // strip null length/fit
    data.items = data.items.map((item: Record<string, unknown>) => ({
      ...item,
      length: item.length ?? undefined,
      fit: item.fit ?? undefined,
    }));

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("classify error", err);
    return NextResponse.json({ error: "Erro ao classificar imagem" }, { status: 500 });
  }
}
