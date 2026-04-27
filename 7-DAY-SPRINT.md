# BlogOS — 7-Day Sprint Plan (v2 — Detailed)

> **Rule:** Every day = one complete session. No placeholders. No TODOs. Ship working code.
> This file is the source of truth. Read it before writing any code.

---

## GLOBAL REQUIREMENTS (READ BEFORE EVERY DAY)

### Brand & Identity
- **Product:** BlogOS
- **Company:** Build With Esha
- **Founder:** Esha Sabir
- **Admin email:** esharanarajpoott@gmail.com
- **WhatsApp:** +923290503919 (floating button on all public pages)
- **WhatsApp pre-fill:** "Hi Esha, I saw your website and want to discuss a project."

### Tech Stack
- Next.js 14 App Router (TypeScript)
- Tailwind CSS 3.4 + CSS variables for theming
- next-themes (defaultTheme: "light", enableSystem: false)
- Firebase Auth + Firestore + Firebase Admin SDK
- Groq SDK (model: llama-3.3-70b-versatile)
- Firecrawl JS SDK (firecrawl.search) for scraping
- Replicate API for featured image generation
- framer-motion for all animations
- CVA + clsx + tailwind-merge for component variants

### Theme System
- **Default: LIGHT theme**
- CSS variables in `:root` (light) and `.dark` (dark mode)
- ThemeToggle: animated pill, spring-sliding knob, rotating sun ↔ fading stars

### Subscription Tiers
| Plan | Price | Blogs | WordPress | Cluster Engine |
|---|---|---|---|---|
| Free | $0 | 2 | ✗ | ✗ |
| Pro | $19/mo | 12 | ✓ | ✗ |
| Business | $39/mo | 30 | ✓ | ✓ |

- Payment: Manual via WhatsApp. Admin upgrades plan from admin panel.
- Hard usage limit: check before generation starts. Block with upgrade prompt.

### Key API Keys (all in .env.local)
```
GROQ_API_KEY=...
FIRECRAWL_API_KEY=...
REPLICATE_API_KEY=...
NEXT_PUBLIC_FIREBASE_* (6 keys)
FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=esharanarajpoott@gmail.com
ADMIN_BOOTSTRAP_SECRET=blogos-admin-bootstrap-2025
```

### Firestore Collections
- `users/{uid}` — BlogOSUser document
- `blogs/{blogId}` — Blog document
- `clusters/{clusterId}` — ClusterPlan document

---

## FULL WORKFLOW: Free / Pro Users (2 blogs or 12 blogs)

### Step 1 — User Input
- Niche (text) + Topic (text, or brainstorm) + Region + Content Type
- Content Types: Informational / Commercial / Transactional
- Content type shifts keywords, tone, CTA in all prompts

### Step 2 — Topic Brainstorm (optional)
- If user clicks "Brainstorm", call Groq with niche+region
- Return 5 specific searchable topic suggestions as clickable chips

### Step 3 — Scrape Top Pages (Firecrawl)
- `firecrawl.search(topic + " " + region, { limit: 10 })`
- Extract title, URL, markdown content from each page
- If site blocks bots or returns empty: set `useFallback = true`
- Fallback: Groq uses its internal SEO knowledge (no live data)
- Show scraping progress in UI step tracker

### Step 4 — Keyword & Meta Extraction (Groq)
- Input: scraped content (or fallback flag)
- Extract from Groq:
  - 1 primary long-tail keyword (3-6 words, region-specific)
  - 4 secondary keywords
  - 20 semantic / LSI keywords
  - SEO title (under 60 chars)
  - Meta description (under 155 chars, action-oriented)
  - URL permalink (slug)

### Step 5 — Blog Structure (Groq)
- Input: all keywords + competitor content
- Output: 10 sections with H2 headings + intent per section
- EXACTLY: 1 intro + 6 body + 1 conclusion + 1 CTA + 1 FAQ
- Requirements: keyword-rich H2s, E-E-A-T signals, outperform competitors
- FAQ section: 6 real questions people search for

### Step 6 — Write Blog Content (Groq, section by section, streamed via SSE)
**Exact Prompt per section:**
```
Write SEO-optimized, human-written content based on the keyword I provide.
The content must be semantically optimized, covering related entities, concepts,
and search intent around the keyword. Follow these rules strictly:
150 total words per section • Write in simple English (5th-grade level)
• Use active voice and natural human tone
• Avoid robotic, AI-like phrases or filler words
• Make the content 100% unique and plagiarism-free
• Optimize for SEO, semantic search, and Answer Engine Optimization (AEO)
• Follow Google E-E-A-T principles (Experience, Expertise, Authority, Trust)
• Write the article as if I personally tested or experienced the tools, plugins, or methods
• Use first-person voice ("I"), not "we"
• Include comparisons, insights, and practical observations like a real reviewer
• Cover related subtopics, and supporting entities to improve topical authority
Structure: Clear headings (H1, H2, H3) • Short paragraphs • Bullet points where helpful
• Direct answers to user questions
• Avoid unnecessary commas, dashes, separators, and hyphens
Goal: human-like content that ranks in search engines and AI answer engines
FAQ section: end with 6 FAQ keyword-enriched questions.
```
- **Target: 1500 words total** across all 10 sections
- Stream each section token-by-token to UI
- Show progress bar + current section in UI

### Step 7 — Final Audit (Groq)
- Grammar check, remove AI-sounding words, hyphens
- Rewrite with primary + 4 secondary + 20 semantic keywords injected
- Check word count, E-E-A-T signals
- Add external link to one of the top scraped blogs
- Generate self AI SEO score (0-100) with breakdown

### Step 8 — Schema Generation (Groq)
- Generate JSON-LD Article + FAQ schema markup
- Include: @context, @type, headline, description, author, publisher, url, keywords

### Step 9 — Return Results to User
- Full blog in markdown with meta data panel
- SEO title, meta description, permalink, all keywords
- AI SEO score with breakdown (keyword usage, content depth, readability, structure)
- Featured image prompt + generated image (Replicate SDXL)
- JSON-LD schema (copyable)
- List of 10 scraped competitor URLs

---

## FULL WORKFLOW: Business Users (30 blogs + Cluster Engine)

### Additional Step — NLP Keyword Research Workbook (Groq)
**Exact Prompt:**
```
Act as an Expert Keyword Research specialist. Brainstorm NLP categories for keyword: "{TOPIC} {REGION}".
Categories: Synonyms, Antonyms, Homonyms, Homophones, Homographs, Hypernyms, Hyponyms, Meronyms, Holonyms, Acronyms.
Return a workbook with:
Sheet 1 — NLP Keyword Categories: 80+ keyword variations across all 10 linguistic categories
Sheet 2 — Topical Authority Content Map: 30+ page content strategy in clusters with target keywords and priority levels
Sheet 3 — SERP & Competitive Insights: what's ranking, key gaps, content opportunities
Sheet 4 — LSI & Semantic Keywords: 35+ semantically related terms grouped by service, process, cost, material, region
Also generate: primary keyword, 4 secondary keywords, 20 semantic keywords, SEO title, meta description, permalink for each article.
```

### 30-Day Cluster Plan (Groq)
**Exact Prompt:**
```
Create a 30-day blog strategy (1 blog/day) for "{TOPIC}" in "{REGION}".
Articles must be based on user queries about the topic/services in a natural way.
Satisfy intent and sentiment using the workbook generated.
Return a detailed table with these columns:
# | Month | Week | Day | Title | Intent | Sentiment | Target Query | NLP Category | Funnel | Format | Word Count | CTA | Internal Links (permalink) | Primary Keyword | Secondary Keywords | Notes
Make the strategy complete for the whole month. Funnel stages: TOFU/MOFU/BOFU.
Pre-generate the permalink slug for each article so internal linking is pre-wired.
```

### Content Generation for Cluster
- User selects: generate 1 blog, 2-7 blogs (week), or all 30
- Same prompts as Step 6 above but with cluster context
- Internal links pre-wired from the 30-day plan

---

## LANDING PAGE DESIGN SPEC (Day 7 — full rebuild)

### IMPORTANT: Do not add these lines:
- ❌ "Powered by Groq · Firecrawl · Replicate"
- ❌ "2 free blogs included · No credit card required"
- ❌ Any mention of specific AI providers in hero

### 1. Navbar
```
[BlogOS Logo]   Features  How It Works  Pricing  Industries    [Get Started]  [Sign In]
                                                                               [🌙 small ThemeToggle]
```
- ThemeToggle must be SMALL (not the big pill) — positioned DIRECTLY BELOW "Sign In" button
- Sticky navbar, glass morphism on scroll, border-b border-border

### 2. Hero Section
- Rotating quotes (auto-cycle every 3.5s with fade transition):
  - "Be the answer the algorithms crave."
  - "Be the answer Google and ChatGPT is looking for."
- Subtitle: describe BlogOS in 1 line
- Two CTA buttons: "Start Writing Free" (primary) + "Sign In" (secondary)
- Animated background: gradient mesh or particle canvas

### 3. Demo Section (CODED, not video)
- Centered panel showing animated pipeline:
  - Input form fills in (animated typing)
  - Step 1 appears: "Scraping 10 competitor pages..."
  - Step 2: "Extracting keywords..."
  - Step 3: "Generating blog structure..."
  - Step 4: "Writing section 1/10..."
  - Result: blog card slides in
- This is a FAKE animated demo (no real API call), runs on loop

### 4. Process Infographic (Vertical, Scroll-Triggered)
Steps appear one by one as user scrolls:
1. Enter Niche + Topic + Region
2. AI Brainstorms Topics
3. Scrape Top 10 Ranking Pages
4. Extract Keywords & Meta Data
5. Generate SEO Blog Structure (10 sections)
6. Write Content Section by Section (streamed)
7. AI Audit + SEO Score
8. Schema + Featured Image Generated
9. Publish to WordPress / Export

Each step: icon + title + description, connected by vertical line, animates in on scroll

### 5. About Section
- "BlogOS is a product of Build With Esha"
- Founder: Esha Sabir
- Include Esha's headshot (save at: `public/esha.jpg` — user must place their photo there)
- Brief bio about Esha Sabir + Build With Esha mission

### 6. 3D Particle Logo Animation
- Canvas-based particle animation
- Particles form the "BlogOS" text/logo shape
- Gently floating with mouse interaction
- Place above or alongside the about section

### 7. Industries Scrolling Carousel (Auto-scroll, pause on hover)
Each industry card: colorful icon + name, glowing border on hover
Industries: Technology, Marketing, Education, Real Estate, Social Network, E-Commerce,
Legal, Entertainment, Food & Beverage, Hospitality, Energy, Media,
Healthcare, Finance, Travel, Sports, Fashion, Automotive, Architecture, SaaS

### 8. Stats Section
- X+ Blogs Written
- X+ Happy Users
- X+ Industries Served
- 10 min Average Generation Time
(Use placeholder numbers like 2,400+, 180+, 20+)

### 9. Testimonials (20 reviews, auto-scrolling carousel)
Fake testimonials OK. Include name, role, review text.
Use a horizontal marquee-style scroll, pause on hover.

### 10. More Products Section
- "Explore more tools from Build With Esha"
- 2-3 placeholder product cards

### 11. Footer
- Logo + tagline
- Nav links
- Lead generation form: Name, Email, Message, Submit button
- Floating WhatsApp button (bottom-right, always visible)
  - Link: https://wa.me/923290503919?text=Hi%20Esha%2C%20I%20saw%20your%20website%20and%20want%20to%20discuss%20a%20project.

---

## ADMIN PANEL REQUIREMENTS

### /admin (main dashboard)
- Total users, total blogs, heavy users count
- Quick links to Users + Usage pages

### /admin/users
- Table: name, email, plan, usage, joined date
- Buttons to change plan (free / pro / business)
- When plan changes → update blogsLimit in Firestore
- Search by name/email

### /admin/usage
- Table sorted by usage descending
- Usage bar (green/amber/red at 70%/90%)
- WordPress connected badge

---

## DAY STATUS

---

## Day 1 ✅ — Foundation
- Next.js 14 + TypeScript + Tailwind
- Light/dark CSS variables + ThemeProvider
- BlogOSLogo + ThemeToggle (animated)
- Firebase client + admin + Groq + Firecrawl SDK wrappers
- Full type system in types/index.ts

---

## Day 2 ✅ — Auth + Dashboard Shell
- Firebase Auth (email + Google OAuth)
- Session cookie via Admin SDK (7 days, HttpOnly)
- Middleware route protection
- Signup / Login pages with forgot password
- AuthContext + useAuth hook (realtime Firestore)
- Dashboard sidebar, dashboard home, profile page
- Admin layout (server component, cookie + claim check)
- Admin users page, usage page, stats page
- Button, Input, Label UI components

---

## Day 3 ✅ — Core Research Engine
- `app/api/generate/brainstorm/route.ts` — Groq topic suggestions
- `app/api/scrape/route.ts` — Firecrawl search + fallback
- `app/api/keywords/route.ts` — Groq keyword + meta extraction
- `app/api/generate/structure/route.ts` — Groq 10-section outline
- `lib/groq/prompts.ts` — all Groq prompts centralized
- `components/generate/TopicForm.tsx` — niche/topic/region/contentType
- `components/generate/ProgressTracker.tsx` — live pipeline steps
- `app/(dashboard)/generate/page.tsx` — full pipeline orchestration

---

## Day 4 ✅ — Content Writing Pipeline
- `app/api/generate/content/route.ts` — SSE streaming, writes 10 sections
- `app/(dashboard)/blog/[id]/page.tsx` — blog result: outline → write → stream → score
- SEO score with breakdown + suggestions
- JSON-LD schema generation
- `app/page.tsx` — full landing page (rebuilt in Day 7 to full spec)
- `app/(dashboard)/dashboard/page.tsx` — real blog list from Firestore

### ISSUE FOUND in Day 4
- Landing page was minimal. Full landing page spec must be built on Day 7.

---

## Day 5 — Business Workflow: NLP Workbook + 30-Day Cluster
**Status: PENDING**

### Files to Build
- `app/api/workbook/route.ts` — Groq NLP keyword workbook (4 sheets as JSON)
- `app/api/cluster/route.ts` — Groq 30-day content calendar
- `app/(dashboard)/generate/business/page.tsx` — Business flow page
- `components/generate/WorkbookDisplay.tsx` — 4-tab table view
- `components/generate/ClusterTable.tsx` — 30-row interactive plan table
- Gate: Business plan only. Show upgrade CTA for Free/Pro users.
- Allow batch generation: 1 / week (7) / all 30 blogs

### Test Criteria
Business user → niche "plumbing London" → workbook with 4 sheets → 30-day plan table → generate Day 1 blog → blog result page

---

## Day 6 — WordPress + Auto-Scheduler + .docx Export
**Status: PENDING**

### Files to Build
- `lib/wordpress/api.ts` — WordPress REST API helpers
- `app/api/wordpress/connect/route.ts` — validate WP site + app password, save in Firestore
- `app/api/wordpress/publish/route.ts` — publish blog to WP with featured image + Yoast meta
- `app/api/export/docx/route.ts` — generate .docx (using `docx` npm package)
- WordPress connect UI in `/profile` (replace placeholder)
- "Publish to WordPress" + "Export .docx" buttons on blog/[id] page
- Auto-scheduler: Business users schedule 30 blogs with date offsets
- Gate: WordPress = Pro+, Auto-Scheduler = Business only

### Install
```
npm install docx
```

### Test
Connect real WordPress → publish blog → appears with correct slug, featured image, meta

---

## Day 7 — Landing Page (Full Spec) + Image Gen + Deployment
**Status: PENDING**

### Files to Build
1. `app/page.tsx` — Full landing page per design spec above (ALL 11 sections)
2. `app/api/generate/image/route.ts` — Replicate SDXL image gen → save to Firebase Storage
3. Featured image display in blog/[id] page
4. `app/(dashboard)/profile/page.tsx` — full blog history table
5. Mobile responsiveness pass on all pages
6. Vercel deployment setup

### Landing Page Must Include
- [ ] Navbar: logo + menu + [Get Started][Sign In] + small ThemeToggle below Sign In
- [ ] Hero: rotating quotes (two lines), CTA, NO mention of AI providers
- [ ] Demo: animated coded pipeline (fake, loops)
- [ ] Vertical scroll-triggered process infographic (9 steps)
- [ ] About section: Esha's headshot (public/esha.jpg) + Build with Esha bio
- [ ] 3D particle canvas logo animation
- [ ] Industries auto-scrolling carousel (20 industries, glowing hover)
- [ ] Stats section (2,400+ blogs, 180+ users, 20+ industries, 10min avg)
- [ ] Testimonials: 20 reviews, marquee scroll, pause on hover
- [ ] "More products from Build with Esha" section
- [ ] Footer: nav + lead gen form + floating WhatsApp button
- [ ] NO "Powered by Groq/Firecrawl/Replicate" text
- [ ] NO "No credit card required" text

### Pre-Deploy Checklist
- [ ] All env vars in Vercel
- [ ] Firestore security rules (users read/write own data only)
- [ ] Admin bootstrap run on prod
- [ ] `NEXT_PUBLIC_APP_URL` set to prod URL
- [ ] Full flow test: signup → generate → write → publish
- [ ] `public/esha.jpg` uploaded (Esha's headshot photo)

---

## Architecture

```
blogos/
├── app/
│   ├── page.tsx                         ← Landing page (all 11 sections)
│   ├── layout.tsx                       ← ThemeProvider + AuthProvider
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                   ← client, auth guard
│   │   ├── dashboard/page.tsx           ← usage + recent blogs
│   │   ├── generate/page.tsx            ← Free/Pro pipeline
│   │   ├── generate/business/page.tsx   ← Business workflow
│   │   ├── blog/[id]/page.tsx           ← Blog result (write, score, schema, publish)
│   │   └── profile/page.tsx             ← Plan info + blog history + WP connect
│   ├── admin/
│   │   ├── layout.tsx                   ← server component admin guard
│   │   ├── page.tsx                     ← stats overview
│   │   ├── users/page.tsx               ← user management + plan change
│   │   └── usage/page.tsx               ← usage monitoring
│   └── api/
│       ├── auth/session/route.ts
│       ├── auth/bootstrap-admin/route.ts
│       ├── scrape/route.ts
│       ├── keywords/route.ts
│       ├── workbook/route.ts            ← Day 5
│       ├── cluster/route.ts             ← Day 5
│       ├── generate/
│       │   ├── brainstorm/route.ts
│       │   ├── structure/route.ts
│       │   ├── content/route.ts         ← SSE streaming
│       │   └── image/route.ts           ← Day 7
│       ├── wordpress/
│       │   ├── connect/route.ts         ← Day 6
│       │   └── publish/route.ts         ← Day 6
│       └── export/docx/route.ts         ← Day 6
├── components/
│   ├── logo/BlogOSLogo.tsx
│   ├── theme/ThemeToggle.tsx
│   ├── layout/DashboardSidebar.tsx
│   ├── generate/
│   │   ├── TopicForm.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── WorkbookDisplay.tsx          ← Day 5
│   │   └── ClusterTable.tsx             ← Day 5
│   └── ui/ (Button, Input, Label)
├── context/AuthContext.tsx
├── hooks/useAuth.ts
├── lib/
│   ├── firebase/ (client.ts, admin.ts)
│   ├── groq/ (client.ts, prompts.ts)
│   ├── firecrawl/client.ts
│   └── wordpress/api.ts                 ← Day 6
├── middleware.ts
└── types/index.ts
```
