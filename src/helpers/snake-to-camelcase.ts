export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
}

export function keysToCamel<T>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as unknown as T;
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = keysToCamel((obj as any)[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}
