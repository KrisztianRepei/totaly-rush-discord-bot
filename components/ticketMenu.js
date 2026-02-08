import {
  ActionRowBuilder,
  StringSelectMenuBuilder
} from "discord.js";

export const ticketMenu = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("🎟️ Válaszd ki a ticket típusát")
    .addOptions([
      {
        label: "Support",
        value: "Support",
        emoji: "🛠"
      },
      {
        label: "Rank Help",
        value: "Rank Help",
        emoji: "🎯"
      },
      {
        label: "Report Information",
        value: "Report Information",
        emoji: "🚨"
      },
      {
        label: "Live Report",
        value: "Live Report",
        emoji: "🔴"
      }
    ])
);
