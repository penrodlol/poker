export function logInfo<T>(message: string, data: T) {
  console.log({ message, data });
}

export function logError<T>(message: string, data: T) {
  console.error({ message, data: normalizeError(data) });
}

function normalizeError(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map(normalizeError);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, normalizeError(val)]));
  return value;
}
