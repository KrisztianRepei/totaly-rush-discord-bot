import { getStreamInfo } from "./twitchApi.js";

let wasLive = false;

export async function checkTwitchStream(client) {
  const stream = await getStreamInfo(process.env.TWITCH_CHANNEL);

  // offline
  if (!stream) {
    wasLive = false;
    return;
  }

  // már szóltunk róla
  if (wasLive) return;

  const game = stream.game_name;

  const isCS =
    game === "Counter-Strike 2" ||
    game === "Counter-Strike: Global Offensive";

  if (!isCS) {
    console.log(`Live, de nem CS: ${game}`);
    return;
  }

  wasLive = true;

  const channel = await client.channels.fetch(
    process.env.DISCORD_ANNOUNCE_CHANNEL_ID
  );

  channel.send(
    `🔴 **${process.env.TWITCH_CHANNEL} élőben CS2-vel!**
🎮 ${stream.title}
👉 https://twitch.tv/${process.env.TWITCH_CHANNEL}`
  );
}
