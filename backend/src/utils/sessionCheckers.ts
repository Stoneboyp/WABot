import { SessionData } from "../types";
import { scenarioConfigs } from "../utils/scenarioConfigs";

export function isReadyForConfirmation(session: SessionData): boolean {
  const scenario = session.scenario;
  if (!scenario) return false;

  const config = scenarioConfigs[scenario];
  if (!config) return false;

  return config.required.every((field) =>
    Boolean(session[field as keyof SessionData])
  );
}
