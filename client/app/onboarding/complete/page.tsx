"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, loading, isAuthenticated, router]);

  const handleFinish = () => {
    // Mark onboarding as complete
    localStorage.setItem("onboarding_completed", "true");
    router.push("/dashboard");
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="space-y-8">
          {/* Progress */}
          <div className="flex gap-2">
            <div className="h-1 flex-1 bg-accent rounded-full" />
            <div className="h-1 flex-1 bg-accent rounded-full" />
            <div className="h-1 flex-1 bg-accent rounded-full" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-[var(--font-bebas)]">
              You're all set!
            </h1>
            <p className="text-muted-foreground">
              Ready to unleash KaChow
            </p>
          </div>

          {/* Completion Card */}
          <Card className="border border-border p-8 space-y-6 bg-card">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Welcome to KaChow!</h2>
              <p className="text-muted-foreground">
                Your workspace is ready. Start exploring your codebase with AI-powered insights.
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-3 bg-accent/5 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground">Next steps:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Connect your first repository</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Explore codebase insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Generate documentation</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleFinish}
              className="w-full bg-accent hover:bg-accent/90 text-background"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </Card>

          {/* Skip Link */}
          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip to homepage
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
