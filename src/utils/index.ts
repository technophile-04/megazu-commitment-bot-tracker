export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getPlacementEmoji(index: number): string {
  const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  return emojis[index] || "🏅";
}

export function extractMentions(caption: string): string[] {
  const mentionRegex = /@(\w+)/g;
  return (caption.match(mentionRegex) || []).map((mention) => mention.slice(1));
}

export function getBingBotReaction(
  isPhotoRoast: boolean,
  roast: string,
): string {
  const photoRoastReactions = [
    "*munches broccoli aggressively* ",
    "*chomps broccoli while judging* ",
    "*stress-eats broccoli* ",
    "*takes an angry bite of broccoli* ",
    "*clutches emotional support broccoli* ",
  ];

  const roasterCalloutReactions = [
    "*spits watermelon seeds disappointedly* ",
    "*drops watermelon in disappointment* ",
    "*sadly puts down watermelon* ",
    "*throws watermelon rind in disgust* ",
    "*stress-eats watermelon* ",
  ];

  const reactions = isPhotoRoast
    ? photoRoastReactions
    : roasterCalloutReactions;
  const emoji = isPhotoRoast ? "🥦" : "🍉";

  return `${reactions[Math.floor(Math.random() * reactions.length)]}${roast} ${emoji}`;
}
