import { lfpModal } from "../components/lfpModal.js";
import { buildLfpMessage } from "../utils/lfpTemplates.js";
import { lfpMessageCache } from "./messageHandler.js";
import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/* =======================
   STATE
======================= */
// 1 aktív ticket / user
const activeTickets = new Map(); // userId -> channelId

/* =======================
   HELPERS
======================= */
const STAFF_ROLE_IDS = process.env.MOD_ROLE_IDS
  ? process.env.MOD_ROLE_IDS.split(",").map(id => id.trim())
  : [];

/* =======================
   CLOSE BUTTON
======================= */
const closeTicketButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("Ticket bezárása")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger)
);

/* =======================
   MAIN HANDLER
======================= */
export async function handleInteraction(interaction) {

  /* =======================
     🌍 LFP – NYELV
  ======================= */
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "lfp_language"
  ) {
    await interaction.showModal(lfpModal(interaction.values[0]));
    return;
  }

  /* =======================
     📩 LFP – MODAL SUBMIT
  ======================= */
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("lfp_modal_")
  ) {
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

    // ❌ nyelvválasztós bot üzenet törlése
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

    // 🔒 1 aktív ticket / user
    if (activeTickets.has(user.id)) {
      return interaction.reply({
        content: "❌ Már van egy aktív ticketed.",
        ephemeral: true
      });
    }

    const CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;

    const staffPermissions = STAFF_ROLE_IDS.map(roleId => ({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages
      ]
    }));

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
        ...staffPermissions
      ]
    });

    // mentjük az aktív ticketet
    activeTickets.set(user.id, channel.id);

    await channel.send(
`🎟️ **Új Ticket**

👤 Nyitotta: ${user}
📂 Típus: **${type}**

Kérlek írd le részletesen a problémád.`
    );

    // 🔴 LIVE REPORT → automatikus staff ping
    if (type === "Live Report") {
      const staffPing = STAFF_ROLE_IDS.map(id => `<@&${id}>`).join(" ");
      await channel.send(
`🔴 **LIVE REPORT**
${staffPing}

⚠️ Azonnali moderátori figyelmet igényel!`
      );
    }

    // ❌ Bezárás gomb
    await channel.send({
      content: "🔒 Ha megoldódott a probléma, zárd le a ticketet:",
      components: [closeTicketButton]
    });

    await interaction.reply({
      content: `✅ Ticket létrehozva: ${channel}`,
      ephemeral: true
    });
    return;
  }

  /* =======================
     ❌ TICKET BEZÁRÁS
  ======================= */
  if (
    interaction.isButton() &&
    interaction.customId === "close_ticket"
  ) {
    const channel = interaction.channel;
    const member = interaction.member;

    const isStaff = member.roles.cache.some(r =>
      STAFF_ROLE_IDS.includes(r.id)
    );

    if (!isStaff) {
      return interaction.reply({
        content: "❌ Csak staff zárhatja le a ticketet.",
        ephemeral: true
      });
    }

    // töröljük az aktív ticketet
    for (const [userId, channelId] of activeTickets.entries()) {
      if (channelId === channel.id) {
        activeTickets.delete(userId);
        break;
      }
    }

    const logChannelId = process.env.TICKET_LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = await interaction.guild.channels
        .fetch(logChannelId)
        .catch(() => null);

      if (logChannel) {
        await logChannel.send(
`📕 **Ticket lezárva**

📂 Csatorna: ${channel.name}
👤 Zárta: ${interaction.user}`
        );
      }
    }

    await interaction.reply({
      content: "✅ Ticket lezárva. A csatorna törlődik.",
      ephemeral: true
    });

    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 3000);
    return;
  }
}
