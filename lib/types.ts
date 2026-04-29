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
  createdAt: string;
}

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
