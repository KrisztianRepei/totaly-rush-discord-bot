import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export const closeTicketButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("Ticket bezárása")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger)
);
