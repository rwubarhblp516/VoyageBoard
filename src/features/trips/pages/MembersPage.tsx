import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2, User, Shield, Edit2, Check } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TripMember } from '@/types/trip'

export default function MembersPage() {
  const { currentTrip } = useTripStore()
  const { user, loading: authLoading } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const { data: members, isLoading: membersLoading } = useQuery<TripMember[]>({
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

  const isLoading = membersLoading || authLoading

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

  const handleCopyInvite = () => {
    if (!currentTrip) return
    navigator.clipboard.writeText(currentTrip.id)
    alert('邀请码已复制！分享给好友即可加入。')
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-end justify-between mb-12 gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">成员管理</h1>
          <p className="text-white/40 font-medium">谁在和你一起探索世界？</p>
        </div>
        <button
          onClick={handleCopyInvite}
          className="group relative px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">邀请伙伴</span>
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {members?.map((member) => {
              // 确保 ID 比较的鲁棒性
              const isCurrentUser = user && member.user_id === user.id
              const isEditing = editingId === member.id

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={member.id}
                  className={`glass-card p-7 rounded-[32px] flex items-center gap-6 border transition-all duration-500 ${
                    isCurrentUser ? 'bg-white/[0.04] border-white/20' : 'border-white/5'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 border border-white/5 ${
                    member.role === 'owner' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'
                  }`}>
                    {member.role === 'owner' ? <Shield className="w-7 h-7" /> : <User className="w-7 h-7" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(member.id)}
                            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/40 w-full"
                          />
                          <button 
                            onClick={() => handleUpdateName(member.id)}
                            className="p-2 bg-white text-black rounded-xl hover:bg-white/80 transition-all shadow-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-white font-black text-xl tracking-tight truncate">{member.display_name}</h3>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black bg-white text-black px-2 py-0.5 rounded-full uppercase tracking-widest">YOU</span>
                          )}
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        <span>{member.role === 'owner' ? 'Voyage Host' : 'Adventurer'}</span>
                      </div>
                    )}
                  </div>

                  {isCurrentUser && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingId(member.id)
                        setNewName(member.display_name)
                      }}
                      className="p-3 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5 transition-all shadow-sm"
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

      <div className="mt-12 glass-panel p-10 rounded-[44px] border-dashed border-2 border-white/5 text-center group transition-all hover:border-white/10">
        <p className="text-white/20 font-bold text-[10px] uppercase tracking-[0.4em] mb-4 group-hover:text-white/40 transition-colors">Your Invitation Code</p>
        <div className="inline-flex items-center gap-4 px-6 py-3 bg-black/20 rounded-2xl border border-white/10 font-mono text-xs text-white/40 group-hover:text-white/80 group-hover:border-white/20 transition-all">
          {currentTrip?.id}
        </div>
      </div>
    </div>
  )
}
