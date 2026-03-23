export function withSmokeZhBoundaryUserPrefix(
  userName: string | null,
  content: string
) {
  return userName ? `${userName}，${content}` : content;
}
