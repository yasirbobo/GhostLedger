const fs = require("node:fs/promises")
const path = require("node:path")
const {
  PrismaClient,
  TransactionType,
  InviteStatus,
  RecurringFrequency,
} = require("@prisma/client")

const prisma = new PrismaClient()

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8")
  return JSON.parse(content)
}

async function main() {
  const authPath = path.join(process.cwd(), "data", "auth.json")
  const groupsPath = path.join(process.cwd(), "data", "groups.json")
  const notificationsPath = path.join(process.cwd(), "data", "notifications.json")
  const billingPath = path.join(process.cwd(), "data", "billing.json")
  const outboxPath = path.join(process.cwd(), "data", "email-outbox.json")

  const authStore = await readJson(authPath)
  const groupStore = await readJson(groupsPath)
  let notificationStore = { preferencesByEmail: {} }
  let billingStore = { groups: {} }
  let outboxStore = { messages: [] }

  try {
    notificationStore = await readJson(notificationsPath)
  } catch {
    // Notifications are optional in older workspaces.
  }

  try {
    billingStore = await readJson(billingPath)
  } catch {
    // Billing records are optional in older workspaces.
  }

  try {
    outboxStore = await readJson(outboxPath)
  } catch {
    // Local outbox is optional in older workspaces.
  }

  const usersById = new Map()

  for (const user of authStore.users) {
    const created = await prisma.user.upsert({
      where: { email: normalizeEmail(user.email) },
      update: {
        name: user.name,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
      },
      create: {
        id: user.id,
        name: user.name,
        email: normalizeEmail(user.email),
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
      },
    })

    usersById.set(created.id, created)
  }

  for (const session of authStore.sessions) {
    await prisma.session.upsert({
      where: { token: session.id },
      update: {
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt ?? session.createdAt),
      },
      create: {
        token: session.id,
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt ?? session.createdAt),
      },
    })
  }

  for (const [email, preferences] of Object.entries(notificationStore.preferencesByEmail ?? {})) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    })

    if (!user) {
      continue
    }

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        monthlySummary: Boolean(preferences.monthlySummary),
        budgetAlerts: Boolean(preferences.budgetAlerts),
        recurringReminders: Boolean(preferences.recurringReminders),
        inviteUpdates: Boolean(preferences.inviteUpdates),
      },
      create: {
        userId: user.id,
        monthlySummary: Boolean(preferences.monthlySummary),
        budgetAlerts: Boolean(preferences.budgetAlerts),
        recurringReminders: Boolean(preferences.recurringReminders),
        inviteUpdates: Boolean(preferences.inviteUpdates),
      },
    })
  }

  for (const group of Object.values(groupStore.groups)) {
    let owner = null

    if (group.ownerEmail) {
      owner = await prisma.user.findUnique({
        where: { email: normalizeEmail(group.ownerEmail) },
      })
    }

    if (!owner) {
      owner = await prisma.user.upsert({
        where: { email: `owner+${group.id}@ghostledger.local` },
        update: {
          name: `${group.name} Owner`,
          passwordHash: "seeded-no-login",
          passwordSalt: "seeded-no-login",
        },
        create: {
          id: `seed-owner-${group.id}`,
          name: `${group.name} Owner`,
          email: `owner+${group.id}@ghostledger.local`,
          passwordHash: "seeded-no-login",
          passwordSalt: "seeded-no-login",
        },
      })
    }

    await prisma.group.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        budgetMonthly: Number(group.budgetMonthly ?? 0),
        totalBalance: Number(group.totalBalance ?? 0),
        ownerId: owner.id,
      },
      create: {
        id: group.id,
        name: group.name,
        budgetMonthly: Number(group.budgetMonthly ?? 0),
        totalBalance: Number(group.totalBalance ?? 0),
        ownerId: owner.id,
      },
    })

    const membersByLegacyId = new Map()

    for (const member of group.members) {
      const memberEmail = group.memberEmails?.find(
        (email) => normalizeEmail(email).split("@")[0] === member.name.toLowerCase().split(" ")[0]
      )

      const createdMember = await prisma.groupMember.upsert({
        where: { id: member.id },
        update: {
          groupId: group.id,
          email: memberEmail ? normalizeEmail(memberEmail) : null,
          displayName: member.name,
          avatar: member.avatar,
          walletAddress: member.walletAddress,
          contribution: Number(member.contribution ?? 0),
        },
        create: {
          id: member.id,
          groupId: group.id,
          email: memberEmail ? normalizeEmail(memberEmail) : null,
          displayName: member.name,
          avatar: member.avatar,
          walletAddress: member.walletAddress,
          contribution: Number(member.contribution ?? 0),
        },
      })

      membersByLegacyId.set(member.id, createdMember)
    }

    for (const email of group.memberEmails ?? []) {
      const normalizedEmail = normalizeEmail(email)
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

      if (!user) {
        continue
      }

      const existingMember = await prisma.groupMember.findFirst({
        where: {
          groupId: group.id,
          email: normalizedEmail,
        },
      })

      if (existingMember) {
        await prisma.groupMember.update({
          where: { id: existingMember.id },
          data: {
            userId: user.id,
          },
        })
        continue
      }

      await prisma.groupMember.create({
        data: {
          id: `membership-${group.id}-${user.id}`,
          groupId: group.id,
          userId: user.id,
          email: normalizedEmail,
          displayName: user.name,
          avatar: user.name
            .split(" ")
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          walletAddress: `0xTEAM${Math.random().toString(16).slice(2, 10).toUpperCase()}SAFE`,
          contribution: 0,
          role: normalizedEmail === normalizeEmail(owner.email) ? "owner" : "member",
        },
      })
    }

    for (const transaction of group.transactions) {
      const member = membersByLegacyId.get(transaction.memberId)
      if (!member) {
        continue
      }

      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: {
          groupId: group.id,
          memberId: member.id,
          description: transaction.description,
          amount: Number(transaction.amount ?? 0),
          type: transaction.type === "contribution" ? TransactionType.contribution : TransactionType.expense,
          category: transaction.category,
          isPrivate: transaction.isPrivate,
          encryptedValue: transaction.encryptedValue ?? null,
          transactionAt: new Date(transaction.date),
        },
        create: {
          id: transaction.id,
          groupId: group.id,
          memberId: member.id,
          description: transaction.description,
          amount: Number(transaction.amount ?? 0),
          type: transaction.type === "contribution" ? TransactionType.contribution : TransactionType.expense,
          category: transaction.category,
          isPrivate: transaction.isPrivate,
          encryptedValue: transaction.encryptedValue ?? null,
          transactionAt: new Date(transaction.date),
        },
      })
    }

    for (const plan of group.recurringTransactions ?? []) {
      const member = membersByLegacyId.get(plan.memberId)
      if (!member) {
        continue
      }

      await prisma.recurringTransactionPlan.upsert({
        where: { id: plan.id },
        update: {
          groupId: group.id,
          memberId: member.id,
          description: plan.description,
          amount: Number(plan.amount ?? 0),
          type:
            plan.type === "contribution"
              ? TransactionType.contribution
              : TransactionType.expense,
          category: plan.category,
          isPrivate: Boolean(plan.isPrivate),
          encryptedValue: plan.encryptedValue ?? null,
          frequency:
            plan.frequency === "weekly"
              ? RecurringFrequency.weekly
              : RecurringFrequency.monthly,
          nextRunDate: new Date(`${plan.nextRunDate}T00:00:00.000Z`),
          active: plan.active !== false,
        },
        create: {
          id: plan.id,
          groupId: group.id,
          memberId: member.id,
          description: plan.description,
          amount: Number(plan.amount ?? 0),
          type:
            plan.type === "contribution"
              ? TransactionType.contribution
              : TransactionType.expense,
          category: plan.category,
          isPrivate: Boolean(plan.isPrivate),
          encryptedValue: plan.encryptedValue ?? null,
          frequency:
            plan.frequency === "weekly"
              ? RecurringFrequency.weekly
              : RecurringFrequency.monthly,
          nextRunDate: new Date(`${plan.nextRunDate}T00:00:00.000Z`),
          active: plan.active !== false,
        },
      })
    }

    for (const email of group.memberEmails ?? []) {
      const normalizedEmail = normalizeEmail(email)
      if (normalizedEmail === normalizeEmail(owner.email)) {
        continue
      }

      await prisma.groupInvite.upsert({
        where: {
          token: `${group.id}:${normalizedEmail}`,
        },
        update: {
          status: InviteStatus.accepted,
          role: "member",
          invitedById: owner.id,
          acceptedById: (
            await prisma.user.findUnique({ where: { email: normalizedEmail } })
          )?.id ?? null,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
        create: {
          groupId: group.id,
          email: normalizedEmail,
          token: `${group.id}:${normalizedEmail}`,
          status: InviteStatus.accepted,
          role: "member",
          invitedById: owner.id,
          acceptedById: (
            await prisma.user.findUnique({ where: { email: normalizedEmail } })
          )?.id ?? null,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      })
    }

    const billingRecord = billingStore.groups?.[group.id]
    if (billingRecord) {
      await prisma.billingSubscription.upsert({
        where: { groupId: group.id },
        update: {
          plan: billingRecord.plan,
          status: billingRecord.status,
          renewalDate: new Date(`${billingRecord.renewalDate}T00:00:00.000Z`),
        },
        create: {
          groupId: group.id,
          plan: billingRecord.plan,
          status: billingRecord.status,
          renewalDate: new Date(`${billingRecord.renewalDate}T00:00:00.000Z`),
        },
      })
    }
  }

  for (const message of outboxStore.messages ?? []) {
    await prisma.emailOutboxMessage.upsert({
      where: { id: message.id },
      update: {
        to: normalizeEmail(message.to),
        subject: message.subject,
        body: message.body,
        createdAt: new Date(message.createdAt),
      },
      create: {
        id: message.id,
        to: normalizeEmail(message.to),
        subject: message.subject,
        body: message.body,
        createdAt: new Date(message.createdAt),
      },
    })
  }

  console.log("Seed completed from JSON stores.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
