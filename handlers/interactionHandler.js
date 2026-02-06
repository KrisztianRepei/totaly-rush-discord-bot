import { buildInstantLfpMessage } from "../utils/lfpTemplates.js";

export async function handleInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "lfp_language") return;

  const lang = interaction.values[0];

  // 🔥 töröljük a nyelvválasztó menüt
  await interaction.message.delete();

  // 🧠 elkészítjük az LFP szöveget
  const text = buildInstantLfpMessage(
    lang,
    interaction.user
  );

  // 📢 kiküldjük a végleges üzenetet
  await interaction.channel.send(text);
}
