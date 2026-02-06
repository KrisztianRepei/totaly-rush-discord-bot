import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";

const ALLOWED_CHANNELS = [
  "1467188892863168716",
  "1467199549247328448"
];

export async function handleMessage(message) {
  if (message.author.bot) return;
  if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;
  if (message.content.toLowerCase() !== "lfp") return;

  await message.reply({
    content: "🌍 Válaszd ki a nyelvet / Choose language",
    components: [lfpLanguageMenu]
  });
}

