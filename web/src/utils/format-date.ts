export function formatToUtc(date: string | Date) {
  if (typeof date === "string") {
    new Date(date);
  }
}
