import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage } from "./handlers/messageHandler.js";
import { handleInteraction } from "./handlers/interactionHandler.js";
import { testDbConnection } from "./utils/db.js"; // 👈 EZ AZ ÚJ

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", async () => {
  console.log(`ONLINE: ${client.user.tag}`);

  // ✅ MySQL kapcsolat ellenőrzés induláskor
  await testDbConnection();
});

client.on("messageCreate", msg => handleMessage(msg, client));
client.on("interactionCreate", handleInteraction);

client.login(process.env.DISCORD_TOKEN);
