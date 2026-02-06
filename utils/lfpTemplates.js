export function buildLfpMessage(lang, d) {
  if (lang === "hu") {
    return `🔊 | 𝑷𝒓𝒆𝒎𝒊𝒆𝒓 #${d.room} szobába keresünk ${d.players} playert.
🏆 Rang: ${d.rank}
🧠 Pozíció: ${d.roles}`;
  }

  return `🔊 | Premier room #${d.room} looking for ${d.players} players.
🏆 Rank: ${d.rank}
🧠 Roles: ${d.roles}`;
}

