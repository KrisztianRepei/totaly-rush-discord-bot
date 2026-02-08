import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage } from "./handlers/messageHandler.js";
import { handleInteraction } from "./handlers/interactionHandler.js";
import { ticketMenu } from "./components/ticketMenu.js";


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", async () => {
  console.log(`ONLINE: ${client.user.tag}`);

  const channelId = process.env.TICKET_PANEL_CHANNEL_ID;

  try {
    const channel = await client.channels.fetch(channelId);

    // ❗ ellenőrizzük, van-e már ticket panel
    const messages = await channel.messages.fetch({ limit: 10 });
    const alreadyExists = messages.some(
      m => m.author.id === client.user.id && m.components.length > 0
    );

    if (!alreadyExists) {
      await channel.send({
        content:
          "🎟️ **Ticket rendszer**\n\nVálaszd ki a problémád típusát a lenyitható menüből:",
        components: [ticketMenu]
      });
      console.log("✅ Ticket panel kirakva");
    } else {
      console.log("ℹ️ Ticket panel már létezik");
    }
  } catch (err) {
    console.error("❌ Ticket panel hiba:", err.message);
  }
});

client.on("messageCreate", msg => handleMessage(msg, client));
client.on("interactionCreate", handleInteraction);

client.login(process.env.DISCORD_TOKEN);
