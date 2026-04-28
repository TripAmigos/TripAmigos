import Link from 'next/link'
import { Logo } from '@/components/Logo'
import {
  ArrowRight, Users, Receipt, Plane, Building2, Shield, Send,
  BarChart3, MessageSquare, Calendar, CreditCard, CheckCircle2,
  Vote, ArrowLeftRight
} from 'lucide-react'

export default function Home() {
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
        {/* ═══════════════════ HERO ═══════════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white pointer-events-none" />

          <div className="relative w-full max-w-5xl mx-auto px-4 pt-20 pb-14 md:pt-28 md:pb-20 text-center space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <Plane size={14} />
              100% free &mdash; no booking fees, no catch
            </div>

            <div className="space-y-5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary leading-snug max-w-3xl mx-auto">
                Group bookings,
                <span className="block text-accent mt-1">made easy.</span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Chasing replies, juggling budgets, comparing flights at midnight.
                We take that off your plate so you can enjoy the trip too.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-white rounded-input font-semibold hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20 text-lg"
              >
                Plan your first trip
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════ PAIN POINTS ═══════════════════ */}
        <section className="bg-bg-soft border-y border-border">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-primary text-balance">
                Sound familiar?
              </h2>
              <p className="text-text-secondary mt-3 max-w-xl mx-auto">
                Every group trip has that one legend who volunteers to organise it. Then instantly regrets it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-card border border-border p-6 space-y-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <MessageSquare size={20} className="text-red-400" />
                </div>
                <h3 className="font-semibold text-primary">&ldquo;Where does everyone want to go?&rdquo;</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  You ask the group chat. 3 people reply. 2 just say &ldquo;anywhere warm.&rdquo;
                  Someone throws in Bali. Someone else&apos;s budget is 200 quid. Good luck.
                </p>
              </div>
              <div className="bg-white rounded-card border border-border p-6 space-y-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <CreditCard size={20} className="text-orange-400" />
                </div>
                <h3 className="font-semibold text-primary">&ldquo;What&apos;s everyone&apos;s budget?&rdquo;</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Half the group won&apos;t commit. The other half have wildly different numbers.
                  You end up with 15 Skyscanner tabs open at midnight trying to make it work.
                </p>
              </div>
              <div className="bg-white rounded-card border border-border p-6 space-y-3">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Calendar size={20} className="text-yellow-500" />
                </div>
                <h3 className="font-semibold text-primary">&ldquo;When is everyone free?&rdquo;</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Someone can&apos;t do June. Someone can only do weekends.
                  By the time you nail down dates, the cheap flights are gone.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <p className="text-primary font-semibold text-lg">
                TripAmigos replaces all of that with one link.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════ HOW IT WORKS (compact) ═══════════════════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                How it works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Send size={22} className="text-accent" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                  Step 1
                </div>
                <h3 className="font-semibold text-primary">Create &amp; invite</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Name your trip, add emails, hit send. Everyone gets a personal link to fill in their preferences. No account needed.
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <BarChart3 size={22} className="text-accent" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                  Step 2
                </div>
                <h3 className="font-semibold text-primary">See the results</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your dashboard shows the overlap &mdash; top destinations, budget sweet spot, and the dates that work for everyone.
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={22} className="text-accent" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wide">
                  Step 3
                </div>
                <h3 className="font-semibold text-primary">Compare &amp; book</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  We search flights and hotels for your group. Pick the best options, hit book, and everyone gets their confirmation.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
              >
                See the full walkthrough
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════ EXPENSE SPLITTING ═══════════════════ */}
        <section className="bg-bg-soft border-y border-border">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              {/* Mockup: Expense tracker */}
              <div className="flex-1 max-w-sm w-full order-2 md:order-1">
                <div className="bg-white rounded-card border border-border shadow-lg overflow-hidden p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Trip expenses</p>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">£847.50 total</span>
                  </div>
                  {[
                    { desc: 'Airport taxi', who: 'Tom', amount: '£32.00', icon: '🚕', cat: 'Transport' },
                    { desc: 'Dinner at La Boqueria', who: 'You', amount: '£124.50', icon: '🍽️', cat: 'Food' },
                    { desc: 'Club entry + drinks', who: 'Danny', amount: '£86.00', icon: '🍹', cat: 'Drinks' },
                    { desc: 'Boat trip', who: 'Chris', amount: '£200.00', icon: '🚤', cat: 'Activities' },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-input bg-bg-soft">
                      <span className="text-lg">{e.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">{e.desc}</p>
                        <p className="text-[10px] text-text-muted">Paid by {e.who} &middot; {e.cat}</p>
                      </div>
                      <p className="text-xs font-bold text-primary">{e.amount}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Settle up</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-primary">You</span>
                      <ArrowLeftRight size={12} className="text-accent" />
                      <span className="font-medium text-primary">Tom</span>
                      <span className="ml-auto font-bold text-accent">£18.25</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-primary">Chris</span>
                      <ArrowLeftRight size={12} className="text-accent" />
                      <span className="font-medium text-primary">Danny</span>
                      <span className="ml-auto font-bold text-accent">£9.50</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  Built-in
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-primary">
                  Split expenses without the awkward maths
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Forget &ldquo;who owes who for the taxi?&rdquo; Log expenses as you go,
                  and at the end of the trip we calculate the minimum number of transfers to settle everyone up.
                  Like Splitwise, but built right into your trip.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Log on the go</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Equal or custom splits</span>
                  <span className="text-xs bg-bg-soft border border-border rounded-full px-3 py-1 text-text-secondary">Minimum transfers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ FEATURES GRID ═══════════════════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Everything the organiser needs
              </h2>
              <p className="text-text-secondary mt-3 max-w-lg mx-auto">
                We built every feature around one question: what would make the organiser&apos;s life easier?
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-card border border-border p-5 space-y-2.5 hover:border-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Send size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-sm">One-link invites</h3>
                <p className="text-sm text-text-secondary">Send a personal link to each attendee. They fill in preferences without creating an account.</p>
              </div>

              <div className="bg-white rounded-card border border-border p-5 space-y-2.5 hover:border-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Vote size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-sm">Group voting</h3>
                <p className="text-sm text-text-secondary">Destinations, dates, budgets &mdash; everyone picks their favourites and you see the results instantly.</p>
              </div>

              <div className="bg-white rounded-card border border-border p-5 space-y-2.5 hover:border-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Plane size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-sm">Multi-airport flight search</h3>
                <p className="text-sm text-text-secondary">People flying from different cities? We search routes from everyone&apos;s home airport automatically.</p>
              </div>

              <div className="bg-white rounded-card border border-border p-5 space-y-2.5 hover:border-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Building2 size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-sm">Hotel matching</h3>
                <p className="text-sm text-text-secondary">Accommodation options filtered to the group&apos;s budget &mdash; hostels to boutique hotels, you choose.</p>
              </div>

              <div className="bg-white rounded-card border border-border p-5 space-y-2.5 hover:border-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Receipt size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-sm">Expense splitting</h3>
                <p className="text-sm text-text-secondary">Track who paid what during the trip. Settle up at the end with the fewest transfers possible.</p>
              </div>

              <div className="bg-white rounded-card border border-border p-5 space-y-2.5 hover:border-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-primary text-sm">Organiser mode</h3>
                <p className="text-sm text-text-secondary">Want full control? Skip the voting and plan everything yourself. Perfect for surprise trips or tight deadlines.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ WHO IT'S FOR ═══════════════════ */}
        <section className="bg-bg-soft border-y border-border">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Whatever the trip, we&apos;ve got you
              </h2>
              <p className="text-text-secondary mt-3 max-w-lg mx-auto">
                The trip changes. The audience changes. But the person pulling their hair out trying to organise it? That&apos;s always the same. That&apos;s who we built this for.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-10">
              {[
                { emoji: '🎉', label: 'Stag dos', desc: 'Herd the lads, book the chaos' },
                { emoji: '💅', label: 'Hen parties', desc: 'Matching flights, not just robes' },
                { emoji: '🏖️', label: 'Lads holidays', desc: 'Sun, cheap flights, sorted' },
                { emoji: '👯‍♀️', label: 'Girls trips', desc: 'Everyone\'s budget, one search' },
                { emoji: '⛳', label: 'Golf trips', desc: 'Tee times & transfers in one' },
                { emoji: '🏢', label: 'Work away days', desc: 'No more spreadsheet sign-ups' },
                { emoji: '👨‍👩‍👧‍👦', label: 'Family holidays', desc: 'Grandma flies from Spain? Easy' },
                { emoji: '🎂', label: 'Birthday trips', desc: 'Surprise-proof with organiser mode' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-card border border-border p-4 hover:border-accent/30 hover:shadow-sm transition-all text-center space-y-1.5">
                  <span className="text-3xl block">{item.emoji}</span>
                  <p className="text-sm font-semibold text-primary">{item.label}</p>
                  <p className="text-[11px] text-text-secondary leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ ORGANISER SPOTLIGHT ═══════════════════ */}
        <section className="bg-white">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Users size={28} className="text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-balance">
              Built for the organiser. <br className="hidden sm:block" />Used by the whole group.
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed text-lg">
              You create the trip. Your mates just click a link and fill in what they want.
              No app download, no account needed, no &ldquo;can you resend that form.&rdquo;
              Everyone&apos;s preferences land on your dashboard in real time.
              When you&apos;re ready, compare flights and hotels and book the lot.
            </p>
            <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
              After booking, everyone gets their itinerary, and you can track expenses on the go.
              At the end? One tap to see who owes who. You go from &ldquo;nightmare group chat admin&rdquo;
              to &ldquo;absolute legend who sorted the whole trip.&rdquo;
            </p>
          </div>
        </section>

        {/* ═══════════════════ FINAL CTA ═══════════════════ */}
        <section className="bg-gradient-to-r from-accent to-blue-500">
          <div className="max-w-3xl mx-auto px-4 py-16 md:py-20 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">
              Stop being the group&apos;s unpaid travel agent.
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">
              Create a trip in 60 seconds. Share the link. Let everyone weigh in. Book when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-accent rounded-input font-semibold hover:bg-blue-50 transition-colors shadow-lg text-lg"
              >
                Plan your first trip
                <ArrowRight size={20} />
              </Link>
            </div>
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
