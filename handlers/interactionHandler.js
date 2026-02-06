import { lfpModal } from "../components/lfpModal.js";
import { buildLfpMessage } from "../utils/lfpTemplates.js";

export async function handleInteraction(interaction) {
  if (interaction.isStringSelectMenu() && interaction.customId === "lfp_language") {
    await interaction.showModal(lfpModal(interaction.values[0]));
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("lfp_modal_")) {
    const lang = interaction.customId.split("_")[2];

    const data = {
      room: interaction.fields.getTextInputValue("room"),
      players: interaction.fields.getTextInputValue("players"),
      rank: interaction.fields.getTextInputValue("rank"),
      roles: interaction.fields.getTextInputValue("roles")
    };

    const message = buildLfpMessage(lang, data);

    await interaction.channel.send(message);
    await interaction.reply({ content: "Kész ✅", ephemeral: true });
  }
}

