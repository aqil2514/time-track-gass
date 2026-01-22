import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  describe('rendering', () => {
    it('renders with correct text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders with primary variant by default', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('renders with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('renders with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })

    it('renders with sm size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-8')
      expect(button.className).toContain('px-3')
      expect(button.className).toContain('text-sm')
    })

    it('renders with md size by default', () => {
      render(<Button size="md">Medium</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-10')
      expect(button.className).toContain('px-4')
    })

    it('renders with lg size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-12')
      expect(button.className).toContain('px-6')
      expect(button.className).toContain('text-lg')
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('interactions', () => {
    it('handles click event', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button', { name: /click me/i })
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not fire click when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('fires click multiple times when clicked multiple times', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('disabled state', () => {
    it('has disabled attribute when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('applies base disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('disabled:opacity-50')
      expect(button.className).toContain('disabled:pointer-events-none')
    })
  })

  describe('props passthrough', () => {
    it('passes through additional HTML button attributes', () => {
      render(
        <Button type="submit" name="test-button" value="test-value">
          Submit
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('name', 'test-button')
      expect(button).toHaveAttribute('value', 'test-value')
    })

    it('passes aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Close dialog')
    })
  })
})
