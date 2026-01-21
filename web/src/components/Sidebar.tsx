// [
import React, { useEffect, useState } from 'react'
import { apiClient } from '../lib/api-client'
import type { Share, User } from '../types'
import { cn } from '../lib/utils'

interface SidebarProps {
  selectedUserId: string | null
  onSelectUser: (userId: string | null) => void
  currentUser: User | null
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedUserId, onSelectUser, currentUser }) => {
  const [watching, setWatching] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWatching = async () => {
      try {
        const response = await apiClient.getWatching()
        setWatching(response.data || [])
      } catch (error) {
        console.error('Failed to fetch team members:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWatching()
  }, [])

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl h-[calc(100vh-65px)] overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Personal
        </h2>
        <button
          onClick={() => onSelectUser(null)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
            !selectedUserId
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'hover:bg-secondary text-foreground'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center font-bold">
            {currentUser?.name?.[0] || currentUser?.email?.[0]?.toUpperCase()}
          </div>
          <div className="text-left overflow-hidden">
            <p className="font-medium truncate">My Dashboard</p>
            <p className="text-xs opacity-70 truncate">Personal Stats</p>
          </div>
        </button>

        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-4">
          Team Members
        </h2>
        <div className="space-y-1">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Loading team...
            </div>
          ) : watching.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">
              No team members yet.
            </div>
          ) : (
            watching.map((share) => (
              <button
                key={share.id}
                onClick={() => onSelectUser(share.owner_id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  selectedUserId === share.owner_id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'hover:bg-secondary text-foreground'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-secondary-foreground/10 flex items-center justify-center font-bold">
                  {share.user?.name?.[0] || share.user?.email[0].toUpperCase()}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="font-medium truncate">
                    {share.user?.name || share.user?.email.split('@')[0]}
                  </p>
                  <p className="text-xs opacity-70 truncate">Team Member</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
