import { lfpModal } from "../components/lfpModal.js";
import { buildLfpMessage } from "../utils/lfpTemplates.js";

export async function handleInteraction(interaction) {

  // 🌍 nyelv kiválasztva → modal jön
  if (interaction.isStringSelectMenu() && interaction.customId === "lfp_language") {
    await interaction.showModal(lfpModal(interaction.values[0]));
    return;
  }

  // 📩 modal elküldve → végső LFP poszt
  if (interaction.isModalSubmit() && interaction.customId.startsWith("lfp_modal_")) {
    const lang = interaction.customId.split("_")[2];

    const data = {
      room: interaction.fields.getTextInputValue("room"),
      players: interaction.fields.getTextInputValue("players"),
      elo: interaction.fields.getTextInputValue("elo"),
      role: interaction.fields.getTextInputValue("role")
    };

    // töröljük az előző menüs üzenetet
    await interaction.message?.delete().catch(() => {});

    const text = buildLfpMessage(lang, data, interaction.user);

    await interaction.channel.send(text);
    await interaction.reply({ content: "✅ LFP kiküldve", ephemeral: true });
  }
}
