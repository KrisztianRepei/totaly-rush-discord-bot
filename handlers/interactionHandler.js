import { lfpModal } from "../components/lfpModal.js";
import { buildLfpMessage } from "../utils/lfpTemplates.js";
import { lfpMessageCache } from "./messageHandler.js";

export async function handleInteraction(interaction) {

  // 🌍 nyelv kiválasztása → modal
  if (interaction.isStringSelectMenu() && interaction.customId === "lfp_language") {
    await interaction.showModal(lfpModal(interaction.values[0]));
    return;
  }

  // 📩 modal elküldve
  if (interaction.isModalSubmit() && interaction.customId.startsWith("lfp_modal_")) {
    const lang = interaction.customId.split("_")[2];

    const data = {
      room: interaction.fields.getTextInputValue("room"),
      players: interaction.fields.getTextInputValue("players"),
      elo: interaction.fields.getTextInputValue("elo"),
      role: interaction.fields.getTextInputValue("role")
    };

    // ❌ 1. töröljük az EREDETI "lfp" user üzenetet
    const originalMessage = lfpMessageCache.get(interaction.user.id);
    if (originalMessage) {
      await originalMessage.delete().catch(() => {});
      lfpMessageCache.delete(interaction.user.id);
    }

    // ❌ 2. töröljük a nyelvválasztós bot üzenetet
    await interaction.message?.delete().catch(() => {});

    // ✅ végleges LFP poszt
    const text = buildLfpMessage(lang, data, interaction.user);
    await interaction.channel.send(text);

    // 🔕 csak a user látja
    await interaction.reply({
      content: "✅ LFP kiküldve",
      ephemeral: true
    });
  }
}
