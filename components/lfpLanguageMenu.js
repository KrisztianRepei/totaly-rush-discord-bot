import {
  ActionRowBuilder,
  StringSelectMenuBuilder
} from "discord.js";

export const lfpLanguageMenu = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId("lfp_language")
    .setPlaceholder("Válassz nyelvet / Choose language")
    .addOptions(
      { label: "Magyar 🇭🇺", value: "hu" },
      { label: "English 🇬🇧", value: "en" }
    )
);
