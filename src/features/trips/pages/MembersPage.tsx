import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2, User, Shield, Edit2, Check, RefreshCw, Link2, Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TripMember } from '@/types/trip'

import { Navigate } from 'react-router-dom'

export default function MembersPage() {
  const { currentTrip } = useTripStore()
  const { user, loading: authLoading } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null)

  if (!currentTrip) {
    return <Navigate to="/trips" replace />
  }

  const { data: members, isLoading: membersLoading } = useQuery<TripMember[]>({
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


  const isLoading = membersLoading || authLoading

  const handleUpdateProfile = async (memberId: string) => {
    if (!newName.trim()) return

    try {
      const { error } = await supabase
        .from('trip_members')
        .update({ 
          display_name: newName.trim(),
          avatar_url: newAvatarUrl 
        } as any)
        .eq('id', memberId)

      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['members', currentTrip?.id] })
      setEditingId(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const shuffleAvatar = () => {
    const seeds = ['Felix', 'Aneka', 'Oliver', 'Mimi', 'Lola', 'Molly', 'Jack', 'Lucy', 'Leo', 'Mia', 'Coco', 'Sasha', 'Jasper', 'Buster', 'Cleo', 'Shadow', 'Buddy', 'Oscar', 'Daisy', 'Sam']
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 1000)
    setNewAvatarUrl(`https://api.dicebear.com/9.x/micah/svg?seed=${randomSeed}&backgroundColor=transparent`)
  }

  const [copied, setCopied] = useState(false)

  const handleGenerateInviteLink = () => {
    if (!currentTrip) return
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/join/${currentTrip.id}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">MEMBERS</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md mb-2">成员管理</h1>
        <p className="text-white/80 font-medium drop-shadow-sm mb-8">谁在和你一起探索世界？</p>
        
        <button
          onClick={handleGenerateInviteLink}
          className="group relative px-8 py-3.5 bg-white text-black rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden shadow-xl active:scale-95"
        >
          {copied ? (
            <>
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">已复制</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">邀请伙伴</span>
            </>
          )}
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
                  <div className={`relative w-16 h-16 rounded-[22px] overflow-hidden flex items-center justify-center shrink-0 border border-white/5 transition-all ${
                    member.role === 'owner' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'
                  }`}>
                    {(isEditing ? newAvatarUrl : member.avatar_url) ? (
                      <img src={(isEditing ? newAvatarUrl : member.avatar_url) || undefined} alt={member.display_name} className="w-full h-full object-cover" />
                    ) : (
                      member.role === 'owner' ? <Shield className="w-7 h-7" /> : <User className="w-7 h-7" />
                    )}
                    
                    {isEditing && (
                      <button
                        onClick={shuffleAvatar}
                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile(member.id)}
                            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/40 w-full"
                          />
                          <button 
                            onClick={() => handleUpdateProfile(member.id)}
                            className="p-2 bg-white text-black rounded-xl hover:bg-white/80 transition-all shadow-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-white font-black text-xl tracking-tight truncate">{member.display_name}</h3>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black bg-white text-black px-2 py-0.5 rounded-full uppercase tracking-widest">你自己</span>
                          )}
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 uppercase tracking-widest drop-shadow-sm">
                        <span>{member.role === 'owner' ? '旅程发起人' : '同行伙伴'}</span>
                      </div>
                    )}
                  </div>

                  {isCurrentUser && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingId(member.id)
                        setNewName(member.display_name)
                        setNewAvatarUrl(member.avatar_url)
                      }}
                      className="p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 border border-white/5 transition-all shadow-sm"
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

      <div className="mt-12 bg-black/15 backdrop-blur-xl px-6 py-8 rounded-[32px] border-dashed border-2 border-white/15 text-center group transition-all hover:border-white/25 shadow-lg">
        <p className="text-white/80 font-bold text-[10px] uppercase tracking-[0.4em] mb-4 group-hover:text-white transition-colors drop-shadow-sm">您的专属邀请链接</p>
        <button
          onClick={handleGenerateInviteLink}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-black/30 rounded-2xl border border-white/15 font-mono text-xs text-white group-hover:border-white/25 transition-all hover:bg-black/40 active:scale-95 shadow-md cursor-pointer overflow-hidden"
        >
          {copied ? <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-white/60 shrink-0" />}
          <span className="truncate">{`${window.location.origin}/join/${currentTrip?.id}`}</span>
        </button>
      </div>
    </div>
  )
}
