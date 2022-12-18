export function getCurrentUTCDate(dateParam?: Date) {
  const date = dateParam || new Date();
  return `${date.getUTCFullYear()}-${
    date.getUTCMonth() + 1
  }-${date.getUTCDate()}`;
}
