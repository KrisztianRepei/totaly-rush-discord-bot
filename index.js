import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage } from "./handlers/messageHandler.js";
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

client.on("messageCreate", handleMessage);
client.on("interactionCreate", handleInteraction);

client.login(process.env.DISCORD_TOKEN);

import { checkTwitchStream } from "./utils/twitchChecker.js";

setInterval(() => {
  checkTwitchStream(client).catch(console.error);
}, 5 * 60 * 1000); // 5 perc
