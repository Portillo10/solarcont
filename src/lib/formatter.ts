export function getStartOfDay(date: string) {
  return new Date(date + "T00:00:00.000Z").toISOString();
}

export function getEndOfDay(date: string) {
  return new Date(date + "T23:59:59.999Z").toISOString();
}

export function formatDate(date: string) {
  const formatedDate = new Date(date);
  formatedDate.setHours(formatedDate.getHours() - 5);
  return formatedDate.toISOString();
}

export function convertToISO(date?: string) {
  const timeString = "T12:31:28.862Z";
  const dateISO = !date
    ? null
    : date.includes("T")
      ? date
      : `${date}${timeString}`;
  return dateISO;
}

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
