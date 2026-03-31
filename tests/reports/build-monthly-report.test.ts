import { describe, expect, it } from "vitest"
import { buildMonthlyReport } from "../../lib/reports/build-monthly-report"
import { mockGroup } from "../../lib/mock-data"

describe("buildMonthlyReport", () => {
  it("builds a scoped monthly report from matching transactions", () => {
    const report = buildMonthlyReport(mockGroup, "2024-03")

    expect(report.month).toBe("2024-03")
    expect(report.totals.transactions).toBeGreaterThan(0)
    expect(report.totals.expenses).toBeGreaterThan(0)
    expect(report.highlights).toHaveLength(3)
  })
})
