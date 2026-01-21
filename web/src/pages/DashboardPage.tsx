import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api-client'
import { UnauthorizedError } from '../lib/errors'
import { useAuthStore } from '../hooks/use-auth'
import { formatTime, formatTimeRange, cn } from '../lib/utils'
import { Button } from '../components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Badge } from '../components/Badge'
import { LoadingSpinner } from '../components/Loading'
import { Sidebar } from '../components/Sidebar'
import { ShareModal } from '../components/ShareModal'
import type { Activity, ActivityStats } from '../types'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    loadData(selectedUserId)
  }, [selectedUserId])

  const loadData = async (targetUserId: string | null) => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      let statsReq, activitiesReq

      if (targetUserId) {
        // Supervisor View
        statsReq = apiClient.getUserStats(targetUserId, today)
        activitiesReq = apiClient.getUserActivity(targetUserId, { from: today, per_page: 20 })
      } else {
        // Personal View
        statsReq = apiClient.getStats(today)
        activitiesReq = apiClient.getActivities({ from: today, per_page: 20 })
      }

      const [statsRes, activitiesRes] = await Promise.all([statsReq, activitiesReq])

      setStats(statsRes.data || null)
      setActivities(activitiesRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      if (error instanceof UnauthorizedError) {
        clearAuth()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const categoryColors: Record<string, 'coding' | 'meeting' | 'browsing' | 'communication' | 'design' | 'other'> = {
    coding: 'coding',
    meeting: 'meeting',
    browsing: 'browsing',
    communication: 'communication',
    design: 'design',
    other: 'other',
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-[65px] border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">
              TT
            </div>
            <h1 className="text-xl font-bold tracking-tight">TimeTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            {!selectedUserId && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
                className="shadow-lg shadow-primary/20"
              >
                Share
              </Button>
            )}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user?.name || user?.email.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          currentUser={user}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto px-4 py-8">
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
            />
            {/* Dashboard Title Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {selectedUserId ? "Team Member Dashboard" : "Personal Dashboard"}
                </h2>
                <p className="text-muted-foreground">
                  {selectedUserId ? "Viewing activity summary for your team member." : "Your personal activity summary for today."}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md p-1.5 rounded-lg border border-border">
                <Badge variant="secondary" className="px-3 py-1">Today</Badge>
                <span className="text-sm text-muted-foreground px-2">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {loading && !stats ? (
              <div className="h-[400px] flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {/* Today's Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:border-primary/20 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Tracked</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold group-hover:text-primary transition-colors">
                        {stats ? formatTime(stats.total_minutes) : '0h 0m'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Active session time</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:border-green-500/20 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Productivity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold group-hover:text-green-500 transition-colors">
                        {stats?.by_category?.coding?.percentage ? Math.round(stats.by_category.coding.percentage) : 0}%
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${stats?.by_category?.coding?.percentage || 0}%` }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:border-blue-500/20 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Snapshots</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold group-hover:text-blue-500 transition-colors">
                        {activities.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">5-minute intervals</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Time by Category */}
                  <Card className="bg-card/40 backdrop-blur-md border-white/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats && Object.keys(stats.by_category).length > 0 ? (
                        <div className="space-y-5">
                          {Object.entries(stats.by_category).map(([category, stat]) => (
                            <div key={category} className="group">
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="capitalize font-medium">{category}</span>
                                <span className="text-muted-foreground font-mono">{formatTime(stat.minutes)} ({Math.round(stat.percentage)}%)</span>
                              </div>
                              <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    category === 'coding' ? 'bg-violet-500' :
                                      category === 'meeting' ? 'bg-cyan-500' :
                                        category === 'browsing' ? 'bg-orange-500' :
                                          category === 'communication' ? 'bg-pink-500' :
                                            category === 'design' ? 'bg-teal-500' : 'bg-gray-400'
                                  )}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                          <p className="text-sm">No distribution data</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activities */}
                  <Card className="bg-card/40 backdrop-blur-md border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Recent Timeline</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
                    </CardHeader>
                    <CardContent>
                      {activities.length > 0 ? (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-colors">
                              <div className="mt-1">
                                <Badge variant={categoryColors[activity.category] || 'other'} className="w-24 justify-center">
                                  {activity.category}
                                </Badge>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-sm font-semibold truncate leading-none">{activity.app_name}</p>
                                  <span className="text-[10px] font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">
                                    {formatTimeRange(activity.captured_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-1">{activity.window_title}</p>
                                <div className="mt-2 text-xs p-2 bg-black/10 rounded-md text-muted-foreground/80 italic">
                                  "{activity.summary}"
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                          <p className="text-sm">Timeline is empty</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

