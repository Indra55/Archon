'use client'

import { useState } from 'react'
import { X, Github, Loader2, CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff, KeyRound } from 'lucide-react'

interface NewProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: (project: any) => void
}

type Step = 'details' | 'pat' | 'validating' | 'success'

export function NewProjectModal({ isOpen, onClose, onCreated }: NewProjectModalProps) {
    const [step, setStep] = useState<Step>('details')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [githubRepo, setGithubRepo] = useState('')
    const [githubPat, setGithubPat] = useState('')
    const [showPat, setShowPat] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [validationResult, setValidationResult] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const resetForm = () => {
        setStep('details')
        setName('')
        setDescription('')
        setGithubRepo('')
        setGithubPat('')
        setShowPat(false)
        setError(null)
        setValidationResult(null)
        setIsSubmitting(false)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleDetailsNext = () => {
        if (!name.trim()) {
            setError('Project name is required')
            return
        }
        if (!githubRepo.trim()) {
            setError('GitHub repository is required')
            return
        }
        setError(null)
        setStep('pat')
    }

    const handleCreateProject = async () => {
        if (!githubPat.trim()) {
            setError('GitHub PAT is required')
            return
        }

        setError(null)
        setIsSubmitting(true)
        setStep('validating')

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    github_repo: githubRepo.trim(),
                    github_pat: githubPat.trim(),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to create project')
                setStep('pat')
                setIsSubmitting(false)
                return
            }

            setValidationResult(data)
            setStep('success')
            setIsSubmitting(false)

            // Notify parent after a brief pause
            setTimeout(() => {
                onCreated(data.project)
                handleClose()
            }, 1500)
        } catch (err) {
            setError('Network error. Please try again.')
            setStep('pat')
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-card border border-accent/30 rounded-lg shadow-2xl shadow-accent/5 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-accent/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/50 flex items-center justify-center">
                            <Github className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground font-[var(--font-plex-sans)]">
                                New Project
                            </h2>
                            <p className="text-xs text-muted-foreground font-mono">
                                {step === 'details' && 'Step 1 of 2 — Project details'}
                                {step === 'pat' && 'Step 2 of 2 — GitHub access'}
                                {step === 'validating' && 'Validating...'}
                                {step === 'success' && 'Project created!'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-destructive font-mono">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Details */}
                    {step === 'details' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="My Awesome App"
                                    className="w-full px-4 py-2.5 bg-background border border-muted-foreground/30 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono text-sm"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                                    GitHub Repository *
                                </label>
                                <input
                                    type="text"
                                    value={githubRepo}
                                    onChange={(e) => setGithubRepo(e.target.value)}
                                    placeholder="owner/repo-name or full URL"
                                    className="w-full px-4 py-2.5 bg-background border border-muted-foreground/30 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground font-mono">
                                    e.g. <span className="text-accent/80">indra55/aegis</span> or <span className="text-accent/80">https://github.com/indra55/aegis</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                                    Description <span className="text-muted-foreground/60">(optional)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Short description of the project..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-background border border-muted-foreground/30 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono text-sm resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: PAT */}
                    {step === 'pat' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-md bg-accent/5 border border-accent/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <KeyRound className="w-4 h-4 text-accent" />
                                    <span className="text-sm font-bold text-foreground font-[var(--font-plex-sans)]">
                                        Fine-Grained PAT Required
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                                    Create a{' '}
                                    <span className="text-accent/80">fine-grained personal access token</span>{' '}
                                    scoped to{' '}
                                    <span className="text-foreground font-bold">{githubRepo}</span> with these
                                    permissions:
                                </p>
                                <ul className="mt-2 space-y-1 text-xs text-muted-foreground font-mono">
                                    <li className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-accent" />
                                        Contents: Read and write
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-accent" />
                                        Pull requests: Read and write
                                    </li>
                                </ul>
                                <a
                                    href="https://github.com/settings/personal-access-tokens/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-accent hover:text-accent/80 font-mono transition-colors"
                                >
                                    Create PAT on GitHub
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                                    Personal Access Token *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPat ? 'text' : 'password'}
                                        value={githubPat}
                                        onChange={(e) => setGithubPat(e.target.value)}
                                        placeholder="github_pat_..."
                                        className="w-full px-4 py-2.5 pr-10 bg-background border border-muted-foreground/30 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono text-sm"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPat(!showPat)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPat ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground/60 font-mono">
                                    Stored encrypted. Only used for this project's repo.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Validating */}
                    {step === 'validating' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            <div className="text-center space-y-1">
                                <p className="text-sm text-foreground font-[var(--font-plex-sans)]">
                                    Validating your PAT...
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                    Checking access to {githubRepo}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-bold text-foreground font-[var(--font-plex-sans)]">
                                    Project Created!
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                    {name} → {githubRepo}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(step === 'details' || step === 'pat') && (
                    <div className="flex items-center justify-between p-6 border-t border-accent/20">
                        <button
                            onClick={step === 'details' ? handleClose : () => { setStep('details'); setError(null) }}
                            className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground border border-muted-foreground/20 hover:border-muted-foreground/40 transition-all font-mono"
                        >
                            {step === 'details' ? 'Cancel' : 'Back'}
                        </button>

                        <button
                            onClick={step === 'details' ? handleDetailsNext : handleCreateProject}
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-md text-sm bg-accent text-background font-bold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono flex items-center gap-2"
                        >
                            {step === 'details' ? (
                                'Next'
                            ) : isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
