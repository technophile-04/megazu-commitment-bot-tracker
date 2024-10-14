export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getPlacementEmoji(index: number): string {
  const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  return emojis[index] || "🏅";
}
