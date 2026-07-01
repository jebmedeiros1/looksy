import OpenAI from "openai";
import { prisma } from "./db";

let openai: OpenAI;
function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

interface Chunk {
  file: string;
  heading: string;
  content: string;
  embedding: number[];
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function chunkNote(filename: string, raw: string): Omit<Chunk, "embedding">[] {
  const MAX = 1200;
  const title = filename.replace(/\.md$/, "");

  if (raw.length <= MAX) {
    return [{ file: filename, heading: title, content: raw.trim() }];
  }

  const sections = raw.split(/\n(?=## )/);
  return sections
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .map((s) => {
      const firstLine = s.split("\n")[0].replace(/^#+\s*/, "");
      return { file: filename, heading: firstLine || title, content: s };
    });
}

export async function buildIndex(userId: string): Promise<{ files: number; chunks: number }> {
  const files = await prisma.knowledgeFile.findMany({ where: { userId } });
  if (!files.length) return { files: 0, chunks: 0 };

  const rawChunks: Omit<Chunk, "embedding">[] = [];
  for (const file of files) {
    rawChunks.push(...chunkNote(file.filename, file.content));
  }

  const texts = rawChunks.map((c) => c.content.slice(0, 8000));
  const embRes = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  const index: Chunk[] = rawChunks.map((c, i) => ({
    ...c,
    embedding: embRes.data[i].embedding,
  }));

  await prisma.knowledgeIndex.upsert({
    where: { userId },
    create: { userId, indexJson: JSON.stringify(index) },
    update: { indexJson: JSON.stringify(index) },
  });

  return { files: files.length, chunks: index.length };
}

export async function searchKnowledge(
  userId: string,
  query: string,
  topK = 3
): Promise<string[]> {
  const record = await prisma.knowledgeIndex.findUnique({ where: { userId } });
  if (!record) return [];

  const index: Chunk[] = JSON.parse(record.indexJson);
  if (!index.length) return [];

  const embRes = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: [query],
  });
  const qVec = embRes.data[0].embedding;

  const scored = index
    .map((c) => ({ content: c.content, heading: c.heading, score: cosineSim(qVec, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((s) => `### ${s.heading}\n${s.content}`);
}

export async function indexStatus(userId: string): Promise<{ exists: boolean; chunks: number }> {
  const record = await prisma.knowledgeIndex.findUnique({ where: { userId } });
  if (!record) return { exists: false, chunks: 0 };
  try {
    const index: Chunk[] = JSON.parse(record.indexJson);
    return { exists: true, chunks: index.length };
  } catch {
    return { exists: false, chunks: 0 };
  }
}
