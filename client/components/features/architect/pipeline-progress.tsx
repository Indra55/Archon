'use client'

import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    Search,
    Boxes,
    FileText,
    FolderTree,
    GitPullRequest,
    Zap,
} from 'lucide-react'

type PipelineStage =
    | 'idle'
    | 'connecting'
    | 'analyze_requirements'
    | 'design_architecture'
    | 'generate_blueprint'
    | 'scaffold_infrastructure'
    | 'create_pr'
    | 'complete'
    | 'error'

interface StageConfig {
    key: PipelineStage
    label: string
    description: string
    icon: typeof Search
}

const STAGES: StageConfig[] = [
    {
        key: 'analyze_requirements',
        label: 'Analyzing Requirements',
        description: 'Parsing your requirements into functional specs...',
        icon: Search,
    },
    {
        key: 'design_architecture',
        label: 'Designing Architecture',
        description: 'Choosing patterns, services, databases, and APIs...',
        icon: Boxes,
    },
    {
        key: 'generate_blueprint',
        label: 'Generating Blueprint',
        description: 'Writing architecture documentation...',
        icon: FileText,
    },
    {
        key: 'scaffold_infrastructure',
        label: 'Scaffolding Infrastructure',
        description: 'Creating project files and configurations...',
        icon: FolderTree,
    },
    {
        key: 'create_pr',
        label: 'Creating Pull Request',
        description: 'Pushing to GitHub and opening a PR...',
        icon: GitPullRequest,
    },
]

interface PipelineProgressProps {
    stage: PipelineStage
    stageData: Record<string, any>
    errorMessage: string | null
    query: string
    action?: string
}

export function PipelineProgress({
    stage,
    stageData,
    errorMessage,
    query,
    action = 'design',
}: PipelineProgressProps) {
    const stages = STAGES.filter(s => action === 'scaffold' ? s.key === 'scaffold_infrastructure' : ['analyze_requirements', 'design_architecture', 'generate_blueprint'].includes(s.key))
    const currentIndex = stages.findIndex(s => s.key === stage)

    return (
        <div className="w-full px-4 md:px-8 py-8">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        {stage === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                        ) : (
                            <Zap className="w-5 h-5 text-accent animate-pulse" />
                        )}
                        <h3 className="text-lg font-bold text-foreground font-[var(--font-plex-sans)]">
                            {stage === 'connecting'
                                ? 'Connecting to Agent...'
                                : stage === 'error'
                                    ? 'Pipeline Error'
                                    : 'Building Your Architecture'}
                        </h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-md mx-auto">
                        &quot;{query}&quot;
                    </p>
                </div>

                {/* Error message */}
                {errorMessage && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
                        <p className="text-sm text-destructive font-mono">{errorMessage}</p>
                    </div>
                )}

                {/* Pipeline stages */}
                <div className="space-y-1">
                    {stages.map((s, idx) => {
                        const Icon = s.icon
                        const isActive = s.key === stage
                        const isCompleted = currentIndex > idx || stage === 'complete'
                        const isPending = currentIndex < idx && stage !== 'complete' && stage !== 'error'

                        return (
                            <div
                                key={s.key}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${isActive
                                    ? 'bg-accent/10 border border-accent/30'
                                    : isCompleted
                                        ? 'bg-card/50 border border-transparent'
                                        : 'border border-transparent opacity-40'
                                    }`}
                            >
                                {/* Status indicator */}
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                    {isActive ? (
                                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                                    ) : isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-sm font-mono font-bold ${isActive
                                            ? 'text-accent'
                                            : isCompleted
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                            }`}
                                    >
                                        {s.label}
                                    </p>
                                    {isActive && (
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5 animate-in fade-in duration-300">
                                            {s.description}
                                        </p>
                                    )}
                                </div>

                                {/* Stage-specific data preview */}
                                {isCompleted && stageData[s.key] && (
                                    <div className="flex-shrink-0">
                                        {s.key === 'analyze_requirements' && stageData[s.key]?.project_name && (
                                            <span className="text-xs text-accent/70 font-mono">
                                                {stageData[s.key].project_name}
                                            </span>
                                        )}
                                        {s.key === 'design_architecture' && stageData[s.key]?.num_services && (
                                            <span className="text-xs text-accent/70 font-mono">
                                                {stageData[s.key].num_services} services
                                            </span>
                                        )}
                                        {s.key === 'scaffold_infrastructure' && stageData[s.key]?.num_files && (
                                            <span className="text-xs text-accent/70 font-mono">
                                                {stageData[s.key].num_files} files
                                            </span>
                                        )}
                                        {s.key === 'create_pr' && stageData[s.key]?.pr_number && (
                                            <span className="text-xs text-accent/70 font-mono">
                                                PR #{stageData[s.key].pr_number}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Progress bar */}
                {stage !== 'error' && (
                    <div className="w-full bg-muted-foreground/20 rounded-full h-1 overflow-hidden">
                        <div
                            className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                            style={{
                                width:
                                    stage === 'connecting'
                                        ? '5%'
                                        : stage === 'complete'
                                            ? '100%'
                                            : `${((currentIndex + 1) / stages.length) * 100}%`,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
