export function formatAdminReport(reporter, reported, reason) {
  return `🚨 **ÚJ JÁTÉKOS REPORT**

👤 Jelentett: ${reported} (${reported.id})
🧑 Jelentette: ${reporter} (${reporter.id})
🕒 Időpont: <t:${Math.floor(Date.now() / 1000)}:F>

📝 **Indok:**
${reason}
`;
}
