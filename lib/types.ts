export interface GarmentItem {
  id: string;
  imageUrl: string;
  type: string;
  color: string;
  colorHex: string;
  style: string[];
  occasions: string[];
  season: string;
  material?: string;
  confidence?: number;
  length?: string;
  fit?: string;
  createdAt: string;
}

export interface Look {
  id: string;
  name: string;
  garments: GarmentItem[];
  moodTags: string[];
  explanation: string;
  eventContext: string;
  saved: boolean;
  feeling?: string;
  feelingEmoji?: string;
  wornAt?: string;
  createdAt: string;
}

export interface WardrobeStore {
  id: string;
  userId: string;
  ownerName: string;
  name: string;
  description: string;
  tags: string[];
  garments: GarmentItem[];
  views: number;
  clones: number;
  createdAt: string;
}

export const FEELING_OPTIONS = [
  { emoji: "✨", label: "Radiante", value: "radiante" },
  { emoji: "💪", label: "Poderosa", value: "poderosa" },
  { emoji: "🌸", label: "Feminina", value: "feminina" },
  { emoji: "🔥", label: "Ousada", value: "ousada" },
  { emoji: "🧡", label: "Acolhida", value: "acolhida" },
  { emoji: "😌", label: "Confortável", value: "confortavel" },
  { emoji: "🎨", label: "Criativa", value: "criativa" },
  { emoji: "💎", label: "Elegante", value: "elegante" },
  { emoji: "🌿", label: "Natural", value: "natural" },
  { emoji: "⚡", label: "Energizada", value: "energizada" },
] as const;

// ── Avatar types ──────────────────────────────────────────────────────────────

export const AVATAR_HEIGHT_OPTIONS = [
  { id: "petite", label: "Petite", desc: "até 1.60m", prompt: "petite woman, about 1.55m tall" },
  { id: "media",  label: "Média",  desc: "1.61 – 1.70m", prompt: "woman of average height, about 1.65m tall" },
  { id: "alta",   label: "Alta",   desc: "acima de 1.70m", prompt: "tall woman, about 1.75m tall" },
] as const;

export const AVATAR_SKIN_OPTIONS = [
  { id: "clara",        label: "Clara",        hex: "#F5CBA7", prompt: "fair skin" },
  { id: "morena-clara", label: "Morena Clara", hex: "#D4956A", prompt: "light tan skin" },
  { id: "morena",       label: "Morena",       hex: "#A0715A", prompt: "medium brown skin" },
  { id: "negra",        label: "Negra",        hex: "#5C3317", prompt: "deep brown skin" },
] as const;

export const AVATAR_BODY_OPTIONS = [
  { id: "ampulheta",           label: "Ampulheta",          icon: "⧖", desc: "Ombros e quadris proporcionais, cintura definida", prompt: "hourglass figure" },
  { id: "triangulo",           label: "Triângulo",          icon: "▽", desc: "Quadris mais largos que ombros",                  prompt: "pear-shaped figure" },
  { id: "triangulo-invertido", label: "Triângulo Invertido", icon: "△", desc: "Ombros mais largos que quadris",                  prompt: "inverted triangle figure" },
  { id: "retangular",          label: "Retangular",         icon: "▭", desc: "Ombros, cintura e quadris em linha",              prompt: "rectangular figure" },
  { id: "oval",                label: "Oval",               icon: "⬭", desc: "Torso mais arredondado",                         prompt: "oval apple-shaped figure" },
] as const;

export const AVATAR_HAIR_COLOR_OPTIONS = [
  { id: "loiro",    label: "Loiro",    hex: "#F5D76E", prompt: "blonde hair" },
  { id: "castanho", label: "Castanho", hex: "#7B4F2E", prompt: "brunette hair" },
  { id: "preto",    label: "Preto",    hex: "#1A1A1A", prompt: "black hair" },
  { id: "ruivo",    label: "Ruivo",    hex: "#C0392B", prompt: "red hair" },
  { id: "grisalho", label: "Grisalho", hex: "#BDC3C7", prompt: "silver gray hair" },
] as const;

export const AVATAR_HAIR_TYPE_OPTIONS = [
  { id: "liso",     label: "Liso",     prompt: "straight" },
  { id: "ondulado", label: "Ondulado", prompt: "wavy" },
  { id: "cacheado", label: "Cacheado", prompt: "curly" },
  { id: "crespo",   label: "Crespo",   prompt: "coily" },
] as const;

export type AvatarHeightId   = typeof AVATAR_HEIGHT_OPTIONS[number]["id"];
export type AvatarSkinId     = typeof AVATAR_SKIN_OPTIONS[number]["id"];
export type AvatarBodyId     = typeof AVATAR_BODY_OPTIONS[number]["id"];
export type AvatarHairColor  = typeof AVATAR_HAIR_COLOR_OPTIONS[number]["id"];
export type AvatarHairType   = typeof AVATAR_HAIR_TYPE_OPTIONS[number]["id"];

export interface MannequinConfig {
  height:   AvatarHeightId;
  skin:     AvatarSkinId;
  body:     AvatarBodyId;
  hair:     AvatarHairColor;
  hairType: AvatarHairType;
}

export type AvatarConfig =
  | { type: "mannequin"; mannequin: MannequinConfig }
  | { type: "photo";     photoBase64: string };

export function mannequinToPrompt(m: MannequinConfig): string {
  const height   = AVATAR_HEIGHT_OPTIONS.find((o) => o.id === m.height)?.prompt ?? "woman";
  const skin     = AVATAR_SKIN_OPTIONS.find((o) => o.id === m.skin)?.prompt ?? "medium skin";
  const body     = AVATAR_BODY_OPTIONS.find((o) => o.id === m.body)?.prompt ?? "average figure";
  const hairCol  = AVATAR_HAIR_COLOR_OPTIONS.find((o) => o.id === m.hair)?.prompt ?? "dark hair";
  const hairType = AVATAR_HAIR_TYPE_OPTIONS.find((o) => o.id === m.hairType)?.prompt ?? "straight";
  return `a ${height}, ${skin}, ${body}, with ${hairType} ${hairCol}`;
}

// ── Motivational messages ─────────────────────────────────────────────────────

export const MOTIVATIONAL_MESSAGES = [
  {
    message: "Vestir-se é um ato de amor próprio. Cada peça que você escolhe é um capítulo da sua história.",
    author: "Maria Klien",
    archetype: "S — Singularidade",
  },
  {
    message: "Sua roupa não fala sobre moda. Ela fala sobre quem você é e quem quer ser neste momento.",
    author: "Looksy",
    archetype: "E — Expressão",
  },
  {
    message: "Não existe look errado quando a escolha nasce de dentro para fora.",
    author: "Maria Klien",
    archetype: "R — Raiz",
  },
  {
    message: "O guarda-roupa ideal é aquele que te recebe bem todas as manhãs e te manda ao mundo com confiança.",
    author: "Looksy",
    archetype: "V — Vitalidade",
  },
  {
    message: "Você não precisa de mais roupas. Você precisa entender as que já tem.",
    author: "Maria Klien",
    archetype: "I — Identidade",
  },
  {
    message: "Cor não é detalhe. Cor é linguagem. E você merece falar com clareza.",
    author: "Looksy",
    archetype: "R — Ressonância",
  },
  {
    message: "A mulher que conhece seu estilo não segue tendências — ela as define.",
    author: "Maria Klien",
    archetype: "A — Autenticidade",
  },
  {
    message: "Cada manhã é um convite: que versão de você quer se mostrar hoje?",
    author: "Looksy",
    archetype: "I — Intenção",
  },
  {
    message: "Seu corpo é lar, não tela. Vista-o com gratidão e intenção.",
    author: "Maria Klien",
    archetype: "Z — Zelo",
  },
  {
    message: "Simplicidade não é ausência — é a arte de saber o que é essencial.",
    author: "Looksy",
    archetype: "S — Síntese",
  },
  {
    message: "O que você veste ao entrar em um lugar já contou uma história antes de você abrir a boca.",
    author: "Maria Klien",
    archetype: "E — Essência",
  },
  {
    message: "Cuide do seu guarda-roupa como você cuida das suas ideias: com critério e carinho.",
    author: "Looksy",
    archetype: "R — Refino",
  },
] as const;

export const MOODS = [
  { id: "empoderada", label: "Empoderada", emoji: "💪", color: "bg-red-100 text-red-700 border-red-300" },
  { id: "alegre", label: "Alegre", emoji: "☀️", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { id: "sofisticada", label: "Sofisticada", emoji: "✨", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "confortavel", label: "Acolhida", emoji: "🧡", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "ousada", label: "Ousada", emoji: "🔥", color: "bg-rose-100 text-rose-700 border-rose-300" },
  { id: "romantica", label: "Romântica", emoji: "🌸", color: "bg-pink-100 text-pink-700 border-pink-300" },
  { id: "minimalista", label: "Essencial", emoji: "◾", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { id: "criativa", label: "Criadora", emoji: "🎨", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
] as const;

export const EVENT_CHIPS = [
  "Reunião de trabalho", "Almoço casual", "Jantar especial",
  "Encontro romântico", "Festa", "Home office",
  "Viagem", "Academia", "Evento social", "Cerimônia",
];

export const GARMENT_CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "dress", label: "Vestidos" },
  { id: "outerwear", label: "Sobre-peças" },
  { id: "shoes", label: "Calçados" },
  { id: "accessory", label: "Acessórios" },
];

export const CLOTHING_TYPES = [
  "camiseta", "blusa", "camisa", "vestido", "saia", "calca", "shorts",
  "bermuda", "jaqueta", "blazer", "casaco", "macacao", "top", "body",
  "cardigan", "regata", "sapato", "tenis", "sandalia", "bota", "chinelo",
  "bolsa", "cinto", "chapeu", "oculos", "colar", "brinco", "anel",
  "pulseira", "acessorio", "outro",
] as const;

export const FIT_OPTIONS: Record<string, string[]> = {
  calca:    ["slim", "confort", "baggy", "flare", "wide leg"],
  shorts:   ["slim", "confort", "baggy"],
  bermuda:  ["slim", "confort", "baggy"],
  saia:     ["justa", "evasê", "rodada"],
  vestido:  ["justo", "reto", "evasê", "rodado"],
  macacao:  ["justo", "reto", "largo"],
  blusa:    ["justa", "regular", "oversize"],
  camiseta: ["justa", "regular", "oversize"],
  camisa:   ["slim", "regular", "oversize"],
  top:      ["justa", "regular", "oversize"],
  body:     ["justa", "regular"],
  regata:   ["justa", "regular", "oversize"],
  jaqueta:  ["slim", "regular", "oversized"],
  blazer:   ["slim", "regular", "oversized"],
  casaco:   ["regular", "oversize"],
  cardigan: ["regular", "oversized"],
};

export const LENGTH_OPTIONS: Record<string, string[]> = {
  calca:    ["curta", "capri", "7/8", "longa"],
  shorts:   ["micro", "curto", "médio"],
  bermuda:  ["curto", "médio"],
  saia:     ["micro", "curta", "midi", "longa"],
  vestido:  ["micro", "curto", "midi", "longo"],
  macacao:  ["curto", "midi", "longo"],
  blusa:    ["cropped", "curta", "regular", "longa"],
  camiseta: ["cropped", "curta", "regular"],
  camisa:   ["cropped", "curta", "regular"],
  top:      ["cropped", "curto"],
  regata:   ["cropped", "curta", "regular"],
  jaqueta:  ["curta", "regular", "longa"],
  blazer:   ["curto", "regular"],
  casaco:   ["curto", "regular", "longo"],
  cardigan: ["curto", "regular", "longo"],
};

export const STYLE_OPTIONS = ["casual", "formal", "esportivo", "festa", "boho", "streetwear", "classico", "romantico"];
export const OCCASION_OPTIONS = ["trabalho", "lazer", "encontro", "festa", "cerimonia", "praia", "treino", "casual"];
export const MATERIAL_OPTIONS = ["algodao", "seda", "linho", "jeans", "couro", "tricot", "sintetico", "misto", "desconhecido"];
