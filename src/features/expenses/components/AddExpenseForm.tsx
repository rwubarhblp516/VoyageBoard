import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'
import { TripMember } from '@/types/trip'
import AppleSelect from '@/components/AppleSelect'

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be positive'),
  category: z.string(),
  payer_member_id: z.string().min(1, 'Please select a payer'),
  expense_date: z.string(),
  participant_ids: z.array(z.string()).min(1, 'At least one participant required'),
  split_type: z.enum(['equal', 'individual']),
})

type ExpenseForm = z.infer<typeof expenseSchema>

interface AddExpenseFormProps {
  onClose: () => void
  onSuccess: () => void
  editingExpense?: any
}

export default function AddExpenseForm({ onClose, onSuccess, editingExpense }: AddExpenseFormProps) {
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

  const currentMemberId = members?.find(m => m.user_id === user?.id)?.id || ''

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    values: {
      title: editingExpense?.title || '',
      amount: editingExpense ? (Number(editingExpense.amount) / 100).toString() : '',
      category: editingExpense?.category ? (['food','hotel','transport','flight','train','car_rental','ticket','shopping','entertainment','grocery','other'].includes(editingExpense.category) ? editingExpense.category : 'other') : 'other',
      payer_member_id: editingExpense?.payer_member_id || currentMemberId,
      expense_date: editingExpense?.expense_date || new Date().toISOString().split('T')[0],
      participant_ids: editingExpense?.participants?.map((p: any) => p.member_id) || members?.map(m => m.id) || [],
      split_type: editingExpense?.participants?.length === 1 && editingExpense.participants[0].member_id === editingExpense.payer_member_id ? 'individual' : 'equal',
    }
  })

  const selectedParticipants = watch('participant_ids') || []
  const splitType = watch('split_type')
  const payerId = watch('payer_member_id')
  const categoryId = watch('category')

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [payerOpen, setPayerOpen] = useState(false)
  const [customCategoryText, setCustomCategoryText] = useState(() => {
    if (editingExpense && !['food','hotel','transport','flight','train','car_rental','ticket','shopping','entertainment','grocery','other'].includes(editingExpense.category)) {
      return editingExpense.category
    }
    return ''
  })

  // Handle Split Type changes
  const handleSplitTypeChange = (type: 'equal' | 'individual') => {
    setValue('split_type', type)
    if (type === 'individual') {
      const individualPayerId = payerId || currentMemberId
      if (individualPayerId) {
        setValue('payer_member_id', individualPayerId)
        setValue('participant_ids', [individualPayerId])
      } else {
        setValue('participant_ids', [])
      }
    } else if (type === 'equal') {
      setValue('participant_ids', members?.map(m => m.id) || [])
    }
  }

  const handlePayerChange = (memberId: string) => {
    setValue('payer_member_id', memberId)
    if (splitType === 'individual') {
      setValue('participant_ids', [memberId])
    }
  }

  const onSubmit = async (values: ExpenseForm) => {
    if (!currentTrip || !user) return

    try {
      const amountInCents = Math.round(Number(values.amount) * 100)
      
      let expenseId = editingExpense?.id

      if (editingExpense) {
        // Update Expense
        const { error: expError } = await supabase
          .from('expenses')
          .update({
            title: values.title,
            amount: amountInCents,
            category: values.category === 'other' && customCategoryText.trim() ? customCategoryText.trim() : values.category,
            payer_member_id: values.payer_member_id,
            expense_date: values.expense_date,
          })
          .eq('id', editingExpense.id)

        if (expError) throw expError

        // Delete old participants
        await supabase.from('expense_participants').delete().eq('expense_id', expenseId)
      } else {
        // Create Expense
        const { data: expense, error: expError } = await supabase
          .from('expenses')
          .insert({
            trip_id: currentTrip.id,
            title: values.title,
            amount: amountInCents,
            category: values.category === 'other' && customCategoryText.trim() ? customCategoryText.trim() : values.category,
            payer_member_id: values.payer_member_id,
            expense_date: values.expense_date,
            created_by: user.id,
          })
          .select()
          .single()

        if (expError) throw expError
        expenseId = expense.id
      }

      // 2. Create Participants
      const shareAmount = Math.floor(amountInCents / values.participant_ids.length)
      const remainder = amountInCents % values.participant_ids.length

      const participants = values.participant_ids.map((memberId, index) => ({
        expense_id: expenseId,
        member_id: memberId,
        share_type: 'equal',
        calculated_amount: shareAmount + (index === 0 ? remainder : 0)
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

  const categories: { label: string, value: string }[] = [
    { label: '餐饮', value: 'food' },
    { label: '住宿', value: 'hotel' },
    { label: '交通', value: 'transport' },
    { label: '机票', value: 'flight' },
    { label: '火车/高铁', value: 'train' },
    { label: '打车/租车', value: 'car_rental' },
    { label: '门票', value: 'ticket' },
    { label: '购物', value: 'shopping' },
    { label: '娱乐', value: 'entertainment' },
    { label: '杂货/超市', value: 'grocery' },
    { label: '其他', value: 'other' },
  ]

  const payerOptions = members?.map(m => ({ label: m.display_name, value: m.id })) || []

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg glass-strong rounded-[40px] p-6 sm:p-8 shadow-[0_32px_80px_-12px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 duration-500 border border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar pb-24 sm:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-sub uppercase tracking-[0.3em]">{editingExpense ? '修改支出' : '新增支出'}</span>
            <h2 className="text-3xl font-black text-white tracking-tight">{editingExpense ? '编辑账单' : '记录支出'}</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5">
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">金额</label>
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-mono text-2xl font-bold tracking-tight shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">支出项</label>
              <input
                {...register('title')}
                placeholder="如：海鲜大餐"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-base font-medium shadow-inner h-[66px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">分类</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(true)}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-4 py-4 text-white transition-all text-base font-medium"
                >
                  <span>{categoryId === 'other' && customCategoryText ? customCategoryText : (categories.find(c => c.value === categoryId)?.label || '选择分类')}</span>
                  <ChevronDown className="w-4 h-4 text-text-sub" />
                </button>
              </div>
              
              {/* Custom Category Input */}
              {categoryId === 'other' && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-2">
                  <input
                    type="text"
                    value={customCategoryText}
                    onChange={(e) => setCustomCategoryText(e.target.value)}
                    placeholder="输入自定义分类名称..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm font-medium shadow-inner"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">付款人</label>
              <button
                type="button"
                onClick={() => setPayerOpen(true)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-4 py-4 text-white transition-all text-base font-medium"
              >
                <span className="truncate pr-2">{members?.find(m => m.id === payerId)?.display_name || '选择付款人'}</span>
                <ChevronDown className="w-4 h-4 text-text-sub shrink-0" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">分摊模式</label>
            </div>
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => handleSplitTypeChange('equal')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                  splitType === 'equal' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                    : 'text-text-sub hover:text-white'
                }`}
              >
                AA 平摊
              </button>
              <button
                type="button"
                onClick={() => handleSplitTypeChange('individual')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                  splitType === 'individual' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                    : 'text-text-sub hover:text-white'
                }`}
              >
                个人支付
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2 pl-1">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest">参与成员</label>
              {splitType === 'individual' && (
                <span className="text-[9px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/5">模式锁定</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {members?.map(m => (
                <label 
                  key={m.id} 
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    splitType === 'individual' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'
                  } ${
                    selectedParticipants.includes(m.id) 
                      ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                      : 'bg-white/5 border-transparent text-text-sub'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={m.id}
                    disabled={splitType === 'individual'}
                    checked={selectedParticipants.includes(m.id)}
                    onChange={(e) => {
                      const ids = e.target.checked 
                        ? [...selectedParticipants, m.id]
                        : selectedParticipants.filter(id => id !== m.id)
                      setValue('participant_ids', ids)
                    }}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    selectedParticipants.includes(m.id) ? 'bg-white border-white' : 'border-white/20'
                  }`}>
                    {selectedParticipants.includes(m.id) && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-sm font-semibold truncate">{m.display_name}</span>
                </label>
              ))}
            </div>
            {errors.participant_ids && <p className="text-red-400 text-[10px] mt-2 font-bold uppercase tracking-widest pl-1">{errors.participant_ids.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 mt-8 text-base tracking-widest uppercase"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin text-black/50" /> : '保存账单'}
          </button>
        </form>

        <AppleSelect
          isOpen={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          options={categories}
          value={categoryId}
          onChange={(val) => setValue('category', val)}
          title="选择支出分类"
        />

        <AppleSelect
          isOpen={payerOpen}
          onClose={() => setPayerOpen(false)}
          options={payerOptions}
          value={payerId}
          onChange={handlePayerChange}
          title="选择付款人"
        />
      </div>
    </div>
  )
}
