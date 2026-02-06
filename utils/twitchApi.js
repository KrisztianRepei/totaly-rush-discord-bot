import fetch from "node-fetch";
import { getTwitchToken } from "./twitchAuth.js";

export async function getStreamInfo(username) {
  const token = await getTwitchToken();

  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${username}`,
    {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${token}`
      }
    }
  );

  const data = await res.json();
  return data.data[0] || null;
}
