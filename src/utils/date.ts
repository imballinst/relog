export function getCurrentUTCDate(dateParam?: Date) {
  const date = dateParam || new Date();
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

export function isDateAfter(a: Date, b: Date) {
  return a.valueOf() > b.valueOf()
}

// Helper functions.
function pad(number: number) {
  const str = `${number}`;
  if (str.length === 2) return str;
  return `0${str}`;
}
