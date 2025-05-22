export function removeLeadingZeros(value: string): string {
  return value.replace(/^0+/, "");
}

export const toNumber = (value: string): number => {
  const num = parseFloat(value.replace(",", "."));
  return isNaN(num) ? 0 : num;
};

export const toBoolean = (value: string): boolean => {
  return value.trim().toLowerCase() === "true";
};
