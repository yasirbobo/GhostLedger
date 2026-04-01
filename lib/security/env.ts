const DEFAULT_OPENAI_MODEL = "gpt-5-mini"
export type AppStorageMode = "file" | "database"

function readOptional(value: string | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

export function getAppEnv() {
  const requestedStorageMode = readOptional(process.env.GHOSTLEDGER_STORAGE_MODE)
  const storageMode: AppStorageMode =
    requestedStorageMode === "database" ? "database" : "file"

  return {
    nodeEnv: readOptional(process.env.NODE_ENV) ?? "development",
    databaseUrl: readOptional(process.env.DATABASE_URL),
    storageMode,
    openAiApiKey: readOptional(process.env.OPENAI_API_KEY),
    openAiModel: readOptional(process.env.OPENAI_MODEL) ?? DEFAULT_OPENAI_MODEL,
  }
}

export function validateAppEnv() {
  const env = getAppEnv()
  const issues: string[] = []
  const warnings: string[] = []

  if (env.storageMode === "database" && !env.databaseUrl) {
    issues.push("DATABASE_URL is required when GHOSTLEDGER_STORAGE_MODE=database.")
  }

  if (env.nodeEnv === "production" && env.storageMode === "file") {
    warnings.push("Production is running in file storage mode. Use database mode for launch.")
  }

  if (!env.openAiApiKey) {
    warnings.push("OPENAI_API_KEY is not configured. AI responses will use deterministic fallback.")
  }

  return {
    env,
    issues,
    warnings,
    isValid: issues.length === 0,
  }
}
