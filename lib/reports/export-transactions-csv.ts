import type { Group } from "@/lib/types"

function escapeCsvCell(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

export function buildTransactionsCsv(group: Group) {
  const rows = [
    [
      "Transaction ID",
      "Date",
      "Description",
      "Type",
      "Category",
      "Member",
      "Visibility",
      "Amount",
      "Encrypted Value",
    ],
    ...group.transactions.map((transaction) => [
      transaction.id,
      transaction.date,
      transaction.description,
      transaction.type,
      transaction.category,
      transaction.memberName,
      transaction.isPrivate ? "private" : "public",
      transaction.amount.toFixed(2),
      transaction.encryptedValue ?? "",
    ]),
  ]

  return rows
    .map((row) => row.map((value) => escapeCsvCell(String(value))).join(","))
    .join("\n")
}
