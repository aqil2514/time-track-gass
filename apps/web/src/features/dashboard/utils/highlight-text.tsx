export function highlightText(text: string, highlights: string[]) {
  if (!highlights.length) return text;

  const regex = new RegExp(`(${highlights.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    highlights.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
      <span key={index} className="text-purple-400 font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
