const { PrismaClient } = require("@prisma/client")

function readOptional(value) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function getEnv() {
  const requestedStorageMode = readOptional(process.env.GHOSTLEDGER_STORAGE_MODE)
  const storageMode = requestedStorageMode === "database" ? "database" : "file"

  return {
    nodeEnv: readOptional(process.env.NODE_ENV) ?? "development",
    databaseUrl: readOptional(process.env.DATABASE_URL),
    storageMode,
    openAiApiKey: readOptional(process.env.OPENAI_API_KEY),
    openAiModel: readOptional(process.env.OPENAI_MODEL) ?? "gpt-5-mini",
  }
}

async function main() {
  const env = getEnv()
  const errors = []
  const warnings = []

  if (env.storageMode === "database" && !env.databaseUrl) {
    errors.push("DATABASE_URL is required when GHOSTLEDGER_STORAGE_MODE=database.")
  }

  if (env.nodeEnv === "production" && env.storageMode === "file") {
    warnings.push("Production is running in file storage mode. Use database mode for launch.")
  }

  if (!env.openAiApiKey) {
    warnings.push("OPENAI_API_KEY is missing. AI will use deterministic fallback responses.")
  }

  if (env.storageMode === "database" && env.databaseUrl) {
    let prisma

    try {
      prisma = new PrismaClient({
        datasourceUrl: env.databaseUrl,
        log: ["error"],
      })

      await prisma.$queryRawUnsafe("SELECT 1")
      console.log("PASS database connectivity")
    } catch (error) {
      errors.push(
        `Database connectivity failed: ${error instanceof Error ? error.message : "unknown error"}`
      )
    } finally {
      if (prisma) {
        await prisma.$disconnect().catch(() => {})
      }
    }
  } else {
    console.log("INFO database connectivity skipped")
  }

  console.log(`INFO storage mode: ${env.storageMode}`)
  console.log(`INFO OpenAI model: ${env.openAiModel}`)

  for (const warning of warnings) {
    console.warn(`WARN ${warning}`)
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`FAIL ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log("PASS launch preflight")
}

main().catch((error) => {
  console.error(
    `FAIL launch preflight crashed: ${error instanceof Error ? error.message : "unknown error"}`
  )
  process.exitCode = 1
})
