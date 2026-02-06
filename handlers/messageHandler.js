import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";

/* =======================
   CACHE / STATE
======================= */
export const lfpMessageCache = new Map();

const reportCooldowns = new Map(); // userId -> timestamp
const reportCounts = new Map();    // reportedId -> count
const reportReasons = new Map();   // reportedId -> [{ reason, time, reporter }]
const alertedUsers = new Set();    // reportedId

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

const COOLDOWN_TIME = 10 * 60 * 1000; // 10 perc
const REPORT_EXPIRE_TIME =
  (process.env.REPORT_EXPIRE_DAYS || 7) * 24 * 60 * 60 * 1000;

const REPORT_ALERT_THRESHOLD =
  Number(process.env.REPORT_ALERT_THRESHOLD || 3);

/* =======================
   HELPERS
======================= */
function cleanExpiredReports(userId) {
  const list = reportReasons.get(userId);
  if (!list) return [];

  const now = Date.now();
  const active = list.filter(r => now - r.time < REPORT_EXPIRE_TIME);

  if (active.length === 0) {
    reportReasons.delete(userId);
    reportCounts.delete(userId);
    alertedUsers.delete(userId);
  } else {
    reportReasons.set(userId, active);
    reportCounts.set(userId, active.length);
  }

  return active;
}

/* =======================
   MAIN HANDLER
======================= */
export async function handleMessage(message, client) {
  if (message.author.bot) return;

  /* =======================
     LFP COMMAND
  ======================= */
  if (
    LFP_CHANNELS.includes(message.channel.id) &&
    message.content.toLowerCase() === "lfp"
  ) {
    lfpMessageCache.set(message.author.id, message);

    return message.reply({
      content: "🌍 Válaszd ki a nyelvet / Choose language",
      components: [lfpLanguageMenu]
    });
  }

  /* =======================
     REPORT COMMAND
  ======================= */
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

  // 🚫 önreport tiltás
  if (reported.id === message.author.id) {
    return message.reply("❌ Saját magadat nem jelentheted.");
  }

  // ⏱️ cooldown
  const last = reportCooldowns.get(message.author.id);
  if (last && Date.now() - last < COOLDOWN_TIME) {
    return message.reply("⏱️ 10 percenként csak 1 report küldhető.");
  }
  reportCooldowns.set(message.author.id, Date.now());

  // 🧹 lejárt reportok törlése
  cleanExpiredReports(reported.id);

  // 🧠 report mentése
  const entry = {
    reason,
    time: Date.now(),
    reporter: message.author.id
  };

  const list = reportReasons.get(reported.id) || [];
  list.push(entry);
  reportReasons.set(reported.id, list);
  reportCounts.set(reported.id, list.length);

  const adminChannel = await client.channels.fetch(ADMIN_REPORT_CHANNEL_ID);

  // 📢 admin log
  await adminChannel.send(
`🚨 **ÚJ JÁTÉKOS REPORT**

👤 Jelentett: ${reported}
🧑 Jelentette: ${message.author}
🕒 Időpont: <t:${Math.floor(Date.now() / 1000)}:F>

📝 **Indok:**
${reason}`
  );

  // 🚨 automatikus mod ping
  if (
    reportCounts.get(reported.id) >= REPORT_ALERT_THRESHOLD &&
    !alertedUsers.has(reported.id)
  ) {
    alertedUsers.add(reported.id);

    await adminChannel.send(
`🚨 <@&${MOD_ROLE_ID}> **FIGYELEM!**

👤 ${reported} elérte a **${REPORT_ALERT_THRESHOLD} reportot**
📌 Automatikus moderátori értesítés.`
    );
  }

  // 🧹 user parancs törlése
  await message.delete().catch(() => {});

  // ✅ visszajelzés
  await message.channel.send({
    content:
      `✅ **Köszönjük a reportot!** Hamarosan kivizsgáljuk.\n👤 Reportolta: ${message.author}`
  });
}

/* =======================
   ADMIN: REPORT STATS
======================= */    
export async function handleReportStats(message) {
  if (!message.content.toLowerCase().startsWith("reportstats")) return;

  if (!message.member.roles.cache.has(MOD_ROLE_ID)) {
    return message.reply("❌ Nincs jogosultságod.");
  }

  const reported = message.mentions.users.first();
  if (!reported) {
    return message.reply("❌ Használat: `reportstats @játékos`");
  }

  const active = cleanExpiredReports(reported.id);

  if (active.length === 0) {
    return message.reply(`ℹ️ ${reported} játékosnak nincs aktív reportja.`);
  }

  const reasons = active
    .map(r =>
      `• ${r.reason} — <t:${Math.floor(r.time / 1000)}:R>`
    )
    .join("\n");

  await message.reply(
`📊 **REPORT STATISZTIKA**

👤 Játékos: ${reported}
📌 Aktív reportok: **${active.length}**

📝 **Indokok:**
${reasons}`
  );
}
