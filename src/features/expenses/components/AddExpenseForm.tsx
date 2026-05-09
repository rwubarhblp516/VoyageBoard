import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { ExpenseCategory } from '@/types/expense'
import { TripMember } from '@/types/trip'

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be positive'),
  category: z.string(),
  payer_member_id: z.string(),
  expense_date: z.string(),
  participant_ids: z.array(z.string()).min(1, 'At least one participant required'),
})

type ExpenseForm = z.infer<typeof expenseSchema>

interface AddExpenseFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddExpenseForm({ onClose, onSuccess }: AddExpenseFormProps) {
  const { user } = useAuthStore()
  const { currentTrip } = useTripStore()

  const { data: members } = useQuery<TripMember[]>({
    queryKey: ['members', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', currentTrip.id)
      if (error) throw error
      return data as TripMember[]
    },
    enabled: !!currentTrip,
  })

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    values: {
      title: '',
      amount: '',
      category: 'other',
      payer_member_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      participant_ids: members?.map(m => m.id) || [],
    }
  })

  const selectedParticipants = watch('participant_ids') || []

  const onSubmit = async (values: ExpenseForm) => {
    if (!currentTrip || !user) return

    try {
      const amountInCents = Math.round(Number(values.amount) * 100)
      
      // 1. Create Expense
      const { data: expense, error: expError } = await supabase
        .from('expenses')
        .insert({
          trip_id: currentTrip.id,
          title: values.title,
          amount: amountInCents,
          category: values.category as ExpenseCategory,
          payer_member_id: values.payer_member_id,
          expense_date: values.expense_date,
          created_by: user.id,
        })
        .select()
        .single()

      if (expError) throw expError

      // 2. Create Participants (Equal split for MVP)
      const shareAmount = Math.floor(amountInCents / values.participant_ids.length)
      const remainder = amountInCents % values.participant_ids.length

      const participants = values.participant_ids.map((memberId, index) => ({
        expense_id: expense.id,
        member_id: memberId,
        share_type: 'equal',
        calculated_amount: shareAmount + (index === 0 ? remainder : 0) // First one takes the remainder
      }))

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(participants)

      if (partError) throw partError

      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const categories: { label: string, value: ExpenseCategory }[] = [
    { label: '餐饮', value: 'food' },
    { label: '住宿', value: 'hotel' },
    { label: '加油', value: 'gas' },
    { label: '停车', value: 'parking' },
    { label: '过路费', value: 'toll' },
    { label: '门票', value: 'ticket' },
    { label: '购物', value: 'shopping' },
    { label: '租车', value: 'car_rental' },
    { label: '娱乐', value: 'entertainment' },
    { label: '其他', value: 'other' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-strong rounded-t-3xl sm:rounded-3xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300 border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">记录支出</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">金额</label>
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="glass-input w-full text-2xl font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">支出项</label>
              <input
                {...register('title')}
                placeholder="如：海鲜大餐"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">分类</label>
            <select
              {...register('category')}
              className="glass-input w-full appearance-none"
            >
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">付款人</label>
            <select
              {...register('payer_member_id')}
              className="glass-input w-full appearance-none"
            >
              <option value="">请选择付款人</option>
              {members?.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">参与成员 (平摊)</label>
            <div className="grid grid-cols-2 gap-2">
              {members?.map(m => (
                <label key={m.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedParticipants.includes(m.id) 
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                    : 'bg-slate-900/50 border-white/5 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    value={m.id}
                    checked={selectedParticipants.includes(m.id)}
                    onChange={(e) => {
                      const ids = e.target.checked 
                        ? [...selectedParticipants, m.id]
                        : selectedParticipants.filter(id => id !== m.id)
                      setValue('participant_ids', ids)
                    }}
                    className="hidden"
                  />
                  <span className="text-sm font-semibold truncate">{m.display_name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-4"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : '保存账单'}
          </button>
        </form>
      </div>
    </div>
  )
}
