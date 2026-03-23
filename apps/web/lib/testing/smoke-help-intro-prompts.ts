export function isSmokeHelpIntroRequest(content: string) {
  return (
    content.includes("请用两句话介绍你自己") ||
    content.includes("你能如何帮助我")
  );
}
