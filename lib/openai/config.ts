import { getAppEnv } from "../security/env"

export function getOpenAIConfig() {
  const env = getAppEnv()
  const apiKey = env.openAiApiKey

  if (!apiKey) {
    return null
  }

  return {
    apiKey,
    model: env.openAiModel,
  }
}
