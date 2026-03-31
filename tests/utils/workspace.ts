import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export async function withTemporaryWorkspace<T>(run: () => Promise<T>) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "ghostledger-tests-"))
  const originalDataDir = process.env.GHOSTLEDGER_DATA_DIR

  process.env.GHOSTLEDGER_DATA_DIR = tempDir

  try {
    return await run()
  } finally {
    if (originalDataDir) {
      process.env.GHOSTLEDGER_DATA_DIR = originalDataDir
    } else {
      delete process.env.GHOSTLEDGER_DATA_DIR
    }
    await rm(tempDir, { recursive: true, force: true })
  }
}
