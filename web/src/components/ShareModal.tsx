// [
import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api-client'
import { Button } from './Button'
import { Input } from './Input'
import { Card } from './Card'
import { Badge } from './Badge'
import { cn } from '../lib/utils'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('')
    const [linkName, setLinkName] = useState('')
    const [links, setLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'email' | 'link'>('email')

    useEffect(() => {
        if (isOpen) {
            fetchLinks()
        }
    }, [isOpen])

    const fetchLinks = async () => {
        try {
            const response = await apiClient.getShareLinks()
            setLinks(response.data)
        } catch (error) {
            console.error('Failed to fetch links:', error)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await apiClient.createShare(email)
            setEmail('')
            alert('Invitation sent!')
        } catch (error) {
            console.error('Invite error:', error)
            alert('Failed to send invitation')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await apiClient.createShareLink({ name: linkName })
            setLinkName('')
            fetchLinks()
        } catch (error) {
            console.error('Link creation error:', error)
            alert('Failed to create link')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteLink = async (id: string) => {
        try {
            await apiClient.deleteShareLink(id)
            fetchLinks()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.origin}/s/${slug}`
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />
            <Card className="relative w-full max-w-lg bg-card/80 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Share Dashboard</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('email')}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                activeTab === 'email' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary/50"
                            )}
                        >
                            Invite by Email
                        </button>
                        <button
                            onClick={() => setActiveTab('link')}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                activeTab === 'link' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary/50"
                            )}
                        >
                            Shareable Link
                        </button>
                    </div>

                    {activeTab === 'email' ? (
                        <form onSubmit={handleInvite} className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Invite a supervisor to see your activity summary. They must have a TimeTrack account.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="supervisor@company.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-black/20"
                                />
                                <Button type="submit" disabled={loading}>
                                    {loading ? '...' : 'Invite'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={handleCreateLink} className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Generate a unique link that anyone can use to view your productivity stats.
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Link Name (e.g. For Client X)"
                                        value={linkName}
                                        onChange={(e) => setLinkName(e.target.value)}
                                        required
                                        className="bg-black/20"
                                    />
                                    <Button type="submit" disabled={loading}>
                                        {loading ? '...' : 'Create'}
                                    </Button>
                                </div>
                            </form>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Links</h3>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                                    {links.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic py-4 text-center">No links generated yet.</p>
                                    ) : (
                                        links.map((link) => (
                                            <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{link.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">/s/{link.slug}</p>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-xs"
                                                        onClick={() => copyToClipboard(link.slug)}
                                                    >
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteLink(link.id)}
                                                    >
                                                        Revoke
                                                    </Button>
                                                </div>
                                                <Badge variant="secondary" className="ml-2 group-hover:hidden">
                                                    {link.views} views
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
