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
    "*spits watermelon seeds in shock* ",
    "*counts watermelon seeds to calm down* ",
    "*flicks watermelon seeds in disapproval* ",
    "*makes watermelon seed rain of judgment* ",
    "*stress-arranges watermelon seeds in patterns* ",
    "*clutches watermelon like a therapy pet* ",
    "*taps watermelon impatiently* ",
    "*caresses watermelon judgmentally* ",
    "*polishes watermelon with disappointed look* ",
    "*hugs watermelon for emotional stability* ",
    "*aggressively measures watermelon with eyes* ",
    "*protectively shields watermelon from bad photos* ",
    "*squints through watermelon slice at photo* ",
    "*uses watermelon as judge's gavel* ",
  ];

  const roasterCalloutReactions = [
    "*sighs and drops watermelon in despair* ",
    "*sadly spits watermelon seeds at roasting attempt* ",
    "*stares disappointedly through watermelon slice* ",
    "*slowly slides down wall with watermelon* ",
    "*tiredly counts watermelon seeds instead of your jokes* ",
    "*can't even finish watermelon from disappointment* ",
    "*watermelon literally wilts from your attempt* ",
    "*holds watermelon like disappointed parent* ",
    "*needs new watermelon after seeing this* ",
    "*watches watermelon roll away like your career* ",
    "*stress-organizes watermelon seeds* ",
    "*shields watermelon's eyes from this attempt* ",
    "*watermelon facepalm* ",
    "*disappointedly offers you watermelon therapy* ",
    "*questions life with emotional support watermelon* ",
  ];

  const reactions = isPhotoRoast
    ? photoRoastReactions
    : roasterCalloutReactions;

  return `${reactions[Math.floor(Math.random() * reactions.length)]}\n\n${roast}`;
}
