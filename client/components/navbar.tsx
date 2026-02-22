'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '@/hooks/useAuth'

gsap.registerPlugin(ScrollTrigger)

export function Navbar() {
  const navRef = useRef<HTMLNavElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated, logout, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'Solutions', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Enterprise', href: '#contact' },
    { label: 'Docs', href: 'https://docs.example.com' },
  ]

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/20 bg-background/80 backdrop-blur-md transition-all duration-300"
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center border border-accent/50">
          <span className="font-bold text-accent text-sm">⚡</span>
        </div>
        <span className="font-[var(--font-bebas)] text-xl tracking-wide text-foreground hidden md:inline">
          KA-CHOW
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-12">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-200"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex items-center gap-4">
        {mounted && !loading && (
          <>
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-6 h-6 rounded-full border border-accent/30"
                      />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-200 flex items-center gap-1"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 hidden md:inline"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 border border-accent text-accent font-mono text-xs uppercase tracking-widest rounded hover:bg-accent hover:text-background transition-all duration-200"
                >
                  Sign up
                </Link>
              </>
            )}
          </>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-foreground hover:text-accent transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-background/95 backdrop-blur-md border-b border-border/20 p-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {mounted && !loading && (
            <>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="block w-full text-left font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block font-mono text-sm uppercase tracking-widest text-accent border border-accent px-4 py-2 rounded hover:bg-accent hover:text-background transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  )
}
