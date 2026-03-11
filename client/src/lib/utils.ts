import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseSalary(input: string): number | null {
  const stripped = input.replace(/[$,\s]/g, "");
  if (stripped === "") return null;
  const num = parseInt(stripped, 10);
  return isNaN(num) || num < 0 ? null : num;
}

export function formatSalary(value: number | null | undefined): string {
  if (value == null) return "";
  return "$" + value.toLocaleString("en-US");
}
