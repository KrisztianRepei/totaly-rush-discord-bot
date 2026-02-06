import { SlashCommandBuilder } from "discord.js";
import { formatAdminReport } from "../utils/reportFormatter.js";

const cooldowns = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000; // 10 perc

export const reportCommand = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Játékos jelentése (csak a report szobában)")
    .addUserOption(opt =>
      opt.setName("player")
        .setDescription("A jelentett játékos")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason")
        .setDescription("Jelentés oka")
        .setRequired(true)
    ),

  async execute(interaction) {

    // 📍 csak a report csatornában
    if (interaction.channel.id !== process.env.REPORT_INPUT_CHANNEL_ID) {
      return interaction.reply({
        content: "❌ A /report parancs csak a #report szobában használható.",
        ephemeral: true
      });
    }

    const reported = interaction.options.getUser("player");
    const reason = interaction.options.getString("reason");
    const reporterId = interaction.user.id;

    // 🚫 önreport tiltás
    if (reported.id === reporterId) {
      return interaction.reply({
        content: "❌ Saját magadat nem jelentheted.",
        ephemeral: true
      });
    }

    // ⏱️ cooldown ellenőrzés
    const lastReport = cooldowns.get(reporterId);
    if (lastReport && Date.now() - lastReport < COOLDOWN_TIME) {
      const remaining = Math.ceil(
        (COOLDOWN_TIME - (Date.now() - lastReport)) / 60000
      );

      return interaction.reply({
        content: `⏱️ Várnod kell még **${remaining} percet**, mielőtt újra reportolhatsz.`,
        ephemeral: true
      });
    }

    // 💾 cooldown mentése
    cooldowns.set(reporterId, Date.now());

    // 🛡️ admin csatorna
    const adminChannel = await interaction.client.channels.fetch(
      process.env.REPORT_ADMIN_CHANNEL_ID
    );

    // 📢 admin értesítés
    await adminChannel.send(
      formatAdminReport(interaction.user, reported, reason)
    );

    // ✅ user visszajelzés
    await interaction.reply({
      content: `✅ **Köszönjük a reportot!**\nHamarosan kivizsgáljuk.\n👤 Reportolta: ${interaction.user}`,
      ephemeral: true
    });
  }
};
