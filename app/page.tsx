import Link from 'next/link'
import { SCENARIOS } from '@/lib/scenarios'

const difficultyLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#07070f', color: '#e2e2f0' }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          background: 'rgba(7,7,15,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}
          >
            💬
          </div>
          <span className="font-bold text-xl tracking-tight">ConvoCoach</span>
        </div>
        <Link
          href="/play"
          className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', color: 'white' }}
        >
          Play Now
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-32 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 orb" style={{ background: 'rgba(124,92,252,0.12)' }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 orb" style={{ background: 'rgba(6,182,212,0.09)' }} />
        <div
          className="absolute bottom-0 left-1/2 w-[600px] h-[300px] orb"
          style={{ background: 'rgba(0,214,143,0.05)', transform: 'translateX(-50%)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
            style={{
              background: 'rgba(124,92,252,0.15)',
              border: '1px solid rgba(124,92,252,0.3)',
              color: '#a78bfa',
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 inline-block"
              style={{ animation: 'pulse 2s infinite' }}
            />
            AI-powered conversational skills training
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Talk your way to a{' '}
            <span className="gradient-text">better you</span>
          </h1>

          <p
            className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#8888aa' }}
          >
            Practice real social situations with AI characters that react naturally to how you speak.
            Build confidence, get scored, and improve — without the social risk.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/play"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)',
                color: 'white',
                boxShadow: '0 0 40px rgba(124,92,252,0.35)',
              }}
            >
              Start Practising Free <span>→</span>
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#8888aa' }}
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Floating chat preview */}
        <div className="relative z-10 mt-20 w-full max-w-2xl mx-auto">
          <div className="space-y-4 px-4">
            <div className="flex justify-start" style={{ animation: 'float 6s ease-in-out 0s infinite' }}>
              <div
                className="max-w-xs px-5 py-3 rounded-2xl text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e2f0',
                }}
              >
                Excuse me — do you know where the chickpeas are?
              </div>
            </div>
            <div className="flex justify-end" style={{ animation: 'float 7.5s ease-in-out 1s infinite' }}>
              <div
                className="max-w-xs px-5 py-3 rounded-2xl text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', color: 'white' }}
              >
                Oh sure! Aisle 6, next to the lentils. Actually... could you help me reach that tin up there?
              </div>
            </div>
            <div className="flex justify-start" style={{ animation: 'float 9s ease-in-out 2s infinite' }}>
              <div
                className="max-w-xs px-5 py-3 rounded-2xl text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e2f0',
                }}
              >
                Of course — here you go! Thanks so much for the help.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-32 px-6"
        style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#7c5cfc' }}
            >
              How It Works
            </p>
            <h2 className="text-5xl font-black tracking-tight">Your personal conversation gym</h2>
            <p className="mt-4 text-xl max-w-xl mx-auto" style={{ color: '#4a4a6a' }}>
              Like a flight simulator for social skills — practise without real-world stakes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                accent: '#7c5cfc',
                title: 'Choose Your Scenario',
                body: 'From the supermarket to a birthday party — pick a realistic social situation and dive straight in.',
              },
              {
                icon: '🧠',
                accent: '#06b6d4',
                title: 'AI Adapts to You',
                body: 'Our AI characters respond like real people — reacting to your tone, mood, and word choice.',
              },
              {
                icon: '📈',
                accent: '#00d68f',
                title: 'Get Instant Coaching',
                body: 'After each session, receive a breakdown of your confidence, politeness, empathy, and more.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="p-8 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6"
                  style={{ background: `${item.accent}22`, border: `1px solid ${item.accent}44` }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="leading-relaxed" style={{ color: '#4a4a6a' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section id="scenarios" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#00d68f' }}
            >
              Available Now
            </p>
            <h2 className="text-5xl font-black tracking-tight">
              Pick your <span className="gradient-text">challenge</span>
            </h2>
            <p className="mt-4 text-xl" style={{ color: '#4a4a6a' }}>
              Three scenarios, escalating difficulty. More coming soon.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {SCENARIOS.map(scenario => {
              const primaryCount = scenario.objectives.filter(o => o.type === 'primary').length
              const bonusCount = scenario.objectives.filter(o => o.type === 'bonus').length
              return (
                <Link
                  key={scenario.id}
                  href={`/scenario/${scenario.id}`}
                  className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 0 0 0 rgba(124,92,252,0)',
                  }}
                >
                  {/* Card gradient header */}
                  <div className={`bg-gradient-to-br ${scenario.bgGradient} px-6 pt-8 pb-10 relative`}>
                    <div className="text-4xl mb-3">{scenario.emoji}</div>
                    <h3 className="text-xl font-bold text-white">{scenario.name}</h3>
                    <p className="text-sm text-white/60 mt-1 leading-relaxed">{scenario.description}</p>
                    <div className="absolute bottom-0 right-0 text-7xl opacity-10 leading-none translate-x-3 translate-y-3">
                      {scenario.emoji}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(124,92,252,0.12)',
                          border: '1px solid rgba(124,92,252,0.3)',
                          color: '#a78bfa',
                        }}
                      >
                        {difficultyLabel[scenario.difficulty]}
                      </span>
                      <span className="text-xs" style={{ color: '#4a4a6a' }}>
                        {scenario.npcs.length} characters
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: '#8888aa' }}>
                      <span style={{ color: '#e2e2f0' }} className="font-medium">{primaryCount}</span> main objectives
                      {bonusCount > 0 && (
                        <> + <span style={{ color: '#f7c948' }} className="font-medium">{bonusCount}</span> bonus</>
                      )}
                    </div>
                    <div
                      className="w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: 'rgba(124,92,252,0.1)',
                        border: '1px solid rgba(124,92,252,0.3)',
                        color: '#7c5cfc',
                      }}
                    >
                      Play →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div
            className="mt-6 rounded-2xl p-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-sm" style={{ color: '#4a4a6a' }}>
              More scenarios coming — office, coffee shop, networking event...
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-32 px-6 relative overflow-hidden"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] orb" style={{ background: 'rgba(124,92,252,0.07)' }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black tracking-tight mb-6">
            Every great conversation<br />
            <span className="gradient-text">starts with practice</span>
          </h2>
          <p className="text-xl mb-10" style={{ color: '#4a4a6a' }}>
            The job. The date. The room that finally listens. It starts with how you speak.
          </p>
          <Link
            href="/play"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)',
              color: 'white',
              boxShadow: '0 0 60px rgba(124,92,252,0.35)',
            }}
          >
            Choose a Scenario <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#4a4a6a' }}
      >
        <div className="flex items-center gap-2 font-semibold" style={{ color: '#8888aa' }}>
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}
          >
            💬
          </div>
          ConvoCoach
        </div>
        <p>Powered by Claude AI · All conversations are private</p>
      </footer>
    </div>
  )
}
