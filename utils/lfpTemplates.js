export function buildLfpMessage(lang, d, user) {
  if (lang === "hu") {
    return `🔊 | 𝑷𝒓𝒆𝒎𝒊𝒆𝒓 #${d.room} szobába keresünk ${d.players} playert.
🏆 Rang/Pont: ${d.elo}
🧠 Pozíció: ${d.role}
👤 LFP: ${user}`;
  }

  return `🔊 | Premier room #${d.room} looking for ${d.players} player.
🏆 Rank/Elo: ${d.elo}
🧠: Role: ${d.role}
👤 LFP: ${user}`;
}
