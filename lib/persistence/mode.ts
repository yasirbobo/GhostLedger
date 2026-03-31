import { getAppEnv } from "../security/env"

export type StorageMode = "file" | "database"

export function getStorageMode(): StorageMode {
  return getAppEnv().storageMode
}

export function isDatabaseMode() {
  return getStorageMode() === "database"
}
