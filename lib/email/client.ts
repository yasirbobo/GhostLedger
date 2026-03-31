import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { getPrismaClient } from "../db/client"
import { isDatabaseMode } from "../persistence/mode"

export interface EmailMessage {
  id: string
  to: string
  subject: string
  body: string
  createdAt: string
}

interface EmailOutboxStore {
  messages: EmailMessage[]
}

const DATA_DIR = process.env.GHOSTLEDGER_DATA_DIR ?? path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "email-outbox.json")

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(STORE_PATH, "utf8")
  } catch {
    const initialStore: EmailOutboxStore = { messages: [] }
    await writeFile(STORE_PATH, JSON.stringify(initialStore, null, 2), "utf8")
  }
}

async function readStore() {
  await ensureStore()
  return JSON.parse(await readFile(STORE_PATH, "utf8")) as EmailOutboxStore
}

async function writeStore(store: EmailOutboxStore) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8")
}

export async function sendEmail(input: {
  to: string
  subject: string
  body: string
}) {
  if (isDatabaseMode()) {
    const prisma = getPrismaClient()
    const message = await prisma.emailOutboxMessage.create({
      data: {
        id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        to: input.to.trim().toLowerCase(),
        subject: input.subject,
        body: input.body,
      },
    })

    return {
      id: message.id,
      to: message.to,
      subject: message.subject,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    } satisfies EmailMessage
  }

  const store = await readStore()
  const message: EmailMessage = {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    to: input.to.trim().toLowerCase(),
    subject: input.subject,
    body: input.body,
    createdAt: new Date().toISOString(),
  }

  store.messages.unshift(message)
  await writeStore(store)

  return message
}

export async function listEmails(limit = 20) {
  if (isDatabaseMode()) {
    const prisma = getPrismaClient()
    const messages = await prisma.emailOutboxMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return messages.map((message) => ({
      id: message.id,
      to: message.to,
      subject: message.subject,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    }))
  }

  const store = await readStore()
  return store.messages.slice(0, limit)
}
