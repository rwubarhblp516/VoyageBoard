import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { calculateTransfers, MemberBalance } from '@/lib/settlement'
import { Loader2, CheckCircle2 } from 'lucide-react'
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="mb-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">SETTLEMENT</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">费用结算</h1>
        <p className="text-white/80 font-medium mt-2 drop-shadow-sm">清晰的收支明细，群内发红包即可。</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : settlementData ? (
        <FadeContent duration={600} className="space-y-12">
          {(() => {
            const positiveBalances = settlementData.balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)
            const negativeBalances = settlementData.balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)
            const isAllSettled = positiveBalances.length === 0 && negativeBalances.length === 0

            if (isAllSettled) {
              return (
                <div className="text-center py-20 bg-black/15 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-lg">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 text-emerald-300 drop-shadow-md" />
                  </div>
                  <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">没有任何欠款！</h3>
                  <p className="text-white/80 font-medium text-sm drop-shadow-sm">目前账目完全平衡，不需要发红包转账。</p>
                </div>
              )
            }

            return (
              <>
                {/* 应收名单 */}
                {positiveBalances.length > 0 && (
                  <section>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-emerald-400 rounded-full"></span>
                      谁需要收钱 (应收)
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {positiveBalances.map((b) => (
                        <div key={b.memberId} className="bg-white/5 border border-emerald-400/20 p-6 rounded-[24px] flex items-center justify-between">
                          <p className="text-white font-bold text-2xl">{b.displayName}</p>
                          <div className="text-right flex items-baseline gap-1">
                            <span className="text-emerald-400 font-bold text-sm mr-1">应收</span>
                            <p className="text-3xl sm:text-4xl font-mono font-black tracking-tighter text-emerald-400">
                              {(b.balance / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-emerald-400/60 font-bold uppercase ml-1">{currentTrip?.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 应付名单 */}
                {negativeBalances.length > 0 && (
                  <section>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-rose-400 rounded-full"></span>
                      谁需要出钱 (应付)
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {negativeBalances.map((b) => (
                        <div key={b.memberId} className="bg-white/5 border border-rose-400/20 p-6 rounded-[24px] flex items-center justify-between">
                          <p className="text-white font-bold text-2xl">{b.displayName}</p>
                          <div className="text-right flex items-baseline gap-1">
                            <span className="text-rose-400 font-bold text-sm mr-1">需付</span>
                            <p className="text-3xl sm:text-4xl font-mono font-black tracking-tighter text-rose-400">
                              {Math.abs(b.balance / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-rose-400/60 font-bold uppercase ml-1">{currentTrip?.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )
          })()}
        </FadeContent>
      ) : (
        <div className="text-center py-32 bg-black/10 backdrop-blur-xl rounded-[40px] border-dashed border-2 border-white/10 shadow-lg">
          <p className="text-white/80 font-medium drop-shadow-sm">暂无结算数据。</p>
        </div>
      )}
    </div>
  )
}
