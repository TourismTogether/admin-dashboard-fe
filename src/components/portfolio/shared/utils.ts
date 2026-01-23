// Generate avatar URL from first letter
export function generateAvatarUrl(text: string | null | undefined): string {
  if (!text || text.trim().length === 0) {
    return "https://ui-avatars.com/api/?name=User&size=256&background=random";
  }
  const firstLetter = text.trim().charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&size=256&background=random&bold=true&color=fff`;
}
