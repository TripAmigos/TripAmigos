import Link from 'next/link'
import { Logo } from '@/components/Logo'
import {
  ArrowRight, Check, Users, Plane, Building2, Clock,
  ArrowLeftRight
} from 'lucide-react'

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Nav */}
      <nav className="border-b border-border bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" linkTo="/" />
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-primary font-medium hover:text-accent transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-accent text-white rounded-input font-medium hover:bg-accent-hover transition-colors"
            >
              Start planning
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white pointer-events-none" />
          <div className="relative w-full max-w-5xl mx-auto px-4 pt-16 pb-10 md:pt-24 md:pb-16 text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              How it works
            </h1>
            <p className="text-text-secondary max-w-lg mx-auto text-lg">
              Three steps. No spreadsheets. No awkward &ldquo;can everyone fill this in&rdquo; messages.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 pb-16 md:pb-24 space-y-20">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                  Step 1
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-primary">
                  Create a trip &amp; invite the group
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Give your trip a name, add everyone&apos;s email, and hit send. Each person gets a personal invite link
                  where they fill in their budget, available dates, preferred destinations, airport, and must-haves.
                  No account needed for them &mdash; they just click and fill.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Invite by email</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">No sign-up needed</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Passport name check</span>
                </div>
              </div>
              {/* Mockup: Invite form */}
              <div className="flex-1 max-w-sm w-full">
                <div className="bg-white rounded-card border border-border shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-accent to-blue-500 px-5 py-4">
                    <p className="text-white/70 text-xs font-medium">TRIP AMIGOS</p>
                    <p className="text-white font-bold text-lg mt-0.5">Jake&apos;s Stag Do 2026</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-input">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Check size={14} className="text-green-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">Tom W.</p>
                        <p className="text-[10px] text-text-muted">Submitted preferences</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-input">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Check size={14} className="text-green-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">Danny M.</p>
                        <p className="text-[10px] text-text-muted">Submitted preferences</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-input">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center"><Clock size={14} className="text-yellow-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">Chris B.</p>
                        <p className="text-[10px] text-text-muted">Invite sent &mdash; waiting</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-input">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center"><Clock size={14} className="text-yellow-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">Reece J.</p>
                        <p className="text-[10px] text-text-muted">Invite sent &mdash; waiting</p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-[10px] text-text-muted">2 of 4 submitted</div>
                      <div className="w-full bg-border rounded-full h-1.5 mt-1">
                        <div className="bg-accent rounded-full h-1.5" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                  Step 2
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-primary">
                  See what the group actually wants
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Once everyone&apos;s replied, your dashboard shows you the overlap &mdash; which destinations got the most votes,
                  the budget range that works for everyone, and the dates people are free.
                  No more guessing, no more &ldquo;I think most people said...&rdquo;
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Destination voting</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Budget overlap</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Live results</span>
                </div>
              </div>
              {/* Mockup: Voting dashboard */}
              <div className="flex-1 max-w-sm w-full">
                <div className="bg-white rounded-card border border-border shadow-lg overflow-hidden p-5 space-y-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Destination votes</p>
                  {[
                    { city: 'Barcelona', votes: 4, pct: 100, flag: '🇪🇸' },
                    { city: 'Lisbon', votes: 3, pct: 75, flag: '🇵🇹' },
                    { city: 'Krakow', votes: 2, pct: 50, flag: '🇵🇱' },
                    { city: 'Amsterdam', votes: 1, pct: 25, flag: '🇳🇱' },
                  ].map((d) => (
                    <div key={d.city} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-primary">{d.flag} {d.city}</span>
                        <span className="text-text-muted">{d.votes} votes</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-accent rounded-full h-full flex items-center transition-all"
                          style={{ width: `${Math.max(d.pct, 8)}%` }}
                        >
                          {d.pct >= 40 && <span className="text-white text-[9px] font-bold ml-2">{d.pct}%</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex justify-between text-xs text-text-secondary">
                    <span>Budget sweet spot</span>
                    <span className="font-semibold text-primary">£400 – £600pp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                  Step 3
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-primary">
                  Compare options &amp; book for everyone
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We search flights from everyone&apos;s home airports and find hotels in the group&apos;s budget.
                  Prices, times, ratings &mdash; all side by side. Pick the winners,
                  hit book, and everyone gets their confirmation. You&apos;re officially a hero.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Real flight prices</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Hotel comparison</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">One-click booking</span>
                </div>
              </div>
              {/* Mockup: Flight options */}
              <div className="flex-1 max-w-sm w-full">
                <div className="bg-white rounded-card border border-border shadow-lg overflow-hidden p-5 space-y-3">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Flights to Barcelona</p>
                  {[
                    { airline: 'Ryanair', from: 'LGW', dep: '06:15', arr: '09:40', price: '£43', best: true },
                    { airline: 'easyJet', from: 'LGW', dep: '10:30', arr: '13:55', price: '£67', best: false },
                    { airline: 'Vueling', from: 'LHR', dep: '14:20', arr: '17:35', price: '£89', best: false },
                  ].map((f, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-input border ${f.best ? 'border-accent bg-accent/5' : 'border-border'}`}>
                      <Plane size={14} className={f.best ? 'text-accent' : 'text-text-muted'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-primary">{f.airline}</p>
                          {f.best && <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded font-bold">BEST VALUE</span>}
                        </div>
                        <p className="text-[10px] text-text-muted">{f.from} &middot; {f.dep} &rarr; {f.arr}</p>
                      </div>
                      <p className={`text-sm font-bold ${f.best ? 'text-accent' : 'text-primary'}`}>{f.price}</p>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 p-3 rounded-input border border-border">
                      <Building2 size={14} className="text-text-muted" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-primary">Hotel Arts Barcelona</p>
                        <p className="text-[10px] text-text-muted">4-star &middot; Las Ramblas &middot; 4 nights</p>
                      </div>
                      <p className="text-sm font-bold text-primary">£112<span className="text-[10px] font-normal text-text-muted">/pp</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-accent to-blue-500">
          <div className="max-w-3xl mx-auto px-4 py-16 md:py-20 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">
              Ready to try it?
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">
              Create a trip in 60 seconds. Share the link. Let everyone weigh in. Book when you&apos;re ready.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-accent rounded-input font-semibold hover:bg-blue-50 transition-colors shadow-lg text-lg"
            >
              Plan your first trip
              <ArrowRight size={20} />
            </Link>
            <p className="text-blue-200 text-sm">
              Free forever. No card needed. No booking fees.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" linkTo="/" />
              <span className="text-sm text-text-secondary ml-1">Group trips, sorted.</span>
            </div>
            <p className="text-sm text-text-muted">
              &copy; {new Date().getFullYear()} TripAmigos. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
