import { createHash } from "node:crypto";
export type Input = Record<string, unknown>;
export type Outcome = "passed" | "rejected" | "paused" | "conflict" | "incomplete" | "unconfirmed";
export type Result = { source: "local-experiment"; outcome: Outcome; summary: string; evidence: Input; steps: string[] };
export type Scenario = { id: string; label: string; input: Input; expected: Outcome; checks?: Input };
export type Lesson = { number: number; title: string; description: string; concepts: string[]; scope: string; cases: Scenario[]; run(input: Input): Result | Promise<Result> };
export function text(input: Input, key: string, fallback = ""): string {
  const value = input[key] ?? fallback;
  if (typeof value !== "string" || value.length > 20000) throw new Error(`${key} must be bounded text`);
  return value;
}
export function number(input: Input, key: string, fallback = 0): number {
  const value = input[key] ?? fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${key} must be a finite number`);
  return value;
}
export function flag(input: Input, key: string, fallback = false): boolean {
  const value = input[key] ?? fallback;
  if (typeof value !== "boolean") throw new Error(`${key} must be true or false`);
  return value;
}
export function list(input: Input, key: string): unknown[] {
  const value = input[key];
  if (!Array.isArray(value) || value.length > 200) throw new Error(`${key} must be a list of at most 200 values`);
  return value;
}
export function object(value: unknown): Input {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
  return value as Input;
}
export const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export const report = (outcome: Outcome, summary: string, evidence: Input, steps: string[]): Result => ({ source: "local-experiment", outcome, summary, evidence, steps });
export function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
export function safePath(value: string): boolean {
  return !!value && !value.startsWith("/") && !value.includes("\\") && !value.includes(":") && !value.split("/").some(part => part === ".." || part === "." || part === "") && !value.split("/").some(part => [".git", ".env", ".agents", ".codex"].includes(part));
}
