export interface MemberBalance {
  memberId: string
  displayName: string
  balance: number // in cents. > 0 means應收錢, < 0 means應付錢
}

export interface Transfer {
  fromMemberId: string
  fromDisplayName: string
  toMemberId: string
  toDisplayName: string
  amount: number // in cents
}

/**
 * Calculates optimal transfers to settle all balances with minimum transactions.
 */
export function calculateTransfers(balances: MemberBalance[]): Transfer[] {
  const creditors = balances
    .filter(x => x.balance > 0)
    .sort((a, b) => b.balance - a.balance)

  const debtors = balances
    .filter(x => x.balance < 0)
    .map(x => ({ ...x, balance: Math.abs(x.balance) }))
    .sort((a, b) => b.balance - a.balance)

  const transfers: Transfer[] = []

  let i = 0 // debtor index
  let j = 0 // creditor index

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].balance, creditors[j].balance)

    if (amount > 0) {
      transfers.push({
        fromMemberId: debtors[i].memberId,
        fromDisplayName: debtors[i].displayName,
        toMemberId: creditors[j].memberId,
        toDisplayName: creditors[j].displayName,
        amount
      })
    }

    debtors[i].balance -= amount
    creditors[j].balance -= amount

    if (debtors[i].balance === 0) i++
    if (creditors[j].balance === 0) j++
  }

  return transfers
}
