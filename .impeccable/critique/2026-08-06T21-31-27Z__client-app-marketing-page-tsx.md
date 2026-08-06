---
target: Marketing homepage
total_score: 18
max_score: 32
na_heuristics: 5,9
p0_count: 1
p1_count: 1
timestamp: 2026-08-06T21-31-27Z
slug: client-app-marketing-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading indicators, skeleton states, or scroll progress; reveal animation is the only below-the-fold signal |
| 2 | Match Between System and Real World | 3 | Sports language is natural; "Tell Your Arc" section title will confuse first visitors who don't yet know the brand |
| 3 | User Control and Freedom | 2 | 7-section linear scroll with no anchor nav, no skip links, no "jump to how it works" |
| 4 | Consistency and Standards | 3 | Token system is rigorous, but no CTA on the page uses rounded-pill (9999px) — the brand-mandated shape for all interactive primitives |
| 5 | Error Prevention | n/a | No form inputs on this surface |
| 6 | Recognition Rather Than Recall | 3 | Icons are labeled; ledger uses familiar receipt patterns; good |
| 7 | Flexibility and Efficiency | 1 | Single linear scroll path; no anchor nav, no keyboard shortcuts, carousel scroll buttons hidden on mobile |
| 8 | Aesthetic and Minimalist Design | 2 | 7 sections for a pre-launch product; three sections repeat the same value prop; WhyArc section is 175 lines of dense content |
| 9 | Help Users Recognize/Diagnose/Recover from Errors | n/a | No error states on this surface |
| 10 | Help and Documentation | 2 | No FAQ, no "how it works" deep-link; /support link in BackingTeaser is a promise with no payoff if the page is a stub |
| **Total** | | **18/32** | **Acceptable — significant improvements needed** |

Heuristics 5 and 9 scored n/a (no form inputs or error states on a marketing landing page). Max applicable: 32.

## Design Specificity Verdict

**LLM assessment — category-interchangeable scaffold around one genuinely authored section.**

The page has a split identity. One section — BackingTeaserSection — is unmistakably Athlete Arc: it renders an itemized cost ledger with per-line receipt status, directly materializing the platform's core transparency promise. The rest of the page is category-generic. Hero headline works equally well for Behance with one word swapped. TellYourArcSection is the universal SaaS onboarding pattern. Hero uses stock Unsplash marathon runner. SuccessStoriesSection reuses same stock photo IDs as TrendingAthletes — same fictional athlete appears twice, all shown athletes are runners despite niche-sport targeting.

**Deterministic scan — 2 findings on homepage components, both side-tab rule.**

SuccessStoriesSection.tsx:55 — border-l-4 on a blockquote that also carries `italic` (brand rule violation). Both assessments converge on this element.

WhyArcSection.tsx:146 — border-l-4 on a pull-quote div. Probable false positive (typographic callout, not a card).

**Additional manual scan findings (Assessment B):**
- bg-white token bypass in 5+ home section components instead of bg-surface-bright
- Hardcoded hex values #140b08 / #160d09 in photo scrim gradients; no photo-scrim token in globals.css
- Primary color shadow expressed as rgba(171,54,0,0.4) in TellYourArcSection.tsx:30 instead of referencing --color-primary

## Overall Impression

The design system underneath this page is genuinely excellent — production-grade tokens, rigorous glass/grain effects, proper reduced-motion handling. The problem is the page architecture. The single best argument for Athlete Arc's existence (the transparency ledger) is buried fifth of seven sections while a stock photo runner and three restatements of the same value proposition precede it.

## What's Working

1. BackingTeaserSection transparency ledger is a genuinely differentiated UI pattern — itemized cost lines with per-line receipt states. No competitor can replicate this without changing what they are.

2. Design token system is production-grade — complete surface tier system, glass/grain effects, Ken Burns, reveal animations, thorough prefers-reduced-motion coverage.

3. Competitive positioning copy is editorially sharp — "Strava Clutter" / "Instagram Trap" with skeleton UI mockups is authored for this product.

## Priority Issues

**[P0] The page cannot decide who it's for.**
What: Persuade surface targets athletes as primary user, but page simultaneously serves athletes (hero CTA "Build your story") and supporters (TrendingAthletes carousel). HomeCtaSection gives both paths equal visual weight.
Why: A non-technical athlete in their first 10 seconds sees a hero, then a carousel of other athletes, then a competitive positioning section — never gets a clear "what do I do here?"
Fix: Commit to athletes as the Persuade target. Reduce TrendingAthletes to 2-card social proof. Move supporter path to secondary positioning in footer CTA.
Command: /impeccable shape

**[P1] The transparency differentiator is buried 5 sections deep.**
What: BackingTeaserSection with itemized ledger is section 5 of 7. On mobile, 3+ full viewport heights of scroll past the hero.
Why: The only thing on the page a competitor cannot replicate. Visitors who leave before reaching it experience Athlete Arc as another generic sports social network.
Fix: Move BackingTeaserSection to position 2, immediately after the hero.
Command: /impeccable layout

**[P2] No CTA on the page uses the brand-mandated pill shape.**
What: Brand spec mandates border-radius: 9999px for all interactive primitives. Hero CTA uses rounded-button (0.5rem), TellYourArcSection CTA uses rounded-card (1rem), HomeCtaSection CTAs use rounded-button (0.5rem).
Why: The pill covenant is the system's single most distinctive formal decision. Its absence on every CTA means the authored design language isn't expressed on the primary surface.
Fix: Replace all CTA button rounded-* classes with rounded-full.
Command: /impeccable polish

**[P3] SuccessStoriesSection violates two brand rules simultaneously.**
What: SuccessStoriesSection.tsx:55 carries both border-l-4 (detector finding) and italic (brand rule: no italic type).
Fix: Remove italic class. Apply font-medium. Remove border-l-4 if using color treatment alone.
Command: /impeccable polish

**[P3] Currency defaults to USD on a Canada-first product.**
What: formatCents() defaults to 'USD'. BackingTeaserSection calls formatCents(line.amountCents) without specifying currency.
Fix: Pass 'CAD' to formatCents() in BackingTeaserSection or change default.
Command: /impeccable harden

## Persona Red Flags

**Jordan (Confused First-Timer)**
- Page never answers "What is this?" in plain language — hero copy is poetic but non-explanatory
- "Coming soon" on step 03 with no notification mechanism
- No pricing information anywhere

**Casey (Distracted Mobile User)**
- TrendingAthletes carousel scroll buttons are hidden md:flex — no mobile scroll affordance
- WhyArcSection connector element hidden md:flex — problem card relationship lost on mobile
- Hero CTA buttons are top-of-screen on mobile, outside thumb zone

**The Amateur Athlete (niche sport)**
- "Running" referenced 14+ times; every athlete shown is a runner; bottom CTA says "Discover runners"
- "Build your story" doesn't connect to funding
- No preview of registration, no "takes 5 minutes" reassurance

## Minor Observations

- Heading hierarchy: TrendingAthletes uses h3 as a top-level section (should be h2); TellYourArcSection step titles use h4 skipping h3
- TellYourArcSection uses py-12 while all other sections use py-20–py-24 — disrupts vertical rhythm
- SuccessStoriesSection reuses same Unsplash photo IDs as TrendingAthletes — same person appears twice
- bg-white used directly instead of bg-surface-bright in 5+ components (token bypass)
- Photo scrim hardcoded hex values #140b08 / #160d09 not in design token system

## Questions to Consider

1. What if the hero showed a live (or mock-live) campaign instead of a stock photo — cost lines, progress bar, athlete photo as the first visual?
2. What if the page routed visitors instead of serving them equally — "I'm an athlete" / "I'm a supporter" hero split?
3. Is the competitive positioning section earning its scroll depth, or should it come after the transparency proof rather than before?
