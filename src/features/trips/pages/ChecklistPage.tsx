import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Edit2,
  FolderPlus,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
  Users2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TripMember } from '@/types/trip'

type ChecklistScope = 'public' | 'personal'
type ChecklistKind = 'item' | 'group'

type ChecklistItem = {
  id: string
  trip_id: string
  title: string
  category: ChecklistScope
  item_kind?: ChecklistKind | null
  parent_id?: string | null
  is_completed: boolean | null
  completed_by_member_id: string | null
  created_by_member_id: string | null
  created_at: string | null
  completed_by?: { display_name: string } | null
  owner?: { display_name: string } | null
  confirmations?: ChecklistConfirmation[]
}

type ChecklistConfirmation = {
  id: string
  trip_id: string
  checklist_id: string
  member_id: string
  confirmed_at: string | null
  member?: { display_name: string; avatar_url: string | null } | null
}

export default function ChecklistPage() {
  const { currentTrip } = useTripStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [newItemTitle, setNewItemTitle] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('none')
  const [activeCategory, setActiveCategory] = useState<ChecklistScope>('public')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set())
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set())

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
    enabled: !!currentTrip && !!user,
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

  const { data: checklists, isLoading } = useQuery<ChecklistItem[]>({
    queryKey: ['checklists', currentTrip?.id, activeCategory, currentMember?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_checklists')
        .select('*, completed_by:trip_members!trip_checklists_completed_by_member_id_fkey(display_name), owner:trip_members!trip_checklists_created_by_member_id_fkey(display_name), confirmations:trip_checklist_confirmations(id, trip_id, checklist_id, member_id, confirmed_at, member:trip_members!trip_checklist_confirmations_member_id_fkey(display_name, avatar_url))')
        .eq('trip_id', currentTrip.id)
        .eq('category', activeCategory)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as unknown as ChecklistItem[]
    },
    enabled: !!currentTrip && (activeCategory === 'public' || !!currentMember),
    retry: false,
  })

  const sharedMemberIds = new Set((personalShares || []).map((share) => share.shared_member_id))
  const shareableMembers = (members || []).filter((member) => member.id !== currentMember?.id)

  const groups = useMemo(
    () => (checklists || []).filter((item) => item.item_kind === 'group' && !item.parent_id),
    [checklists],
  )

  const isConfirmedByCurrentMember = (item: ChecklistItem) => (
    (item.confirmations || []).some((confirmation) => confirmation.member_id === currentMember?.id)
  )

  const sortForCurrentMember = (items: ChecklistItem[]) => (
    [...items].sort((a, b) => {
      const aConfirmed = isConfirmedByCurrentMember(a)
      const bConfirmed = isConfirmedByCurrentMember(b)
      if (aConfirmed !== bConfirmed) return aConfirmed ? 1 : -1
      return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
    })
  )

  const childItemsByGroup = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>()
    for (const item of checklists || []) {
      if (item.item_kind === 'group' || !item.parent_id) continue
      const children = map.get(item.parent_id) || []
      children.push(item)
      map.set(item.parent_id, children)
    }
    for (const [groupId, children] of map.entries()) {
      map.set(groupId, sortForCurrentMember(children))
    }
    return map
  }, [checklists, currentMember?.id])

  const standaloneItems = useMemo(
    () => (checklists || []).filter((item) => item.item_kind !== 'group' && !item.parent_id),
    [checklists],
  )

  const ownGroups = useMemo(
    () => sortForCurrentMember(groups.filter((item) => activeCategory !== 'personal' || item.created_by_member_id === currentMember?.id)),
    [activeCategory, currentMember?.id, groups],
  )

  const sharedGroups = useMemo(
    () => sortForCurrentMember(groups.filter((item) => activeCategory === 'personal' && item.created_by_member_id !== currentMember?.id)),
    [activeCategory, currentMember?.id, groups],
  )

  const ownStandaloneItems = useMemo(
    () => sortForCurrentMember(standaloneItems.filter((item) => activeCategory !== 'personal' || item.created_by_member_id === currentMember?.id)),
    [activeCategory, currentMember?.id, standaloneItems],
  )

  const sharedStandaloneItems = useMemo(
    () => sortForCurrentMember(standaloneItems.filter((item) => activeCategory === 'personal' && item.created_by_member_id !== currentMember?.id)),
    [activeCategory, currentMember?.id, standaloneItems],
  )

  const canManageItem = (item: ChecklistItem) => (
    activeCategory === 'public' || item.created_by_member_id === currentMember?.id
  )

  const groupOptions = groups.filter(canManageItem)

  const invalidateChecklists = () => {
    return queryClient.invalidateQueries({ queryKey: ['checklists', currentTrip?.id, activeCategory] })
  }

  const updateChecklistCache = (updater: (items: ChecklistItem[]) => ChecklistItem[]) => {
    queryClient.setQueriesData<ChecklistItem[]>(
      { queryKey: ['checklists', currentTrip?.id, activeCategory] },
      (current) => current ? updater(current) : current,
    )
  }

  const buildCurrentMemberConfirmation = (checklistId: string): ChecklistConfirmation => ({
    id: `optimistic-${currentMember?.id}-${checklistId}`,
    trip_id: currentTrip!.id,
    checklist_id: checklistId,
    member_id: currentMember!.id,
    confirmed_at: new Date().toISOString(),
    member: {
      display_name: members?.find((member) => member.id === currentMember?.id)?.display_name || '我',
      avatar_url: members?.find((member) => member.id === currentMember?.id)?.avatar_url || null,
    },
  })

  const setCurrentMemberConfirmations = (checklistIds: string[], shouldConfirm: boolean) => {
    const idSet = new Set(checklistIds)
    updateChecklistCache((items) => items.map((item) => {
      if (!idSet.has(item.id)) return item

      const existingConfirmations = item.confirmations || []
      const withoutCurrentMember = existingConfirmations.filter((confirmation) => confirmation.member_id !== currentMember?.id)
      return {
        ...item,
        confirmations: shouldConfirm
          ? [...withoutCurrentMember, buildCurrentMemberConfirmation(item.id)]
          : withoutCurrentMember,
      }
    }))
  }

  const setTogglePending = (checklistIds: string[], isPending: boolean) => {
    setPendingToggleIds((current) => {
      const next = new Set(current)
      for (const id of checklistIds) {
        if (isPending) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim() || !currentTrip) return
    if (activeCategory === 'personal' && !currentMember) {
      alert('您不在该旅程成员中，无法添加个人清单')
      return
    }

    const parentId = selectedGroupId !== 'none' ? selectedGroupId : null
    const parentGroup = parentId ? groups.find((group) => group.id === parentId) : null

    if (parentGroup && !canManageItem(parentGroup)) {
      alert('您只能在自己可管理的分类下添加项目')
      return
    }

    const { data, error } = await supabase.from('trip_checklists').insert({
      trip_id: currentTrip.id,
      title: newItemTitle.trim(),
      category: activeCategory,
      item_kind: 'item',
      parent_id: parentId,
      created_by_member_id: currentMember?.id,
    }).select('id').single()

    if (error) {
      alert(error.message)
    } else {
      setNewItemTitle('')
      if (data?.id) setSelectedGroupId(parentId || 'none')
      invalidateChecklists()
    }
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupTitle.trim() || !currentTrip) return
    if (activeCategory === 'personal' && !currentMember) {
      alert('您不在该旅程成员中，无法添加个人清单')
      return
    }

    const { data, error } = await supabase.from('trip_checklists').insert({
      trip_id: currentTrip.id,
      title: newGroupTitle.trim(),
      category: activeCategory,
      item_kind: 'group',
      parent_id: null,
      created_by_member_id: currentMember?.id,
    }).select('id').single()

    if (error) {
      alert(error.message)
    } else {
      setNewGroupTitle('')
      setIsAddingGroup(false)
      setSelectedGroupId(data?.id || 'none')
      invalidateChecklists()
    }
  }

  const handleToggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleToggle = async (item: ChecklistItem) => {
    if (!currentMember) {
      alert('您不在该旅程成员中，无法操作')
      return
    }

    if (item.item_kind === 'group') {
      const childIds = (childItemsByGroup.get(item.id) || []).map((child) => child.id)
      const ids = [item.id, ...childIds]
      if (ids.some((id) => pendingToggleIds.has(id))) return

      const currentConfirmedIds = new Set([
        ...(item.confirmations || []).filter((confirmation) => confirmation.member_id === currentMember.id).map(() => item.id),
        ...(childItemsByGroup.get(item.id) || [])
          .filter((child) => (child.confirmations || []).some((confirmation) => confirmation.member_id === currentMember.id))
          .map((child) => child.id),
      ])
      const shouldConfirm = ids.some((id) => !currentConfirmedIds.has(id))
      setCurrentMemberConfirmations(ids, shouldConfirm)
      setTogglePending(ids, true)

      const request = shouldConfirm
        ? supabase
            .from('trip_checklist_confirmations')
            .upsert(
              ids.map((id) => ({
                trip_id: currentTrip!.id,
                checklist_id: id,
                member_id: currentMember.id,
              })),
              { onConflict: 'checklist_id,member_id', ignoreDuplicates: true },
            )
        : supabase
            .from('trip_checklist_confirmations')
            .delete()
            .in('id', [
              ...(item.confirmations || [])
                .filter((confirmation) => confirmation.member_id === currentMember.id)
                .map((confirmation) => confirmation.id),
              ...(childItemsByGroup.get(item.id) || []).flatMap((child) => (
                (child.confirmations || [])
                  .filter((confirmation) => confirmation.member_id === currentMember.id)
                  .map((confirmation) => confirmation.id)
              )),
            ].filter((id) => !id.startsWith('optimistic-')))

      const { error } = await request
      if (error) {
        setCurrentMemberConfirmations(ids, !shouldConfirm)
        alert(error.message)
      } else {
        await invalidateChecklists()
      }
      setTogglePending(ids, false)
      return
    }

    if (pendingToggleIds.has(item.id)) return

    const confirmedByCurrentMember = (item.confirmations || []).some((confirmation) => confirmation.member_id === currentMember.id)
    const currentConfirmation = (item.confirmations || []).find((confirmation) => confirmation.member_id === currentMember.id)
    setCurrentMemberConfirmations([item.id], !confirmedByCurrentMember)
    setTogglePending([item.id], true)

    const request = confirmedByCurrentMember
      ? supabase
          .from('trip_checklist_confirmations')
          .delete()
          .eq('id', currentConfirmation?.id || '')
      : supabase
          .from('trip_checklist_confirmations')
          .upsert({
            trip_id: currentTrip!.id,
            checklist_id: item.id,
            member_id: currentMember.id,
          }, { onConflict: 'checklist_id,member_id', ignoreDuplicates: true })

    const { error } = await request
    if (error) {
      setCurrentMemberConfirmations([item.id], confirmedByCurrentMember)
      alert(error.message)
    } else {
      await invalidateChecklists()
    }

    setTogglePending([item.id], false)
  }

  const handleDelete = async (item: ChecklistItem) => {
    const message = item.item_kind === 'group'
      ? '确认删除此分类及其下面的所有清单吗？'
      : '确认删除此项吗？'
    if (!window.confirm(message)) return

    const { error } = await supabase.from('trip_checklists').delete().eq('id', item.id)
    if (error) alert(error.message)
    else invalidateChecklists()
  }

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id)
    setEditTitle(item.title)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }
    const { error } = await supabase.from('trip_checklists').update({
      title: editTitle.trim(),
    }).eq('id', id)

    if (error) alert(error.message)
    else {
      setEditingId(null)
      invalidateChecklists()
    }
  }

  const renderChecklistRow = (item: ChecklistItem, options?: { isChild?: boolean; childCount?: number }) => {
    const isGroup = item.item_kind === 'group'
    const isChild = !!options?.isChild
    const canManage = canManageItem(item)
    const confirmations = item.confirmations || []
    const confirmedByCurrentMember = confirmations.some((confirmation) => confirmation.member_id === currentMember?.id)
    const isCompletedForDisplay = confirmations.length > 0 || !!item.is_completed
    const isTogglePending = pendingToggleIds.has(item.id)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: -20 }}
        key={item.id}
        className={`glass-card border transition-all duration-300 flex items-center gap-3 sm:gap-4 group shadow-md ${
          isChild ? 'p-3.5 sm:p-4 rounded-[20px] ml-7 sm:ml-10' : 'p-4 sm:p-5 rounded-[24px]'
        } ${
          isCompletedForDisplay ? 'bg-black/10 backdrop-blur-sm border-white/5 opacity-80' : 'bg-black/30 backdrop-blur-md border-white/20 hover:border-white/30'
        }`}
      >
        {isGroup && (
          <button
            type="button"
            onClick={() => handleToggleGroupCollapsed(item.id)}
            className="shrink-0 p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            aria-label={collapsedGroupIds.has(item.id) ? '展开分类' : '折叠分类'}
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${collapsedGroupIds.has(item.id) ? '-rotate-90' : ''}`} />
          </button>
        )}

        <button
          onClick={() => handleToggle(item)}
          disabled={isTogglePending}
          className="shrink-0 focus:outline-none disabled:opacity-45 disabled:cursor-wait"
          aria-label={confirmedByCurrentMember ? '取消我的确认' : '确认我已准备'}
        >
          {confirmedByCurrentMember ? (
            <CheckCircle2 className="w-7 h-7 text-white/80" />
          ) : (
            <Circle className="w-7 h-7 text-white/20 group-hover:text-white/40 transition-colors" />
          )}
        </button>

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
              <span className={`block truncate transition-all ${
                isGroup ? 'text-lg font-black' : 'text-base sm:text-lg font-medium'
              } ${confirmedByCurrentMember ? 'text-white/40 line-through' : 'text-white'}`}>
                {item.title}
              </span>
              {isGroup && (
                <span className="block text-[11px] font-bold text-white/45 mt-1">
                  {options?.childCount || 0} 个项目
                </span>
              )}
            </div>
          )}

          {confirmations.length > 0 && (
            <div className="shrink-0 flex flex-wrap justify-end gap-1.5 max-w-[160px] sm:max-w-[240px]">
              {confirmations.map((confirmation) => (
                <span
                  key={confirmation.id}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border shadow-md drop-shadow-sm ${
                    confirmation.member_id === currentMember?.id
                      ? 'bg-emerald-500/85 text-white border-emerald-400/30'
                      : 'bg-white/10 text-white/75 border-white/10'
                  }`}
                >
                  {confirmation.member?.display_name || '成员'}
                </span>
              ))}
            </div>
          )}

          {activeCategory === 'personal' && item.created_by_member_id !== currentMember?.id && item.owner && (
            <span className="shrink-0 text-[10px] font-black bg-white/10 text-white/70 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 shadow-md drop-shadow-sm">
              来自 {item.owner.display_name}
            </span>
          )}
        </div>

        {canManage && (
          <div className="shrink-0 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {editingId !== item.id && (
              <button
                onClick={() => startEdit(item)}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(item)}
              className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              aria-label="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  const renderChecklistSection = (sectionGroups: ChecklistItem[], sectionStandaloneItems: ChecklistItem[]) => (
    <AnimatePresence mode="popLayout">
      {sectionGroups.map((group) => {
        const children = childItemsByGroup.get(group.id) || []
        const isCollapsed = collapsedGroupIds.has(group.id)
        return (
          <div key={group.id} className="space-y-2">
            {renderChecklistRow(group, { childCount: children.length })}
            <AnimatePresence initial={false}>
              {!isCollapsed && children.map((child) => renderChecklistRow(child, { isChild: true }))}
            </AnimatePresence>
          </div>
        )
      })}
      {sectionStandaloneItems.map((item) => renderChecklistRow(item))}
    </AnimatePresence>
  )

  const hasOwnItems = ownGroups.length > 0 || ownStandaloneItems.length > 0
  const hasSharedItems = sharedGroups.length > 0 || sharedStandaloneItems.length > 0

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

      <div className="flex p-1.5 bg-black/20 backdrop-blur-md rounded-[22px] mb-8 w-fit mx-auto border border-white/10 shadow-lg overflow-hidden relative">
        <motion.div
          className="absolute left-1.5 inset-y-1.5 bg-white rounded-[16px] shadow-xl"
          initial={false}
          animate={{ x: activeCategory === 'public' ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
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

      <div className="mb-8 glass-card p-3 sm:p-4 rounded-[28px] border border-white/10 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-[232px_1fr_auto] gap-3 items-start">
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_48px] gap-2">
              <div className="relative">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  disabled={groupOptions.length === 0}
                  className="appearance-none w-full h-12 bg-black/25 border border-white/15 rounded-2xl pl-4 pr-11 text-sm font-bold text-white focus:outline-none disabled:opacity-45"
                >
                  <option value="none">不分类</option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>{group.title}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              </div>
              <button
                type="button"
                onClick={() => setIsAddingGroup((current) => !current)}
                className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
                  isAddingGroup
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                aria-label="添加分类"
                title="添加分类"
              >
                <FolderPlus className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isAddingGroup && (
                <motion.form
                  onSubmit={handleAddGroup}
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-[1fr_72px] gap-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FolderPlus className="h-5 w-5 text-white/40" />
                      </div>
                      <input
                        type="text"
                        value={newGroupTitle}
                        onChange={(e) => setNewGroupTitle(e.target.value)}
                        placeholder="分类名称"
                        className="w-full bg-black/20 border border-white/20 hover:border-white/30 focus:border-white/50 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none transition-all font-bold placeholder:text-white/60"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newGroupTitle.trim()}
                      className="h-12 rounded-2xl flex items-center justify-center bg-white text-black disabled:bg-white/10 disabled:text-white/30 font-black text-sm transition-all active:scale-95"
                    >
                      保存
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleAdd} className="contents">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ListTodo className="h-5 w-5 text-white/40" />
              </div>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder={selectedGroupId === 'none' ? '添加准备事项，例如：护照...' : '添加到所选分类，例如：感冒药...'}
                className="w-full bg-black/20 border border-white/20 hover:border-white/30 focus:border-white/50 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none transition-all font-bold placeholder:text-white/60"
              />
            </div>

            <button
              type="submit"
              disabled={!newItemTitle.trim()}
              className="h-12 px-5 rounded-2xl flex items-center justify-center gap-2 bg-white text-black disabled:bg-white/10 disabled:text-white/30 font-black text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </form>
        </div>
      </div>

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

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : checklists && checklists.length > 0 ? (
        <div className="space-y-8">
          {hasOwnItems && (
            <div className="space-y-4">
              {renderChecklistSection(ownGroups, ownStandaloneItems)}
            </div>
          )}

          {activeCategory === 'personal' && hasSharedItems && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Shared With You</p>
                  <p className="text-xs font-bold text-white/70 mt-0.5">下面是他人分享给你的个人清单</p>
                </div>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              {renderChecklistSection(sharedGroups, sharedStandaloneItems)}
            </section>
          )}
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
