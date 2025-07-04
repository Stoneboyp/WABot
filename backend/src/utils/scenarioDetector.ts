//
import { scenarioConfigs } from "./scenarioConfigs";
import type { SessionData } from "../types";

export function detectScenario(
  text: string
): SessionData["scenario"] | undefined {
  const lower = text.toLowerCase();

  for (const [scenario, config] of Object.entries(scenarioConfigs)) {
    if (config.keywords?.some((kw) => lower.includes(kw))) {
      return scenario as SessionData["scenario"];
    }
  }

  return undefined;
}
