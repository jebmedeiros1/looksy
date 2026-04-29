import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { encryptField, hashEmail } from "@/lib/crypto";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

const DEFAULT_KNOWLEDGE = [
  {
    filename: "estilo-pessoal.md",
    content: `# Estilo Pessoal\n\nDescreva aqui suas preferências de estilo, silhuetas favoritas, referências de moda e o que você evita usar.`,
  },
  {
    filename: "cores-e-paleta.md",
    content: `# Cores e Paleta\n\nDescreva aqui sua paleta de cores pessoal, combinações que você ama e regras de cor que segue.`,
  },
  {
    filename: "ocasioes-e-dress-code.md",
    content: `# Ocasiões e Dress Code\n\nDescreva aqui seu dress code por contexto: trabalho, lazer, eventos especiais, etc.`,
  },
];

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, consent } = await req.json();

    if (!email || !password || !consent) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter ao menos 8 caracteres" },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);
    const existing = await prisma.user.findUnique({ where: { emailHash } });
    if (existing && !existing.deletedAt) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        emailEncrypted: encryptField(email.toLowerCase().trim()),
        emailHash,
        passwordHash,
        nameEncrypted: name?.trim() ? encryptField(name.trim()) : null,
        consentAt: new Date(),
      },
    });

    // Seed knowledge files from filesystem or use defaults
    let filesToSeed = DEFAULT_KNOWLEDGE;
    if (fs.existsSync(KNOWLEDGE_DIR)) {
      const mdFiles = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
      if (mdFiles.length > 0) {
        filesToSeed = mdFiles.map((filename) => ({
          filename,
          content: fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), "utf-8"),
        }));
      }
    }

    for (const { filename, content } of filesToSeed) {
      await prisma.knowledgeFile.create({
        data: { userId: user.id, filename, content },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
