import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";

export async function handleMessage(message) {
  if (message.author.bot) return;
  if (message.content.toLowerCase() !== "lfp") return;

  await message.reply({
    content: "Válaszd ki a nyelvet / Choose language 👇",
    components: [lfpLanguageMenu],
    ephemeral: true
  });
}

