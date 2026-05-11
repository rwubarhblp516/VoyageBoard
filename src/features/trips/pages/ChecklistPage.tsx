import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Plus, Loader2, Trash2, Edit2, ListTodo, CheckCircle2, Circle, Users2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TripMember } from '@/types/trip'

export default function ChecklistPage() {
  const { currentTrip } = useTripStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [newItemTitle, setNewItemTitle] = useState('')
  const [activeCategory, setActiveCategory] = useState<'public' | 'personal'>('public')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // 获取当前用户在这个旅程中的 member_id
  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', currentTrip?.id, user?.id],
    queryFn: async () => {
      if (!currentTrip || !user) return null
      const { data } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', currentTrip.id)
        .eq('user_id', user.id)
        .single()
      return data
    },
    enabled: !!currentTrip && !!user
  })

  const { data: members } = useQuery<TripMember[]>({
    queryKey: ['members', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', currentTrip.id)
        .order('joined_at', { ascending: true })
      if (error) throw error
      return data as TripMember[]
    },
    enabled: !!currentTrip,
  })

  const { data: personalShares } = useQuery({
    queryKey: ['personalChecklistShares', currentTrip?.id, currentMember?.id],
    queryFn: async () => {
      if (!currentTrip || !currentMember) return []
      const { data, error } = await (supabase as any)
        .from('trip_personal_checklist_shares')
        .select('*, shared_member:trip_members!trip_personal_checklist_shares_shared_member_id_fkey(id, display_name, avatar_url)')
        .eq('trip_id', currentTrip.id)
        .eq('owner_member_id', currentMember.id)
      if (error) throw error
      return data as any[]
    },
    enabled: !!currentTrip && !!currentMember,
  })

  // 获取清单列表
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklists', currentTrip?.id, activeCategory, currentMember?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      let query = supabase
        .from('trip_checklists')
        .select('*, completed_by:trip_members!trip_checklists_completed_by_member_id_fkey(display_name), owner:trip_members!trip_checklists_created_by_member_id_fkey(display_name)')
        .eq('trip_id', currentTrip.id)
        .eq('category', activeCategory)

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data as any[]
    },
    enabled: !!currentTrip && (activeCategory === 'public' || !!currentMember),
    retry: false
  })

  const sharedMemberIds = new Set((personalShares || []).map((share) => share.shared_member_id))
  const shareableMembers = (members || []).filter((member) => member.id !== currentMember?.id)

  const handleToggleShare = async (memberId: string) => {
    if (!currentTrip || !currentMember) return

    const isShared = sharedMemberIds.has(memberId)
    const request = isShared
      ? (supabase as any)
          .from('trip_personal_checklist_shares')
          .delete()
          .eq('trip_id', currentTrip.id)
          .eq('owner_member_id', currentMember.id)
          .eq('shared_member_id', memberId)
      : (supabase as any)
          .from('trip_personal_checklist_shares')
          .insert({
            trip_id: currentTrip.id,
            owner_member_id: currentMember.id,
            shared_member_id: memberId,
          })

    const { error } = await request
    if (error) {
      alert(error.message)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['personalChecklistShares', currentTrip.id, currentMember.id] })
  }

  // 添加新清单
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim() || !currentTrip) return
    if (activeCategory === 'personal' && !currentMember) {
      alert("您不在该旅程成员中，无法添加个人清单")
      return
    }
    
    const { error } = await supabase.from('trip_checklists').insert({
      trip_id: currentTrip.id,
      title: newItemTitle.trim(),
      category: activeCategory,
      created_by_member_id: currentMember?.id
    })
    
    if (error) {
      alert(error.message)
    } else {
      setNewItemTitle('')
      queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip.id, activeCategory] })
    }
  }

  // 切换确认状态
  const handleToggle = async (item: any) => {
    if (!currentMember) {
      alert("您不在该旅程成员中，无法操作")
      return
    }
    const isCompleted = !item.is_completed
    const { error } = await supabase.from('trip_checklists').update({
      is_completed: isCompleted,
      completed_by_member_id: isCompleted ? currentMember.id : null
    }).eq('id', item.id)

    if (error) alert(error.message)
    else queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id, activeCategory] })
  }

  // 删除清单
  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除此项吗？')) return
    const { error } = await supabase.from('trip_checklists').delete().eq('id', id)
    if (error) alert(error.message)
    else queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id, activeCategory] })
  }

  // 启动编辑
  const startEdit = (item: any) => {
    setEditingId(item.id)
    setEditTitle(item.title)
  }

  // 保存编辑
  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }
    const { error } = await supabase.from('trip_checklists').update({
      title: editTitle.trim()
    }).eq('id', id)

    if (error) alert(error.message)
    else {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id, activeCategory] })
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="mb-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">CHECKLIST</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">行前清单</h1>
        <p className="text-white/80 font-medium mt-2 drop-shadow-sm">打点好一切，开启无忧旅程。</p>
      </header>

      {/* 分类切换器 */}
      <div className="flex p-1.5 bg-black/20 backdrop-blur-md rounded-[22px] mb-8 w-fit mx-auto border border-white/10 shadow-lg overflow-hidden relative">
        <motion.div
          className="absolute left-1.5 inset-y-1.5 bg-white rounded-[16px] shadow-xl"
          initial={false}
          animate={{
            x: activeCategory === 'public' ? 0 : '100%',
          }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          style={{ width: 'calc(50% - 6px)' }}
        />
        <button
          onClick={() => setActiveCategory('public')}
          className={`relative z-10 w-32 py-2.5 rounded-[16px] text-sm font-black transition-colors duration-500 flex items-center justify-center gap-2 ${
            activeCategory === 'public' ? 'text-black' : 'text-white/50 hover:text-white'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'public' ? 'bg-black' : 'bg-white/30'}`} />
          公开清单
        </button>
        <button
          onClick={() => setActiveCategory('personal')}
          className={`relative z-10 w-32 py-2.5 rounded-[16px] text-sm font-black transition-colors duration-500 flex items-center justify-center gap-2 ${
            activeCategory === 'personal' ? 'text-black' : 'text-white/50 hover:text-white'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'personal' ? 'bg-black' : 'bg-white/30'}`} />
          个人清单
        </button>
      </div>

      {/* 添加表单 */}
      <form onSubmit={handleAdd} className="mb-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <ListTodo className="h-5 w-5 text-white/40" />
        </div>
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="添加一个新的待办/准备事项..."
          className="w-full bg-black/20 backdrop-blur-md border border-white/20 hover:border-white/30 focus:border-white/50 rounded-3xl pl-14 pr-16 py-5 text-white focus:outline-none transition-all font-bold placeholder:text-white/60 shadow-lg"
        />
        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-0 disabled:pointer-events-none transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {activeCategory === 'personal' && currentMember && (
        <div className="mb-8 glass-card p-5 sm:p-6 rounded-[28px] border border-white/10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg tracking-tight">共享个人清单</h2>
                <p className="text-white/60 text-xs font-bold mt-1">允许指定伙伴查看并确认你的个人准备项。</p>
              </div>
            </div>
            <span className="text-[10px] font-black bg-white/10 text-white px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 w-fit">
              {sharedMemberIds.size} 人可见
            </span>
          </div>

          {shareableMembers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {shareableMembers.map((member) => {
                const isShared = sharedMemberIds.has(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleToggleShare(member.id)}
                    className={`group/member flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-all active:scale-95 ${
                      isShared
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isShared ? 'bg-black text-white border-black' : 'border-white/20 text-transparent group-hover/member:text-white/50'
                    }`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-black tracking-wide">{member.display_name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-white/50 text-sm font-medium">暂无可共享的同行成员。</p>
          )}
        </div>
      )}

      {/* 列表内容 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : checklists && checklists.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {checklists.map((item) => (
              (() => {
                const isOwnPersonalItem = activeCategory === 'personal' && item.created_by_member_id === currentMember?.id
                const canManageItem = activeCategory === 'public' || isOwnPersonalItem

                return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                key={item.id}
                className={`glass-card p-4 sm:p-5 rounded-[24px] border transition-all duration-300 flex items-center gap-4 group shadow-md ${
                  item.is_completed ? 'bg-black/10 backdrop-blur-sm border-white/5 opacity-70' : 'bg-black/30 backdrop-blur-md border-white/20 hover:border-white/30'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(item)}
                  className="shrink-0 focus:outline-none"
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-7 h-7 text-white/80" />
                  ) : (
                    <Circle className="w-7 h-7 text-white/20 group-hover:text-white/40 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(item.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                      className="flex-1 bg-black/40 border border-[#0A84FF]/50 rounded-xl px-3 py-2 text-white focus:outline-none font-medium"
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <span className={`block font-medium truncate text-lg transition-all ${
                        item.is_completed ? 'text-white/40 line-through' : 'text-white'
                      }`}>
                        {item.title}
                      </span>
                    </div>
                  )}

                  {/* 确认人标签 */}
                  {item.is_completed && item.completed_by && (
                    <span className="shrink-0 text-[10px] font-black bg-emerald-500/80 text-white px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-400/30 shadow-md drop-shadow-sm">
                      {item.completed_by.display_name}
                    </span>
                  )}

                  {activeCategory === 'personal' && !isOwnPersonalItem && item.owner && (
                    <span className="shrink-0 text-[10px] font-black bg-white/10 text-white/70 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 shadow-md drop-shadow-sm">
                      来自 {item.owner.display_name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {canManageItem && (
                  <div className="shrink-0 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {editingId !== item.id && (
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
                )
              })()
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-32 bg-black/15 backdrop-blur-xl rounded-[40px] border-dashed border-2 border-white/20 shadow-lg">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
            <ListTodo className="w-8 h-8 text-white/60 drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">
            {activeCategory === 'public' ? '一切准备就绪？' : '准备好出发了？'}
          </h3>
          <p className="text-white/80 font-medium text-sm drop-shadow-sm">
            {activeCategory === 'public' 
              ? '开始添加你们的行前待办清单吧。' 
              : '记录下个人准备事项，也可以共享给室友或同行伙伴。'}
          </p>
        </div>
      )}
    </div>
  )
}
