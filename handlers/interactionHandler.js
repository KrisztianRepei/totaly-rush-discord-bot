import { lfpModal } from "../components/lfpModal.js";
import { buildLfpMessage } from "../utils/lfpTemplates.js";
import { lfpMessageCache } from "./messageHandler.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";

export async function handleInteraction(interaction) {

  /* =======================
     LFP – NYELV
  ======================= */
  if (interaction.isStringSelectMenu() && interaction.customId === "lfp_language") {
    await interaction.showModal(lfpModal(interaction.values[0]));
    return;
  }

  /* =======================
     LFP – MODAL SUBMIT
  ======================= */
  if (interaction.isModalSubmit() && interaction.customId.startsWith("lfp_modal_")) {
    const lang = interaction.customId.split("_")[2];

    const data = {
      room: interaction.fields.getTextInputValue("room"),
      players: interaction.fields.getTextInputValue("players"),
      elo: interaction.fields.getTextInputValue("elo"),
      role: interaction.fields.getTextInputValue("role")
    };

    // ❌ eredeti "lfp" user üzenet törlése
    const originalMessage = lfpMessageCache.get(interaction.user.id);
    if (originalMessage) {
      await originalMessage.delete().catch(() => {});
      lfpMessageCache.delete(interaction.user.id);
    }

    // ❌ bot nyelvválasztó üzenet törlése
    await interaction.message?.delete().catch(() => {});

    // ✅ végleges LFP poszt
    const text = buildLfpMessage(lang, data, interaction.user);
    await interaction.channel.send(text);

    await interaction.reply({
      content: "✅ LFP kiküldve",
      ephemeral: true
    });
    return;
  }

  /* =======================
     🎟️ TICKET MENU
  ======================= */
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_menu"
  ) {
    const type = interaction.values[0];
    const guild = interaction.guild;
    const user = interaction.user;

    const STAFF_ROLE_ID = process.env.MOD_ROLE_ID;
    const CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;

    const channel = await guild.channels.create({
      name: `ticket-${user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
          ]
        },
        {
          id: STAFF_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
          ]
        }
      ]
    });

    await channel.send(
`🎟️ **Új Ticket**

👤 Nyitotta: ${user}
📂 Típus: **${type}**

Kérlek írd le részletesen a problémád.`
    );

    await interaction.reply({
      content: `✅ Ticket létrehozva: ${channel}`,
      ephemeral: true
    });
    return;
  }
}
