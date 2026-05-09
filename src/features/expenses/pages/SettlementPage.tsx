import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { calculateTransfers, MemberBalance } from '@/lib/settlement'
import { Loader2, ArrowRight } from 'lucide-react'
import FadeContent from '@/components/FadeContent'

export default function SettlementPage() {
  const { currentTrip } = useTripStore()

  const { data: settlementData, isLoading } = useQuery({
    queryKey: ['settlement', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return null
      // Fetch members
      const { data: members } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', currentTrip.id)

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', currentTrip.id)

      // Fetch all participants for these expenses
      const { data: participants } = await supabase
        .from('expense_participants')
        .select('*, expenses!inner(trip_id)')
        .eq('expenses.trip_id', currentTrip.id)

      if (!members || !expenses || !participants) return null

      // Calculate balance for each member
      const balances: MemberBalance[] = members.map(m => {
        const paidAmount = expenses
          .filter(e => e.payer_member_id === m.id)
          .reduce((sum, e) => sum + Number(e.amount), 0)

        const owedAmount = (participants as any[])
          .filter(p => p.member_id === m.id)
          .reduce((sum, p) => sum + Number(p.calculated_amount), 0)

        return {
          memberId: m.id,
          displayName: m.display_name,
          balance: paidAmount - owedAmount,
        }
      })

      const transfers = calculateTransfers(balances)

      return { balances, transfers }
    },
    enabled: !!currentTrip,
  })

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">AA 结算</h1>
        <p className="text-text-secondary mt-1">算清账目，友谊长存。</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
        </div>
      ) : settlementData ? (
        <FadeContent duration={600} className="space-y-8">
          {/* Balances Section */}
          <section>
            <h2 className="text-xs font-bold text-text-muted uppercase mb-4 tracking-widest">成员收支概览</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {settlementData.balances.map((b) => (
                <div key={b.memberId} className="glass p-5 rounded-2xl flex items-center justify-between border-none">
                  <div>
                    <p className="text-text-primary font-bold text-lg">{b.displayName}</p>
                    <p className={`text-xs font-bold uppercase mt-1 ${b.balance >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {b.balance >= 0 ? '应收' : '应付'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-mono font-bold ${b.balance >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {Math.abs(b.balance / 100).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-text-muted font-bold">{currentTrip?.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Transfers Section */}
          <section>
            <h2 className="text-xs font-bold text-text-muted uppercase mb-4 tracking-widest">建议转账方案</h2>
            {settlementData.transfers.length > 0 ? (
              <div className="space-y-4">
                {settlementData.transfers.map((t, i) => (
                  <div key={i} className="glass-strong p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-4 sm:gap-8 border-none">
                    <div className="flex-1 text-center sm:text-right">
                      <p className="text-text-muted text-xs uppercase mb-1 font-bold">付款方</p>
                      <p className="text-text-primary font-bold text-xl">{t.fromDisplayName}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-accent-primary font-mono font-bold text-2xl">
                        {(t.amount / 100).toFixed(2)} {currentTrip?.currency}
                      </p>
                      <ArrowRight className="h-6 w-6 text-accent-primary animate-pulse" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-text-muted text-xs uppercase mb-1 font-bold">收款方</p>
                      <p className="text-text-primary font-bold text-xl">{t.toDisplayName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass rounded-3xl border-none">
                <p className="text-accent-success font-bold text-lg">账目已平！无需进行转账。</p>
              </div>
            )}
          </section>
        </FadeContent>
      ) : (
        <div className="text-center py-20 glass rounded-3xl border-none">
          <p className="text-text-muted">暂无结算数据。</p>
        </div>
      )}
    </div>
  )
}
