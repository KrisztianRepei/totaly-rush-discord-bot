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
   CONFIG
======================= */
const STAFF_ROLE_ID = process.env.MOD_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;
const TICKET_LOG_CHANNEL_ID = process.env.TICKET_LOG_CHANNEL_ID || null;

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

    const channel = await guild.channels.create({
      name: `ticket-${user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID,
      topic: `TicketOwner:${user.id}`,
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

    activeTickets.set(user.id, channel.id);

    await channel.send(
`🎟️ **Új Ticket**

👤 Nyitotta: ${user}
📂 Típus: **${type}**

Kérlek írd le részletesen a problémád.`
    );

    // 🔴 LIVE REPORT → azonnali staff ping
    if (type === "Live Report") {
      await channel.send(
`🔴 **LIVE REPORT**
<@&${STAFF_ROLE_ID}>

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
    const userId = interaction.user.id;

    const isStaff = member.roles.cache.has(STAFF_ROLE_ID);

    const topic = channel.topic || "";
    const ownerMatch = topic.match(/TicketOwner:(\d+)/);
    const ownerId = ownerMatch ? ownerMatch[1] : null;
    const isOwner = ownerId === userId;

    if (!isStaff && !isOwner) {
      return interaction.reply({
        content: "❌ Csak a ticket tulajdonosa vagy staff zárhatja le.",
        ephemeral: true
      });
    }

    if (ownerId) activeTickets.delete(ownerId);

    if (TICKET_LOG_CHANNEL_ID) {
      const logChannel = await interaction.guild.channels
        .fetch(TICKET_LOG_CHANNEL_ID)
        .catch(() => null);

      if (logChannel) {
        await logChannel.send(
`📕 **Ticket lezárva**

📂 Csatorna: ${channel.name}
👤 Zárta: ${interaction.user}
👑 Tulaj: <@${ownerId}>`
        );
      }
    }

    await interaction.reply({
      content: "🔒 Ticket lezárva. A csatorna törlődik.",
      ephemeral: true
    });

    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 3000);
    return;
  }
}
