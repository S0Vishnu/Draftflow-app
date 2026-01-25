# DraftWolf - TODO List

**Last Updated:** January 25, 2026  
**Priority Legend:** 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low

---

## 🎯 SELLING (Marketing & Monetization)

### 🔴 Critical - Do This Week

#### Landing Page & Web Presence
- [ ] **Create landing page** (use Carrd.co or Next.js)
  - [ ] Write hero headline: "Stop Losing Your Creative Work to 'final_final_v2.docx'"
  - [ ] Add feature showcase section
  - [ ] Add email capture form (ConvertKit)
  - [ ] Add download CTA button
  - [ ] Add social proof section (prepare for testimonials)
  - [ ] Deploy to Netlify/Vercel
  - [ ] Set up custom domain (draftwolf.com or draftwolf.app)

#### Demo & Marketing Assets
- [ ] **Record 60-second demo video**
  - [ ] Script: Problem → Solution → Result
  - [ ] Screen recording with OBS Studio
  - [ ] Edit with DaVinci Resolve
  - [ ] Add background music
  - [ ] Upload to YouTube
  - [ ] Embed on landing page

- [ ] **Take professional screenshots** (4K resolution)
  - [ ] Main workspace view
  - [ ] Version tree visualization
  - [ ] Inspector panel with versions
  - [ ] Settings page
  - [ ] Community chat
  - [ ] Clean up: Hide personal info, use dummy data

#### Social Media Setup
- [ ] **Create Twitter/X account** (@draftwolf)
  - [ ] Set up profile (bio, avatar, header)
  - [ ] Write first 5 tweets (intro, features, tips)
  - [ ] Follow relevant accounts (Blender, gamedev, creative tools)

- [ ] **Join target communities**
  - [ ] Reddit: r/blender (read rules, engage authentically)
  - [ ] Reddit: r/gamedev
  - [ ] Reddit: r/writing
  - [ ] Blender Artists forum
  - [ ] Don't spam - provide value first

#### Email Marketing
- [ ] **Set up ConvertKit** (or Mailchimp)
  - [ ] Create account
  - [ ] Design email capture form
  - [ ] Create welcome email sequence
  - [ ] Add to landing page

### 🟡 High Priority - Do This Month

#### Monetization Infrastructure
- [ ] **Set up Stripe account**
  - [ ] Complete business verification
  - [ ] Create products:
    - [ ] "DraftWolf Pro - Monthly" ($9.99/month)
    - [ ] "DraftWolf Pro - Yearly" ($99/year)
    - [ ] "DraftWolf Team - Monthly" ($29.99/month per user)
  - [ ] Set up webhook endpoint
  - [ ] Test payment flow end-to-end

- [ ] **Create pricing page**
  - [ ] Design comparison table (Free vs Pro vs Team)
  - [ ] Write feature descriptions
  - [ ] Add FAQ section
  - [ ] Add "Start Free Trial" CTA
  - [ ] Add testimonials section (collect from beta users)

- [ ] **Implement payment integration** (see TECHNICAL_IMPLEMENTATION_GUIDE.md)
  - [ ] Frontend: Stripe.js integration
  - [ ] Backend: Firebase Functions for webhooks
  - [ ] Test checkout flow
  - [ ] Test subscription management
  - [ ] Test cancellation flow

#### Product Hunt Launch Prep
- [ ] **Prepare Product Hunt listing**
  - [ ] Write compelling tagline
  - [ ] Write 300-word description
  - [ ] Upload demo video
  - [ ] Upload screenshots (5-6 images)
  - [ ] Prepare launch day discount code (PRODUCTHUNT50)

- [ ] **Recruit hunters/supporters**
  - [ ] Reach out to 20+ people to upvote on launch day
  - [ ] Schedule launch for Tuesday-Thursday
  - [ ] Prepare to respond to comments all day

#### Content Marketing
- [ ] **Write first blog post**
  - [ ] Topic: "Why Git Doesn't Work for Creative Files (And What Does)"
  - [ ] 1,500-2,000 words
  - [ ] Include screenshots/examples
  - [ ] SEO optimize
  - [ ] Publish on Medium + own blog

- [ ] **Create tutorial video**
  - [ ] "How to Never Lose a Blender Project Again"
  - [ ] 5-10 minutes
  - [ ] Upload to YouTube
  - [ ] Share in r/blender (if allowed)

#### Beta Testing & Testimonials
- [ ] **Recruit 50 beta testers**
  - [ ] Post in r/blender, r/gamedev
  - [ ] Offer: Free Pro for 3 months
  - [ ] Collect feedback via Google Form

- [ ] **Collect testimonials**
  - [ ] Email beta testers after 2 weeks
  - [ ] Ask: "What problem does DraftWolf solve for you?"
  - [ ] Get permission to use on website
  - [ ] Create testimonial graphics (Canva)

### 🟢 Medium Priority - Next 3 Months

#### Partnership Outreach
- [ ] **Contact Blender Foundation**
  - [ ] Request official addon listing
  - [ ] Offer to sponsor Blender development
  - [ ] Collaborate on blog post

- [ ] **Reach out to YouTubers** (10K-100K subs)
  - [ ] Blender Guru
  - [ ] CG Geek
  - [ ] Grant Abbitt
  - [ ] Offer: Free Pro license for review
  - [ ] Provide talking points/demo

- [ ] **Contact online learning platforms**
  - [ ] Udemy: Offer integration for course creators
  - [ ] Skillshare: Partnership opportunity
  - [ ] CG Cookie: Collaboration

#### Community Building
- [ ] **Set up Discord server**
  - [ ] Channels: #announcements, #support, #feature-requests, #showcase
  - [ ] Create welcome bot
  - [ ] Invite beta testers
  - [ ] Post weekly updates

- [ ] **Create subreddit** (r/DraftWolf)
  - [ ] Set up rules
  - [ ] Create wiki with FAQ
  - [ ] Post weekly tips

#### SEO & Content
- [ ] **Optimize website for SEO**
  - [ ] Target keywords: "version control for creatives", "blender version control"
  - [ ] Add meta descriptions
  - [ ] Create sitemap
  - [ ] Submit to Google Search Console

- [ ] **Write 3 more blog posts**
  - [ ] "The True Cost of Lost Creative Work"
  - [ ] "Blender Version Control: A Complete Guide"
  - [ ] "DraftWolf vs Git vs Dropbox for Creatives"

#### Paid Marketing (if budget allows)
- [ ] **Google Ads campaign** ($500 budget)
  - [ ] Target: "blender version control", "file versioning software"
  - [ ] Landing page: Free trial signup
  - [ ] Track conversions

- [ ] **Sponsor creative tool newsletters**
  - [ ] Blender Nation
  - [ ] Creative Bloq
  - [ ] Budget: $200-500 per placement

---

## ✨ FEATURES (New Functionality)

### 🔴 Critical - Do This Month

#### Monetization Features
- [ ] **License key system** (see TECHNICAL_IMPLEMENTATION_GUIDE.md)
  - [ ] Backend: Firebase Functions for license generation/validation
  - [ ] Frontend: License activation UI
  - [ ] Electron: Secure storage with keytar
  - [ ] Test: Valid/invalid/expired licenses

- [ ] **Feature gating (Free vs Pro)**
  - [ ] Implement workspace limit (1 for Free)
  - [ ] Implement version history limit (30 days for Free)
  - [ ] Add upgrade prompts when hitting limits
  - [ ] Create "Upgrade to Pro" modal

- [ ] **Usage tracking**
  - [ ] Track workspace count
  - [ ] Track version age
  - [ ] Track storage usage
  - [ ] Show usage in settings

#### Analytics & Tracking
- [ ] **Install PostHog** (or Mixpanel)
  - [ ] Set up account
  - [ ] Add SDK to project
  - [ ] Create analytics service (see TECHNICAL_IMPLEMENTATION_GUIDE.md)
  - [ ] Add privacy consent dialog

- [ ] **Track key events**
  - [ ] App opened
  - [ ] Workspace created/opened
  - [ ] Version created/restored
  - [ ] File uploaded
  - [ ] Settings changed
  - [ ] Upgrade clicked
  - [ ] Payment completed

- [ ] **Set up error tracking (Sentry)**
  - [ ] Create Sentry account
  - [ ] Install @sentry/electron
  - [ ] Configure error reporting
  - [ ] Test crash reporting

### 🟡 High Priority - Next 3 Months

#### Cloud Backup (Pro Feature)
- [ ] **Firebase Storage integration**
  - [ ] Set up storage bucket
  - [ ] Implement upload/download
  - [ ] Add progress indicators
  - [ ] Handle large files (chunking)

- [ ] **Selective sync**
  - [ ] UI: Choose which workspaces to backup
  - [ ] Sync status indicators
  - [ ] Conflict resolution UI
  - [ ] Bandwidth optimization (delta sync)

#### Team Collaboration (Team Feature)
- [ ] **Shared workspaces**
  - [ ] Database schema for shared projects
  - [ ] Invite system (email invites)
  - [ ] User permissions (view/edit/admin)
  - [ ] Access control UI

- [ ] **Activity feed**
  - [ ] Real-time updates (Firebase Realtime DB)
  - [ ] Show: "John restored version 1.2.3"
  - [ ] Filter by user/action
  - [ ] Notifications

- [ ] **Comments on versions**
  - [ ] Add comment UI to inspector panel
  - [ ] @mention support
  - [ ] Email notifications for mentions

#### Advanced Version Features
- [ ] **Version tagging**
  - [ ] UI: Add tag to version
  - [ ] Predefined tags: "Final", "Client Approved", "WIP"
  - [ ] Custom tags
  - [ ] Filter versions by tag

- [ ] **Version notes**
  - [ ] Add description to version
  - [ ] Show in inspector panel
  - [ ] Search by notes

- [ ] **Visual branch/merge**
  - [ ] Branch creation UI
  - [ ] Merge conflict resolution
  - [ ] Visual branch tree

### 🟢 Medium Priority - Next 6 Months

#### Integration Expansion
- [ ] **Adobe Photoshop plugin**
  - [ ] Research CEP (Common Extensibility Platform)
  - [ ] Create plugin UI
  - [ ] Auto-save integration
  - [ ] Version restore from Photoshop

- [ ] **Unity integration**
  - [ ] Unity Editor extension
  - [ ] Asset versioning
  - [ ] Scene versioning
  - [ ] Prefab versioning

- [ ] **Unreal Engine integration**
  - [ ] Editor plugin
  - [ ] Asset versioning
  - [ ] Blueprint versioning

- [ ] **VS Code extension**
  - [ ] Show version history in sidebar
  - [ ] Quick restore
  - [ ] Diff viewer

#### AI-Powered Features
- [ ] **Auto-tagging**
  - [ ] Analyze file content
  - [ ] Suggest tags based on changes
  - [ ] Learn from user behavior

- [ ] **Smart version naming**
  - [ ] Suggest meaningful names
  - [ ] Based on file changes
  - [ ] Based on time/context

- [ ] **Duplicate detection**
  - [ ] Find similar files
  - [ ] Suggest consolidation
  - [ ] Save storage space

#### Mobile Apps
- [ ] **iOS viewer app**
  - [ ] React Native or Swift
  - [ ] View-only access
  - [ ] Version browsing
  - [ ] Push notifications

- [ ] **Android viewer app**
  - [ ] React Native or Kotlin
  - [ ] Same features as iOS

---

## 🎨 REFINE (Polish & Improvements)

### 🔴 Critical - Do This Week

#### Onboarding Experience
- [ ] **Create first-run tutorial**
  - [ ] Install Shepherd.js
  - [ ] Create tour steps (see TECHNICAL_IMPLEMENTATION_GUIDE.md)
  - [ ] Steps: Open workspace → Add files → View versions → Restore
  - [ ] Add "Skip" and "Next" buttons
  - [ ] Save completion state

- [ ] **Improve empty states**
  - [ ] No workspace: "Open a folder to start tracking versions"
  - [ ] No files: "Add files to this workspace to begin"
  - [ ] No versions: "Make changes to create your first version"
  - [ ] Add helpful tips and CTAs

- [ ] **Add welcome screen**
  - [ ] Show on first launch
  - [ ] Explain key features
  - [ ] Quick start options
  - [ ] "Don't show again" checkbox

#### UX Polish
- [ ] **Add keyboard shortcuts overlay**
  - [ ] Show with Cmd/Ctrl + ?
  - [ ] List all shortcuts
  - [ ] Searchable
  - [ ] Printable

- [ ] **Improve loading states**
  - [ ] Add skeleton screens
  - [ ] Better progress indicators
  - [ ] Estimated time remaining
  - [ ] Cancel button for long operations

- [ ] **Better error messages**
  - [ ] User-friendly language
  - [ ] Actionable suggestions
  - [ ] "Try again" button
  - [ ] "Report issue" link

### 🟡 High Priority - Do This Month

#### Performance Optimization
- [ ] **Large file handling**
  - [ ] Test with 1GB+ files
  - [ ] Implement chunking
  - [ ] Show progress for large operations
  - [ ] Add file size warnings

- [ ] **Version compression**
  - [ ] Replace adm-zip with zstd (faster)
  - [ ] Implement delta compression
  - [ ] Reduce storage footprint
  - [ ] Benchmark performance

- [ ] **File list virtualization**
  - [ ] Use react-window or react-virtualized
  - [ ] Lazy load large directories
  - [ ] Improve scroll performance
  - [ ] Test with 10,000+ files

#### Documentation
- [ ] **Create user manual**
  - [ ] Getting started guide
  - [ ] Feature documentation
  - [ ] Screenshots for each section
  - [ ] Searchable (Algolia DocSearch)

- [ ] **Video tutorials**
  - [ ] "Getting Started with DraftWolf" (5 min)
  - [ ] "Advanced Version Control" (10 min)
  - [ ] "Blender Integration Tutorial" (8 min)
  - [ ] "Team Collaboration" (7 min)

- [ ] **FAQ page**
  - [ ] Common questions
  - [ ] Troubleshooting
  - [ ] Billing questions
  - [ ] Technical requirements

#### UI/UX Improvements
- [ ] **Dark/Light mode toggle**
  - [ ] Add to settings
  - [ ] Smooth transition
  - [ ] Remember preference
  - [ ] System preference detection

- [ ] **Customizable themes**
  - [ ] Color scheme options
  - [ ] Font size adjustment
  - [ ] Compact/comfortable density

- [ ] **Accessibility improvements**
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] High contrast mode
  - [ ] Focus indicators

### 🟢 Medium Priority - Next 3 Months

#### Advanced Features
- [ ] **Diff viewer for text files**
  - [ ] Side-by-side comparison
  - [ ] Syntax highlighting
  - [ ] Inline diff
  - [ ] Merge tool

- [ ] **Image comparison**
  - [ ] Side-by-side view
  - [ ] Slider overlay
  - [ ] Highlight differences
  - [ ] Zoom/pan

- [ ] **3D file preview**
  - [ ] Three.js viewer
  - [ ] Support .blend, .fbx, .obj
  - [ ] Rotate/zoom
  - [ ] Material preview

#### Search & Filter
- [ ] **Advanced search**
  - [ ] Search by file name
  - [ ] Search by tags
  - [ ] Search by date range
  - [ ] Search by version notes
  - [ ] Fuzzy search

- [ ] **Smart filters**
  - [ ] Recent files
  - [ ] Large files
  - [ ] Frequently restored
  - [ ] Untagged versions

#### Export & Backup
- [ ] **Version export**
  - [ ] Export as ZIP
  - [ ] Export specific version
  - [ ] Export version tree (JSON)
  - [ ] Batch export

- [ ] **Project templates**
  - [ ] Save workspace as template
  - [ ] Share templates
  - [ ] Template marketplace

#### Settings & Preferences
- [ ] **Advanced settings**
  - [ ] Auto-save interval
  - [ ] Compression level
  - [ ] Storage location
  - [ ] Excluded file types

- [ ] **Backup settings**
  - [ ] Auto-backup schedule
  - [ ] Backup location
  - [ ] Retention policy
  - [ ] Verify backups

### 🔵 Low Priority - Future

#### Localization
- [ ] **Add i18next**
  - [ ] Set up translation files
  - [ ] Extract all strings
  - [ ] Create language switcher

- [ ] **Translate to Spanish**
  - [ ] UI strings
  - [ ] Documentation
  - [ ] Marketing materials

- [ ] **Translate to Japanese**
  - [ ] Large 3D artist market
  - [ ] Anime/game dev community

#### Platform Expansion
- [ ] **Web app (view-only)**
  - [ ] Next.js or React
  - [ ] Firebase hosting
  - [ ] No local installation
  - [ ] Great for client reviews

- [ ] **Linux support improvements**
  - [ ] Test on Ubuntu, Fedora, Arch
  - [ ] Create AppImage
  - [ ] Publish to Snapcraft
  - [ ] Fix platform-specific bugs

---

## 📊 Testing & Quality Assurance

### 🟡 High Priority

#### Automated Testing
- [ ] **Set up Vitest**
  - [ ] Install dependencies
  - [ ] Configure test environment
  - [ ] Write first test

- [ ] **Unit tests**
  - [ ] License manager
  - [ ] Version control logic
  - [ ] File operations
  - [ ] Analytics service

- [ ] **Integration tests**
  - [ ] Payment flow
  - [ ] Version restore
  - [ ] Cloud sync
  - [ ] Team collaboration

#### Manual Testing
- [ ] **Test payment flow**
  - [ ] Free → Pro upgrade
  - [ ] Pro → Team upgrade
  - [ ] Cancellation
  - [ ] Refunds

- [ ] **Test on different platforms**
  - [ ] Windows 10/11
  - [ ] macOS (Intel & Apple Silicon)
  - [ ] Ubuntu Linux

- [ ] **Performance testing**
  - [ ] Large files (1GB+)
  - [ ] Many files (10,000+)
  - [ ] Long version history (1,000+ versions)

---

## 🔒 Security & Privacy

### 🟡 High Priority

- [ ] **Implement end-to-end encryption** (for cloud backup)
  - [ ] Research: AES-256
  - [ ] Key management
  - [ ] User-controlled keys

- [ ] **Add two-factor authentication**
  - [ ] TOTP support
  - [ ] Backup codes
  - [ ] Recovery options

- [ ] **Security audit**
  - [ ] Review Firebase rules
  - [ ] Check for XSS vulnerabilities
  - [ ] Test authentication flow
  - [ ] Review data storage

- [ ] **Privacy policy & Terms of Service**
  - [ ] Write privacy policy
  - [ ] Write terms of service
  - [ ] Add to website
  - [ ] Require acceptance on signup

---

## 📈 Metrics & Analytics

### 🟡 High Priority

- [ ] **Set up dashboard** (PostHog or custom)
  - [ ] Daily active users (DAU)
  - [ ] Weekly active users (WAU)
  - [ ] Free → Pro conversion rate
  - [ ] Churn rate
  - [ ] MRR growth

- [ ] **Track funnel metrics**
  - [ ] Website visit → Download
  - [ ] Download → Activation
  - [ ] Activation → Paid
  - [ ] Paid → Retained

- [ ] **Set up alerts**
  - [ ] Spike in errors
  - [ ] Drop in conversions
  - [ ] High churn rate
  - [ ] Payment failures

---

## 🎯 Success Milestones

### Week 1
- [ ] Landing page live
- [ ] Analytics installed
- [ ] Demo video recorded
- [ ] Stripe account set up

### Month 1
- [ ] 100 free users
- [ ] 10 paying users
- [ ] $100 MRR
- [ ] Payment integration complete

### Month 3
- [ ] 1,000 free users
- [ ] 50 paying users
- [ ] $500 MRR
- [ ] Product Hunt launch

### Month 6
- [ ] 5,000 free users
- [ ] 250 paying users
- [ ] $2,500 MRR
- [ ] Positive cash flow

### Year 1
- [ ] 10,000 free users
- [ ] 500 paying users
- [ ] $5,000 MRR ($60K ARR)
- [ ] First employee hired

---

## 📝 Notes

**Priority System:**
- 🔴 Critical = Do this week/month, blocks other work
- 🟡 High = Do within 3 months, important for growth
- 🟢 Medium = Do within 6 months, nice to have
- 🔵 Low = Future consideration, not urgent

**Review Schedule:**
- Weekly: Review critical items
- Monthly: Review high priority items
- Quarterly: Review entire list, reprioritize

**Last Review:** January 25, 2026  
**Next Review:** February 1, 2026

---

*Focus on SELLING first - you need revenue to sustain development. Then FEATURES to deliver value. Finally REFINE to polish the experience.*

**Start with the 🔴 Critical items in SELLING section!**
