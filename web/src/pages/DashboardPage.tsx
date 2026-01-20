import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api-client'
import { UnauthorizedError } from '../lib/errors'
import { useAuthStore } from '../hooks/use-auth'
import { formatTime, formatTimeRange } from '../lib/utils'
import { Button } from '../components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Badge } from '../components/Badge'
import { LoadingSpinner } from '../components/Loading'
import type { Activity, ActivityStats } from '../types'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [statsRes, activitiesRes] = await Promise.all([
        apiClient.getStats(today),
        apiClient.getActivities({ from: today, per_page: 20 }),
      ])
      setStats(statsRes.data)
      setActivities(activitiesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      // If unauthorized, redirect to login
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

  if (loading) {
    return <LoadingSpinner />
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">TimeTrack</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Today's Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Time Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats ? formatTime(stats.total_minutes) : '0h 0m'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Productive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.by_category.coding?.percentage ? Math.round(stats.by_category.coding.percentage) : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activities.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Time by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Time by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && Object.keys(stats.by_category).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.by_category).map(([category, stat]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="text-muted-foreground">{formatTime(stat.minutes)} ({Math.round(stat.percentage)}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No activity data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                      <Badge variant={categoryColors[activity.category] || 'other'}>
                        {activity.category}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.app_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.window_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.summary}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeRange(activity.captured_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No activities recorded yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
