---
name: design-competitor
description: Analyze competitor apps, extract their best UI/UX patterns, and apply them to this project. Use when improving design, adding features, or modernizing the UI.
---
# Competitor Design Analysis & Implementation
## Step 1 — Research Competitors
Search the web for the top 5 competitor apps in the employee time tracking / workforce management space:
- Look for: Homebase, Deputy, When I Work, ClockShark, TSheets (QuickBooks Time)
- Find their app screenshots, landing pages, and UI previews
- Focus on: Israeli/Middle Eastern market alternatives too (e.g. Priority HRM, Commusoft)
## Step 2 — Extract Design Patterns
For each competitor analyze and document:
- Color palette (primary, secondary, accent colors)
- Typography (font sizes, weights, hierarchy)
- Card/component design (shadows, border radius, spacing)
- Dashboard layout (sidebar vs top nav, widget arrangement)
- Key UX flows (clock in/out, employee list, reports)
- Mobile UI patterns (bottom nav, floating action buttons, gestures)
- Empty states and loading states
- Error and success message design
## Step 3 — Feature Gap Analysis
Compare features against our current app:
- What features do competitors have that we don't?
- What UX improvements are standard in the industry?
- What mobile-specific patterns should we adopt?
## Step 4 — Apply to Our App
Implement the best patterns:
### Design System to Apply:
- Modern card design with subtle shadows: `shadow-sm hover:shadow-md transition-shadow`
- Rounded corners: `rounded-2xl` for cards, `rounded-xl` for buttons
- Gradient accents for key actions
- Bottom navigation bar for mobile (like Deputy/Homebase)
- Floating clock-in button (large, prominent, center bottom)
- Color-coded status indicators (green=clocked in, gray=clocked out, red=late)
- Avatar/initials for employees instead of plain text
- Smooth animations on state changes
### RTL Hebrew Adaptations:
- All layouts must remain RTL
- Icons should be mirrored where directional
- Mobile gestures adapted for RTL
## Step 5 — Deliver
- Show before/after comparison in comments
- Implement changes component by component
- Commit each component separately with descriptive message
- Test on mobile viewport (375px width)
## Quality Bar
The final result should look like a funded Israeli SaaS product, not a side project.
Reference quality: Wix, Monday.com, Papaya Global design language.
