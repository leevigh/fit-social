"use client";

import {
  ArrowRight,
  Trophy,
  Zap,
  Users,
  Video,
  DollarSign,
  Check,
  Menu,
  X,
  Star,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthButton } from "@/components/auth-button";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const challenges = [
    {
      title: "30-Day Plank Challenge",
      entryFee: 5,
      prizePool: 250,
      participants: 50,
      maxParticipants: 100,
      difficulty: "Intermediate",
      emoji: "💪",
    },
    {
      title: "Marathon Training",
      entryFee: 20,
      prizePool: 1200,
      participants: 75,
      maxParticipants: 150,
      difficulty: "Advanced",
      emoji: "🏃",
    },
    {
      title: "7-Day HIIT Blitz",
      entryFee: 2,
      prizePool: 85,
      participants: 42,
      maxParticipants: 50,
      difficulty: "Beginner",
      emoji: "⚡",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-primary hidden sm:inline">
                FitSocial
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#how"
                className="text-slate-600 hover:text-primary font-medium transition"
              >
                How It Works
              </a>
              <a
                href="#challenges"
                className="text-slate-600 hover:text-primary font-medium transition"
              >
                Challenges
              </a>
              <a
                href="#rewards"
                className="text-slate-600 hover:text-primary font-medium transition"
              >
                Rewards
              </a>
            </div>

            <div className="flex items-center gap-3">
              <AuthButton />
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 bg-white">
              <a
                href="#how"
                className="block py-2 px-2 text-slate-600 hover:bg-gray-100 rounded"
              >
                How It Works
              </a>
              <a
                href="#challenges"
                className="block py-2 px-2 text-slate-600 hover:bg-gray-100 rounded"
              >
                Challenges
              </a>
              <div className="mt-4">
                <AuthButton />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-primary/20 text-primary font-bold text-base px-4 py-2 rounded-full hover:bg-primary/30">
                🚀 Get Fit. Get Paid. Get Social.
              </Badge>

              <h1 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
                Turn Your <span className="text-primary">Workout</span> Into{" "}
                <span className="text-secondary">Money</span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Join fitness challenges, prove your progress, and earn real
                rewards. It&apos;s that simple.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-lg shadow-lg hover:shadow-xl transition">
                  Browse Challenges <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-slate-300 text-slate-900 hover:bg-gray-50 font-bold h-14 px-8 text-lg bg-transparent"
                >
                  Learn More
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
                  <div className="text-3xl font-black text-primary">$24K</div>
                  <div className="text-sm text-slate-600 font-semibold">
                    Paid Out
                  </div>
                </div>
                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-4 border border-secondary/20">
                  <div className="text-3xl font-black text-secondary">2.3K</div>
                  <div className="text-sm text-slate-600 font-semibold">
                    Active Users
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
                  <div className="text-3xl font-black text-blue-600">156</div>
                  <div className="text-sm text-slate-600 font-semibold">
                    Challenges
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-4">
              <div className="bg-gradient-to-br from-primary/5 to-white rounded-3xl p-8 border-2 border-primary/20 hover:border-primary/40 transition">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Record & Prove
                </h3>
                <p className="text-slate-600">
                  Upload your workout proof video
                </p>
              </div>

              <div className="bg-gradient-to-br from-secondary/5 to-white rounded-3xl p-8 border-2 border-secondary/20 hover:border-secondary/40 transition">
                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Get Verified
                </h3>
                <p className="text-slate-600">
                  Community votes on authenticity
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/5 to-white rounded-3xl p-8 border-2 border-green-500/20 hover:border-green-500/40 transition">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Earn USDC
                </h3>
                <p className="text-slate-600">
                  Get paid instantly to your wallet
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how"
        className="py-20 bg-gradient-to-b from-primary/5 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              4 simple steps to start earning
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 md:gap-0">
            {[
              { icon: Trophy, title: "Join", desc: "Pick a challenge" },
              { icon: Video, title: "Prove", desc: "Record your workout" },
              { icon: Check, title: "Verify", desc: "Community votes" },
              { icon: DollarSign, title: "Earn", desc: "Get paid in USDC" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  {i < 3 && (
                    <div className="hidden md:block absolute top-12 left-[60%] right-[-100%] h-1 bg-gradient-to-r from-primary to-transparent" />
                  )}

                  <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 hover:border-primary/50 transition group">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-600">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Challenges */}
      <section id="challenges" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">
              Featured Challenges
            </h2>
            <p className="text-xl text-slate-600">
              Join thousands earning right now
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl border-2 border-gray-200 overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all"
              >
                <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <span className="text-6xl opacity-20">{challenge.emoji}</span>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-white font-bold">
                      Popular
                    </Badge>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-4">
                    {challenge.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-primary/10 rounded-xl p-4">
                      <p className="text-xs text-primary font-bold mb-1">
                        ENTRY
                      </p>
                      <p className="text-3xl font-black text-primary">
                        ${challenge.entryFee}
                      </p>
                    </div>
                    <div className="bg-secondary/10 rounded-xl p-4">
                      <p className="text-xs text-secondary font-bold mb-1">
                        PRIZE
                      </p>
                      <p className="text-3xl font-black text-secondary">
                        ${challenge.prizePool}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <p className="text-xs text-slate-600 font-bold">
                        SPOTS FILLED
                      </p>
                      <p className="text-xs text-primary font-bold">
                        {challenge.participants}/{challenge.maxParticipants}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                        style={{
                          width: `${
                            (challenge.participants /
                              challenge.maxParticipants) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-xl">
                    Join Challenge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section
        id="rewards"
        className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Star,
                title: "Real Rewards",
                desc: "Earn actual USDC tokens",
              },
              {
                icon: Zap,
                title: "Instant Payouts",
                desc: "Get paid directly to your wallet",
              },
              {
                icon: Trophy,
                title: "Community Driven",
                desc: "Users verify each other",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center hover:border-primary/50 transition"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-lg">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary via-secondary to-primary/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to Earn?
          </h2>
          <p className="text-xl text-white/90 mb-12">
            Start with any challenge today and turn your fitness into rewards.
          </p>

          <Button className="bg-white hover:bg-gray-100 text-primary font-black h-16 px-12 text-lg shadow-xl hover:shadow-2xl transition">
            Browse Challenges <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-6 h-6 text-primary" />
                <span className="font-black text-xl text-primary">
                  FitSocial
                </span>
              </div>
              <p className="text-slate-400">Get Fit. Get Paid. Get Social.</p>
            </div>

            <div>
              <h4 className="font-black text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Browse Challenges
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Create Challenge
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
            <p>&copy; 2025 FitSocial. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
