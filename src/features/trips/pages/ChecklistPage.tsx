import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Plus, Loader2, Trash2, Edit2, ListTodo, CheckCircle2, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChecklistPage() {
  const { currentTrip } = useTripStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [newItemTitle, setNewItemTitle] = useState('')
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

  // 获取清单列表
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklists', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_checklists')
        .select('*, completed_by:trip_members(display_name)')
        .eq('trip_id', currentTrip.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as any[]
    },
    enabled: !!currentTrip
  })

  // 添加新清单
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim() || !currentTrip) return
    
    const { error } = await supabase.from('trip_checklists').insert({
      trip_id: currentTrip.id,
      title: newItemTitle.trim()
    })
    
    if (error) {
      alert(error.message)
    } else {
      setNewItemTitle('')
      queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip.id] })
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
    else queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id] })
  }

  // 删除清单
  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除此项吗？')) return
    const { error } = await supabase.from('trip_checklists').delete().eq('id', id)
    if (error) alert(error.message)
    else queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id] })
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
      queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id] })
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">CHECKLIST</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">行前清单</h1>
        <p className="text-white/80 font-medium mt-2 drop-shadow-sm">打点好一切，开启无忧旅程。</p>
      </header>

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

      {/* 列表内容 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : checklists && checklists.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {checklists.map((item) => (
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
                </div>

                {/* Actions */}
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-32 bg-black/15 backdrop-blur-xl rounded-[40px] border-dashed border-2 border-white/20 shadow-lg">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
            <ListTodo className="w-8 h-8 text-white/60 drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">一切准备就绪？</h3>
          <p className="text-white/80 font-medium text-sm drop-shadow-sm">开始添加你们的行前待办清单吧。</p>
        </div>
      )}
    </div>
  )
}
