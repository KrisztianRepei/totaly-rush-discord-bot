import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage, handleReportStats } from "./handlers/messageHandler.js";
import { handleInteraction } from "./handlers/interactionHandler.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`ONLINE: ${client.user.tag}`);
});

client.on("messageCreate", msg => {
  handleMessage(msg, client);
  handleReportStats(msg);
});

client.on("interactionCreate", handleInteraction);

client.login(process.env.DISCORD_TOKEN);
