import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2, User, Shield, Edit2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TripMember } from '@/types/trip'

export default function MembersPage() {
  const { currentTrip } = useTripStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const { data: members, isLoading } = useQuery<TripMember[]>({
    queryKey: ['members', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', currentTrip.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as TripMember[]
    },
    enabled: !!currentTrip,
  })

  const handleUpdateName = async (memberId: string) => {
    if (!newName.trim()) return

    try {
      const { error } = await supabase
        .from('trip_members')
        .update({ display_name: newName.trim() })
        .eq('id', memberId)

      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['members', currentTrip?.id] })
      setEditingId(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">成员管理</h1>
        <p className="text-slate-400 font-medium">谁在和你一起探索世界？</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-white/20" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {members?.map((member) => {
              const isCurrentUser = member.user_id === user?.id
              const isEditing = editingId === member.id

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={member.id}
                  className={`glass-card p-6 rounded-[32px] flex items-center gap-5 border border-white/5 group transition-all ${
                    isCurrentUser ? 'ring-2 ring-white/10' : ''
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative shrink-0 ${
                    member.role === 'owner' ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'bg-white/5 text-white/40'
                  }`}>
                    {member.role === 'owner' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    {isCurrentUser && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1C1C1E]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(member.id)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF] w-full"
                          />
                          <button 
                            onClick={() => handleUpdateName(member.id)}
                            className="p-1.5 bg-[#0A84FF] text-white rounded-lg hover:bg-[#0A84FF]/80 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-white font-bold text-lg truncate">{member.display_name}</h3>
                          {member.role === 'owner' && (
                            <span className="text-[9px] font-black bg-white/10 text-white/40 px-2 py-0.5 rounded-full uppercase tracking-widest">Host</span>
                          )}
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        <span>{member.role === 'owner' ? '旅程创建者' : '受邀成员'}</span>
                        {isCurrentUser && <span>· 你</span>}
                      </div>
                    )}
                  </div>

                  {isCurrentUser && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingId(member.id)
                        setNewName(member.display_name)
                      }}
                      className="p-3 rounded-xl bg-white/5 text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-12 glass-panel p-8 rounded-[40px] border-dashed border-2 border-white/5 text-center">
        <p className="text-white/40 font-bold text-sm uppercase tracking-[0.2em] mb-2">邀请新伙伴</p>
        <p className="text-white/20 text-xs">分享旅程 ID 即可让好友加入（即将上线）</p>
      </div>
    </div>
  )
}
