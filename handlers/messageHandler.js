import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";
import { db } from "../utils/db.js";

/* =======================
   CONFIG
======================= */
const LFP_CHANNELS = [
  "1467188892863168716",
  "1467199549247328448"
];

const REPORT_CHANNEL_ID = process.env.REPORT_INPUT_CHANNEL_ID;
const ADMIN_REPORT_CHANNEL_ID = process.env.REPORT_ADMIN_CHANNEL_ID;
const MOD_ROLE_ID = process.env.MOD_ROLE_ID;

const COOLDOWN_TIME = 10 * 60 * 1000;
const REPORT_EXPIRE_DAYS = Number(process.env.REPORT_EXPIRE_DAYS || 7);
const REPORT_ALERT_THRESHOLD =
  Number(process.env.REPORT_ALERT_THRESHOLD || 3);

const reportCooldowns = new Map();

/* =======================
   MAIN HANDLER
======================= */
export async function handleMessage(message, client) {
  if (message.author.bot) return;

  /* ===== LFP ===== */
  if (
    LFP_CHANNELS.includes(message.channel.id) &&
    message.content.toLowerCase() === "lfp"
  ) {
    return message.reply({
      content: "🌍 Válaszd ki a nyelvet / Choose language",
      components: [lfpLanguageMenu]
    });
  }

  /* ===== REPSTATS ===== */
  if (message.content.toLowerCase().startsWith("repstats")) {
    if (!message.member.roles.cache.has(MOD_ROLE_ID)) {
      return message.reply("❌ Nincs jogosultságod.");
    }

    const reported = message.mentions.users.first();
    if (!reported) {
      return message.reply("❌ Használat: `repstats @játékos`");
    }

    const [rows] = await db.execute(
      `SELECT reason, created_at
       FROM reports
       WHERE reported_id = ?
       AND created_at > NOW() - INTERVAL ? DAY`,
      [reported.id, REPORT_EXPIRE_DAYS]
    );

    if (rows.length === 0) {
      return message.reply(`ℹ️ ${reported} játékosnak nincs aktív reportja.`);
    }

    const reasons = rows
      .map(r =>
        `• ${r.reason} (<t:${Math.floor(new Date(r.created_at).getTime() / 1000)}:R>)`
      )
      .join("\n");

    return message.reply(
`📊 **Report statisztika – ${reported}**

📌 Aktív reportok: **${rows.length}**

📝 Indokok:
${reasons}`
    );
  }

  /* ===== REPORT ===== */
  if (!message.content.toLowerCase().startsWith("report")) return;
  if (message.channel.id !== REPORT_CHANNEL_ID) {
    return message.reply("❌ A report parancs csak a #report szobában használható.");
  }

  const reported = message.mentions.users.first();
  const args = message.content.split(" ").slice(1);
  const reason = args.slice(1).join(" ");

  if (!reported || !reason) {
    return message.reply("❌ Használat: `report @játékos indok`");
  }

  if (reported.id === message.author.id) {
    return message.reply("❌ Saját magadat nem jelentheted.");
  }

  const last = reportCooldowns.get(message.author.id);
  if (last && Date.now() - last < COOLDOWN_TIME) {
    return message.reply("⏱️ 10 percenként csak 1 report küldhető.");
  }
  reportCooldowns.set(message.author.id, Date.now());

  await db.execute(
    `INSERT INTO reports (reported_id, reporter_id, reason)
     VALUES (?, ?, ?)`,
    [reported.id, message.author.id, reason]
  );

  const [[{ count }]] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM reports
     WHERE reported_id = ?
     AND created_at > NOW() - INTERVAL ? DAY`,
    [reported.id, REPORT_EXPIRE_DAYS]
  );

  const adminChannel = await client.channels.fetch(ADMIN_REPORT_CHANNEL_ID);

  await adminChannel.send(
`🚨 **ÚJ JÁTÉKOS REPORT**

👤 Jelentett: ${reported}
🧑 Jelentette: ${message.author}
📝 Indok: ${reason}`
  );

  if (count >= REPORT_ALERT_THRESHOLD) {
    await adminChannel.send(
`🚨 <@&${MOD_ROLE_ID}> **FIGYELEM!**
👤 ${reported} elérte a **${REPORT_ALERT_THRESHOLD} reportot**`
    );
  }

  await message.delete().catch(() => {});
  await message.channel.send(
    `✅ **Köszönjük a reportot!** Hamarosan kivizsgáljuk.\n👤 Reportolta: ${message.author}`
  );
}
