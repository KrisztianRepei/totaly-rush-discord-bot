import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";

// 🔐 cache az eredeti lfp üzenetekhez
export const lfpMessageCache = new Map();

const ALLOWED_CHANNELS = [
  "1467188892863168716",
  "1467199549247328448"
];

export async function handleMessage(message) {
  if (message.author.bot) return;
  if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;
  if (message.content.toLowerCase() !== "lfp") return;

  // ✅ eltároljuk az EREDETI user üzenetet
  lfpMessageCache.set(message.author.id, message);

  await message.reply({
    content: "🌍 Válaszd ki a nyelvet / Choose language",
    components: [lfpLanguageMenu]
  });
}
