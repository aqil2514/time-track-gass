import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'

describe('Card', () => {
  describe('Card', () => {
    it('renders children', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      )
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies base classes', () => {
      const { container } = render(
        <Card>
          <p>Content</p>
        </Card>
      )
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card/60', 'backdrop-blur-xl')
    })

    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">
          <p>Content</p>
        </Card>
      )
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('custom-class')
    })

    it('renders multiple children', () => {
      render(
        <Card>
          <p>First child</p>
          <p>Second child</p>
          <p>Third child</p>
        </Card>
      )
      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
      expect(screen.getByText('Third child')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('renders children', () => {
      render(
        <CardHeader>
          <h1>Header Title</h1>
        </CardHeader>
      )
      expect(screen.getByText('Header Title')).toBeInTheDocument()
    })

    it('applies base header classes', () => {
      const { container } = render(
        <CardHeader>
          <span>Header</span>
        </CardHeader>
      )
      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('applies custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">
          <span>Header</span>
        </CardHeader>
      )
      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders children as h3', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByText('Card Title')
      expect(title.tagName).toBe('H3')
    })

    it('applies base title classes', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('applies custom className', () => {
      render(<CardTitle className="text-red-500">Custom Title</CardTitle>)
      const title = screen.getByText('Custom Title')
      expect(title).toHaveClass('text-red-500')
    })
  })

  describe('CardDescription', () => {
    it('renders children as paragraph', () => {
      render(<CardDescription>Card description text</CardDescription>)
      const description = screen.getByText('Card description text')
      expect(description.tagName).toBe('P')
    })

    it('applies base description classes', () => {
      render(<CardDescription>Description</CardDescription>)
      const description = screen.getByText('Description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc">Custom Description</CardDescription>)
      const description = screen.getByText('Custom Description')
      expect(description).toHaveClass('custom-desc')
    })
  })

  describe('CardContent', () => {
    it('renders children', () => {
      render(
        <CardContent>
          <p>Content goes here</p>
        </CardContent>
      )
      expect(screen.getByText('Content goes here')).toBeInTheDocument()
    })

    it('applies base content classes', () => {
      const { container } = render(
        <CardContent>
          <p>Content</p>
        </CardContent>
      )
      const content = container.firstChild as HTMLElement
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('applies custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">
          <p>Content</p>
        </CardContent>
      )
      const content = container.firstChild as HTMLElement
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('renders children', () => {
      render(
        <CardFooter>
          <button>Save</button>
        </CardFooter>
      )
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('applies base footer classes', () => {
      const { container } = render(
        <CardFooter>
          <span>Footer</span>
        </CardFooter>
      )
      const footer = container.firstChild as HTMLElement
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('applies custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">
          <span>Footer</span>
        </CardFooter>
      )
      const footer = container.firstChild as HTMLElement
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Composite Card', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    })

    it('renders card without optional sub-components', () => {
      render(
        <Card>
          <CardContent>
            <p>Simple card</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Simple card')).toBeInTheDocument()
    })
  })
})
