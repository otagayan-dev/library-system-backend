export function toSnakeCase(property: string): string {
  return property.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}
