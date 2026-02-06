import { lfpLanguageMenu } from "../components/lfpLanguageMenu.js";

export const lfpMessageCache = new Map();
const reportCooldowns = new Map();
const reportCounts = new Map(); 
const alertedUsers = new Set(); 

const LFP_CHANNELS = [
  "1467188892863168716",
  "1467199549247328448"
];

const REPORT_CHANNEL_ID = process.env.REPORT_INPUT_CHANNEL_ID;
const ADMIN_REPORT_CHANNEL_ID = process.env.REPORT_ADMIN_CHANNEL_ID;

const COOLDOWN_TIME = 10 * 60 * 1000; // 10 perc

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
  if (!message.content.startsWith("report")) return;
  if (message.channel.id !== REPORT_CHANNEL_ID) {
    return message.reply("❌ A report parancs csak a #report szobában használható.");
  }

  const args = message.content.split(" ").slice(1);
  const reported = message.mentions.users.first();
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

  // 📢 admin csatorna
  const adminChannel = await client.channels.fetch(ADMIN_REPORT_CHANNEL_ID);

  await adminChannel.send(
    `🚨 **ÚJ JÁTÉKOS REPORT**

👤 Jelentett: ${reported}
🧑 Jelentette: ${message.author}
🕒 Időpont: <t:${Math.floor(Date.now() / 1000)}:F>

📝 **Indok:**
${reason}`
  );

  // 🧹 user parancs törlése (opcionális)
  await message.delete().catch(() => {});

  // ✅ visszajelzés
  await message.channel.send({
    content: `✅ **Köszönjük a reportot!** Hamarosan kivizsgáljuk.\n👤 Reportolta: ${message.author}`
  });
}
