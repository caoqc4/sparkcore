export function buildSmokeZhSoftCatchReply(userName: string | null) {
  return userName
    ? `${userName}，我在，先别一个人扛着。`
    : "我在，先别一个人扛着。";
}

export function buildSmokeEnSoftCatchReply(userName: string | null) {
  return userName
    ? `${userName}, I am here, and you do not have to carry this alone.`
    : "I am here, and you do not have to carry this alone.";
}
