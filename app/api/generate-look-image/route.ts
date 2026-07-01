import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { GarmentItem, MannequinConfig, mannequinToPrompt } from "@/lib/types";
import { auth } from "@/lib/auth";

let openai: OpenAI;
function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

function extractBase64(dataUrlOrBase64: string): string {
  return dataUrlOrBase64.includes(",") ? dataUrlOrBase64.split(",")[1] : dataUrlOrBase64;
}

function extractMime(dataUrlOrBase64: string): string {
  const match = dataUrlOrBase64.match(/^data:([^;]+);base64,/);
  return match ? match[1] : "image/jpeg";
}

async function base64ToFile(dataUrlOrBase64: string, filename: string) {
  const buffer = Buffer.from(extractBase64(dataUrlOrBase64), "base64");
  const type = extractMime(dataUrlOrBase64);
  return toFile(buffer, filename, { type });
}

// Use GPT-4o-mini Vision to describe each garment in detail (length, cut, fit, pattern)
async function describeGarments(garments: GarmentItem[]): Promise<string[]> {
  return Promise.all(
    garments.map(async (g) => {
      try {
        const res = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 80,
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this clothing item for a fashion illustration prompt in English. Focus on: exact length (mini/midi/maxi/cropped/knee-length/ankle-length/floor-length), silhouette, cut, fit (loose/fitted/oversized), visible patterns or texture. One concise sentence only.",
              },
              { type: "image_url", image_url: { url: g.imageUrl } },
            ],
          }],
        });
        return res.choices[0].message.content?.trim() ?? `${g.color} ${g.type}`;
      } catch {
        return `${g.color} ${g.type}${g.material ? ` in ${g.material}` : ""}`;
      }
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { look, userPhotoBase64, mannequinConfig, modelChoice = "dalle3" }: {
      look: { name: string; garments: GarmentItem[]; moodTags: string[]; eventContext: string };
      userPhotoBase64?: string;
      mannequinConfig?: MannequinConfig;
      modelChoice?: "dalle3" | "gpt-image-1";
    } = await req.json();

    if (!look?.garments?.length) {
      return NextResponse.json({ error: "Dados do look inválidos" }, { status: 400 });
    }

    const MAX_BASE64_CHARS = 11 * 1024 * 1024;
    if (userPhotoBase64 && userPhotoBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ error: "Foto muito grande (máximo 8 MB)" }, { status: 413 });
    }

    const mood = look.moodTags.join(", ") || "elegant";
    const event = look.eventContext || "casual occasion";

    // --- GPT-IMAGE-1 path: pass actual garment images as reference ---
    if (modelChoice === "gpt-image-1") {
      try {
        const garmentFiles = await Promise.all(
          look.garments.map((g, i) => base64ToFile(g.imageUrl, `garment-${i}.png`))
        );

        const images = userPhotoBase64
          ? [await base64ToFile(userPhotoBase64, "person.png"), ...garmentFiles]
          : garmentFiles;

        const garmentList = look.garments
          .map(g => `${g.color} ${g.type}${g.material ? ` (${g.material})` : ""}`)
          .join(", ");

        const mannequinDesc = mannequinConfig
          ? mannequinToPrompt(mannequinConfig)
          : "a neutral fashion figure";

        const prompt = userPhotoBase64
          ? `Dress the person from the first reference image wearing EXACTLY the garments shown in the other reference images (${garmentList}). Preserve the precise length, cut, and texture of each clothing piece. Full body shot, ${mood} mood, styled for ${event}. Professional fashion photography, clean studio background.`
          : `Create a full body fashion editorial image of ${mannequinDesc} wearing EXACTLY these garments as shown in the reference images (${garmentList}). Faithfully reproduce each item's length, silhouette, color, and texture. ${mood} mood, styled for ${event}. Clean white studio background, professional lighting.`;

        const imageResponse = await getOpenAI().images.edit({
          model: "gpt-image-1",
          image: images,
          prompt,
          // @ts-expect-error input_fidelity not yet in SDK types
          input_fidelity: "high",
          quality: "high",
          size: "1024x1024",
          n: 1,
        });

        const b64 = imageResponse.data?.[0]?.b64_json;
        if (!b64) throw new Error("Imagem não gerada");
        return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
      } catch (gptErr) {
        console.warn("gpt-image-1 falhou, usando DALL-E 3:", gptErr instanceof Error ? gptErr.message : gptErr);
        // fall through to DALL-E 3
      }
    }

    // --- DALL-E 3 path: vision step for detailed garment descriptions ---
    const garmentDescriptions = await describeGarments(look.garments);
    const outfitDetail = garmentDescriptions.join("; ");

    let dallePrompt: string;

    const mannequinDesc = mannequinConfig ? mannequinToPrompt(mannequinConfig) : null;

    if (userPhotoBase64) {
      const visionResponse = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        max_tokens: 150,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this person's appearance in English for a fashion photo illustration: skin tone, hair color and style, body build. 1-2 sentences only. Do not mention clothing.",
            },
            { type: "image_url", image_url: { url: userPhotoBase64.startsWith("data:") ? userPhotoBase64 : `data:image/jpeg;base64,${userPhotoBase64}` } },
          ],
        }],
      });
      const personDescription = visionResponse.choices[0].message.content?.trim() ?? "a person";
      dallePrompt = `Full body fashion editorial photo of ${personDescription}. They are wearing exactly: ${outfitDetail}. The outfit is styled for ${event} with a ${mood} mood. Reproduce each garment faithfully — respect exact hemlines, proportions, cuts, and fabric textures. Clean studio background, soft professional lighting, fashion magazine quality.`;
    } else {
      dallePrompt = `Full body fashion editorial photograph of ${mannequinDesc ?? "a neutral store mannequin"} wearing exactly: ${outfitDetail}. The look is styled for ${event} with a ${mood} aesthetic. Reproduce each garment faithfully — exact hemlines, proportions, silhouette, and fabric textures. Clean white studio background, soft directional lighting, high detail on each clothing item.`;
    }

    const imageResponse = await getOpenAI().images.generate({
      model: "dall-e-3",
      prompt: dallePrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) throw new Error("Imagem não gerada");

    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    console.error("generate-look-image error", err);
    return NextResponse.json({ error: "Erro ao gerar imagem" }, { status: 500 });
  }
}
