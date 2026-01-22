import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Badge>Badge Text</Badge>)
      expect(screen.getByText('Badge Text')).toBeInTheDocument()
    })

    it('renders as div element', () => {
      const { container } = render(<Badge>Test</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge.tagName).toBe('DIV')
    })

    it('applies base badge classes', () => {
      const { container } = render(<Badge>Test</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold',
        'transition-colors'
      )
    })

    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Test</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('custom-class')
    })
  })

  describe('variants', () => {
    it('renders with default variant', () => {
      const { container } = render(<Badge>Default</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('renders with secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('renders with outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('text-foreground')
    })

    it('renders with coding variant', () => {
      const { container } = render(<Badge variant="coding">Coding</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-violet-500/20', 'text-violet-300', 'border-violet-500/30')
    })

    it('renders with meeting variant', () => {
      const { container } = render(<Badge variant="meeting">Meeting</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/30')
    })

    it('renders with browsing variant', () => {
      const { container } = render(<Badge variant="browsing">Browsing</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-orange-500/20', 'text-orange-300', 'border-orange-500/30')
    })

    it('renders with communication variant', () => {
      const { container } = render(<Badge variant="communication">Communication</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-pink-500/20', 'text-pink-300', 'border-pink-500/30')
    })

    it('renders with design variant', () => {
      const { container } = render(<Badge variant="design">Design</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-teal-500/20', 'text-teal-300', 'border-teal-500/30')
    })

    it('renders with other variant', () => {
      const { container } = render(<Badge variant="other">Other</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-gray-500/20', 'text-gray-300', 'border-gray-500/30')
    })
  })

  describe('edge cases', () => {
    it('handles invalid variant gracefully', () => {
      const { container } = render(<Badge variant={'invalid' as any}>Invalid</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('renders empty string children', () => {
      const { container } = render(<Badge></Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toBe('')
    })

    it('renders numeric children', () => {
      render(<Badge>42</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders complex children (nested elements)', () => {
      render(
        <Badge>
          <span>Icon</span> Text
        </Badge>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has focus ring styles', () => {
      const { container } = render(<Badge>Test</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2'
      )
    })

    it('renders text content visible to screen readers', () => {
      render(<Badge>Category Badge</Badge>)
      expect(screen.getByText('Category Badge')).toBeInTheDocument()
    })
  })
})
