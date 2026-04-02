// WhatsApp message parsing utility

export type CategoryType = "produktivitas" | "kesehatan" | "olahraga" | "belajar";

const CATEGORY_MAP: Record<string, CategoryType> = {
  "#produktivitas": "produktivitas",
  "#produktif": "produktivitas",
  "#kerja": "produktivitas",
  "#kesehatan": "kesehatan",
  "#sehat": "kesehatan",
  "#olahraga": "olahraga",
  "#gym": "olahraga",
  "#lari": "olahraga",
  "#belajar": "belajar",
  "#study": "belajar",
  "#baca": "belajar",
};

export interface ParsedMessage {
  description: string;
  category: CategoryType;
}

export function parseWhatsAppMessage(message: string): ParsedMessage | null {
  const hashtagMatch = message.match(/#\w+/);
  if (!hashtagMatch) {
    return null;
  }

  const hashtag = hashtagMatch[0].toLowerCase();
  const category = CATEGORY_MAP[hashtag];

  if (!category) {
    return null;
  }

  const description = message.replace(/#\w+/g, "").trim();

  return {
    description: description || message.trim(),
    category,
  };
}

export function getCategoryEmoji(category: CategoryType): string {
  const emojis: Record<CategoryType, string> = {
    produktivitas: "💼",
    kesehatan: "❤️",
    olahraga: "🏃",
    belajar: "📚",
  };
  return emojis[category];
}

export function getCategoryLabel(category: CategoryType): string {
  const labels: Record<CategoryType, string> = {
    produktivitas: "Produktivitas",
    kesehatan: "Kesehatan",
    olahraga: "Olahraga",
    belajar: "Belajar",
  };
  return labels[category];
}

export function getCategoryColor(category: CategoryType): string {
  const colors: Record<CategoryType, string> = {
    produktivitas: "hsl(262, 83%, 58%)",  // purple
    kesehatan: "hsl(0, 84%, 60%)",         // red
    olahraga: "hsl(142, 71%, 45%)",        // green
    belajar: "hsl(217, 91%, 60%)",         // blue
  };
  return colors[category];
}
