import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db/client"
import { getAllBillingPlans } from "@/lib/billing/store"
import { validateAppEnv } from "@/lib/security/env"

export async function GET() {
  const result = validateAppEnv()
  let database = result.env.storageMode === "database" ? "unknown" : "not-required"
  let databaseError: string | null = null

  if (result.env.storageMode === "database" && result.isValid) {
    try {
      const prisma = getPrismaClient()
      await prisma.$queryRawUnsafe("SELECT 1")
      database = "ok"
    } catch (error) {
      database = "error"
      databaseError =
        error instanceof Error ? error.message : "Database connectivity check failed."
    }
  }

  const status =
    result.isValid && database !== "error"
      ? result.warnings.length > 0
        ? "degraded"
        : "ok"
      : "degraded"

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        environment: result.isValid ? "ok" : "error",
        database,
        storageMode: result.env.storageMode,
        aiConfigured: Boolean(result.env.openAiApiKey),
        billingPlansLoaded: getAllBillingPlans().length > 0,
      },
      issues: [...result.issues, ...(databaseError ? [databaseError] : [])],
      warnings: result.warnings,
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
