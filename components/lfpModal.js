import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from "discord.js";

export function lfpModal(lang) {
  return new ModalBuilder()
    .setCustomId(`lfp_modal_${lang}`)
    .setTitle(lang === "hu" ? "LFP adatok" : "LFP details")
    .addComponents(
      input("room", lang === "hu" ? "Szoba" : "Room"),
      input("players", lang === "hu" ? "Hány játékos?" : "Players needed"),
      input("elo", lang === "hu" ? "Elo / Rang" : "Elo / Rank"),
      input("role", lang === "hu" ? "Pozíció" : "Role")
    );
}

function input(id, label) {
  return new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );
}

