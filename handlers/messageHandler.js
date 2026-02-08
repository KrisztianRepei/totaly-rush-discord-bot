import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";
import fs from "fs";
import path from "path";

export const lfpMessageCache = new Map();

/* =======================
   FILE STORAGE
======================= */
const DATA_DIR = path.resolve("data");
const REPORT_FILE = path.join(DATA_DIR, "reports.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(REPORT_FILE)) fs.writeFileSync(REPORT_FILE, "[]");

function loadReports() {
  return JSON.parse(fs.readFileSync(REPORT_FILE, "utf8"));
}

function saveReports(data) {
  fs.writeFileSync(REPORT_FILE, JSON.stringify(data, null, 2));
}

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
const REPORT_EXPIRE_DAYS = Number(process.env.REPORT_EXPIRE_DAYS || 7);
const REPORT_ALERT_THRESHOLD = Number(process.env.REPORT_ALERT_THRESHOLD || 3);

/* =======================
   STATE
======================= */
const reportCooldowns = new Map();

/* =======================
   MAIN HANDLER
======================= */
export async function handleMessage(message, client) {
  if (message.author.bot) return;

  /* =======================
     LFP
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
     REPSTATS (MOD ONLY)
  ======================= */
  if (message.content.toLowerCase().startsWith("repstats")) {
    if (!message.member.roles.cache.has(MOD_ROLE_ID)) {
      return message.reply("❌ Nincs jogosultságod.");
    }

    const reported = message.mentions.users.first();
    if (!reported) {
      return message.reply("❌ Használat: `repstats @játékos`");
    }

    const reports = loadReports();
    const now = Date.now();

    const active = reports.filter(
      r =>
        r.reportedId === reported.id &&
        now - new Date(r.createdAt).getTime() <
          REPORT_EXPIRE_DAYS * 24 * 60 * 60 * 1000
    );

    if (active.length === 0) {
      return message.reply(`ℹ️ ${reported} játékosnak nincs aktív reportja.`);
    }

    const reasons = active
      .map(
        r =>
          `• ${r.reason} (<t:${Math.floor(
            new Date(r.createdAt).getTime() / 1000
          )}:R>)`
      )
      .join("\n");

    return message.reply(
`📊 **Report statisztika – ${reported}**

📌 Aktív reportok: **${active.length}**

📝 Indokok:
${reasons}`
    );
  }

  /* =======================
     REPORT
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

  if (reported.id === message.author.id) {
    return message.reply("❌ Saját magadat nem jelentheted.");
  }

  const last = reportCooldowns.get(message.author.id);
  if (last && Date.now() - last < COOLDOWN_TIME) {
    return message.reply("⏱️ 10 percenként csak 1 report küldhető.");
  }
  reportCooldowns.set(message.author.id, Date.now());

  const reports = loadReports();
  reports.push({
    reportedId: reported.id,
    reporterId: message.author.id,
    reason,
    createdAt: new Date().toISOString()
  });
  saveReports(reports);

  const adminChannel = await client.channels.fetch(ADMIN_REPORT_CHANNEL_ID);

  await adminChannel.send(
`🚨 **ÚJ JÁTÉKOS REPORT**

👤 Jelentett: ${reported}
🧑 Jelentette: ${message.author}
📝 Indok: ${reason}`
  );

  const count = reports.filter(
    r =>
      r.reportedId === reported.id &&
      Date.now() - new Date(r.createdAt).getTime() <
        REPORT_EXPIRE_DAYS * 24 * 60 * 60 * 1000
  ).length;

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
