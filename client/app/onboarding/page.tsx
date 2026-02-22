"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, loading, isAuthenticated, router]);

  const handleNext = () => {
    router.push("/onboarding/preferences");
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
            <div className="h-1 flex-1 bg-border rounded-full" />
            <div className="h-1 flex-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-[var(--font-bebas)]">
              Welcome, {user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Let's set up your KaChow workspace
            </p>
          </div>

          {/* Welcome Card */}
          <Card className="border border-border p-8 space-y-6 bg-card">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Get started with KaChow</h2>
              <p className="text-muted-foreground leading-relaxed">
                KaChow transforms fragmented system knowledge into a living knowledge graph. We'll help you understand your entire codebase and make architecture decisions with confidence.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-accent text-lg">→</div>
                <div>
                  <p className="font-medium">Analyze your codebase</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your repository for intelligent analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-accent text-lg">→</div>
                <div>
                  <p className="font-medium">Personalize your experience</p>
                  <p className="text-sm text-muted-foreground">
                    Tell us about your preferences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-accent text-lg">→</div>
                <div>
                  <p className="font-medium">Start exploring</p>
                  <p className="text-sm text-muted-foreground">
                    Begin your journey to better engineering
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-accent hover:bg-accent/90 text-background"
              size="lg"
            >
              Continue
            </Button>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            You can skip this setup and start exploring anytime
          </p>
        </div>
      </div>
    </main>
  );
}
