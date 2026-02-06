import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";

export const lfpMessageCache = new Map();
const reportCooldowns = new Map();
const reportCounts = new Map();     
const reportReasons = new Map();    
const alertedUsers = new Set();     
const REPORT_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; 

const LFP_CHANNELS = [
  "1467188892863168716",
  "1467199549247328448"
];

const REPORT_CHANNEL_ID = process.env.REPORT_INPUT_CHANNEL_ID;
const ADMIN_REPORT_CHANNEL_ID = process.env.REPORT_ADMIN_CHANNEL_ID;
const MOD_ROLE_ID = process.env.MOD_ROLE_ID;

const COOLDOWN_TIME = 10 * 60 * 1000; // 10 perc
const ALERT_THRESHOLD = Number(process.env.REPORT_ALERT_THRESHOLD || 3);

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

  const args = message.content.split(" ").slice(1);
  const reported = message.mentions.users.first();
  const reason = args.slice(1).join(" ");

  if (!reported || !reason) {
    return message.reply("❌ Használat: `report @játékos indok`");
  }

  /* =======================
   REPORT STATS (ADMIN)
======================= */
if (message.content.toLowerCase().startsWith("reportstats")) {

  // 🔐 role check
  if (!message.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
    return message.reply("❌ Ehhez a parancshoz nincs jogosultságod.");
  }

  const reported = message.mentions.users.first();
  if (!reported) {
    return message.reply("❌ Használat: `reportstats @játékos`");
  }

  const reportedId = reported.id;
  const reasons = reportReasons.get(reportedId) || [];
  const count = reasons.length;

  if (count === 0) {
    return message.reply(`ℹ️ ${reported} játékosnak nincs aktív reportja.`);
  }

  const formattedReasons = reasons
    .map(r =>
      `• ${r.reason} (<t:${Math.floor(r.time / 1000)}:R>)`
    )
    .join("\n");

  return message.reply(
`📊 **REPORT STATISZTIKA**

👤 Játékos: ${reported}
📌 Aktív reportok: **${count}**
🚨 Alert volt: ${alertedUsers.has(reportedId) ? "Igen" : "Nem"}

📝 **Indokok (1 héten belül):**
${formattedReasons}`
  );
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

  const adminChannel = await client.channels.fetch(ADMIN_REPORT_CHANNEL_ID);

  /* =======================
     REPORT LOG (ADMIN)
  ======================= */
  await adminChannel.send(
`🚨 **ÚJ JÁTÉKOS REPORT**

👤 Jelentett: ${reported}
🧑 Jelentette: ${message.author}
🕒 Időpont: <t:${Math.floor(Date.now() / 1000)}:F>

📝 **Indok:**
${reason}`
  );

const now = Date.now();

// 🧹 elévült reportok kiszűrése
const validReasons = (reportReasons.get(reportedId) || [])
  .filter(r => now - r.time < REPORT_EXPIRY_TIME);

if (validReasons.length === 0) {
  reportReasons.delete(reportedId);
  reportCounts.delete(reportedId);
  alertedUsers.delete(reportedId);
} else {
  reportReasons.set(reportedId, validReasons);
  reportCounts.set(reportedId, validReasons.length);
}
  
  /* =======================
     REPORT SZÁMLÁLÁS + INDOK GYŰJTÉS
  ======================= */
  const reportedId = reported.id;

  const newCount = (reportCounts.get(reportedId) || 0) + 1;
  reportCounts.set(reportedId, newCount);

  const reasons = reportReasons.get(reportedId) || [];
  reasons.push({
  reason,
  time: Date.now()
});
  reportReasons.set(reportedId, reasons);

  /* =======================
     🚨 AUTOMATIKUS MOD ALERT
  ======================= */
  if (newCount >= ALERT_THRESHOLD && !alertedUsers.has(reportedId)) {
    alertedUsers.add(reportedId);

    const formattedReasons = reasons
      .map(r => `• ${r.reason}`)
      .join("\n");

    await adminChannel.send(
`🚨 **ALERT – TÖBB REPORT**

👤 Játékos: ${reported}
📊 Reportok száma: **${newCount}**

📝 **Indokok:**
${formattedReasons}

⏱ Időpont: <t:${Math.floor(Date.now() / 1000)}:F>

<@&${MOD_ROLE_ID}>`
    );
  }

  // 🧹 user parancs törlése
  await message.delete().catch(() => {});

  // ✅ visszajelzés
  await message.channel.send({
    content: `✅ **Köszönjük a reportot!** Hamarosan kivizsgáljuk.\n👤 Reportolta: ${message.author}`
  });
}
