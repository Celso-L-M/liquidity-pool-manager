import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Ensure each test starts with a clean DOM. RTL's auto-cleanup relies on a
// global `afterEach`; make it explicit so renders never leak across tests.
afterEach(() => cleanup());

// `@/backend` (loaded transitively through `useQueries.ts`) imports
// `@caffeineai/object-storage`, whose `dist/index.js` resolves an extensionless
// `./blob` import that Node's ESM resolver in the Vitest worker rejects. The
// app only uses `ExternalBlob` as a type, so a runtime stub is enough to let
// the real `@/backend` module load without the broken package being evaluated.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));
