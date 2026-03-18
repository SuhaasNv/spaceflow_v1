# Lovable Frontend Prompt — SpaceFlow

Copy the prompt below into Lovable to generate the SpaceFlow frontend. It covers animations, smooth scrolling, and premium UI.

---

## Full Prompt (Copy Everything Below)

```
Build the frontend for SpaceFlow — a smart workplace platform for SMBs and coworking operators. The UI must be stunning, premium, and highly polished. Use Lovable to create a React/Next.js app with Tailwind CSS. Every interaction should feel smooth and delightful.

=== DESIGN PRINCIPLES ===

- Avoid generic AI aesthetics: NO Inter, Roboto, Arial, or purple-on-white gradients.
- Use distinctive typography: a bold display font for headlines (e.g. Clash Display, Satoshi, Syne, or Geist) paired with a clean sans for body text.
- Color palette: Choose a cohesive scheme — consider dark mode for the app (feels premium) and light for public pages. Use one dominant color, one accent, and strong contrast. Avoid clichéd purple/violet.
- Spacing: Generous padding, clear hierarchy. Use 8px grid. Let content breathe.
- Depth: Subtle gradients, soft shadows, or light grain texture. Avoid flat, lifeless backgrounds.

=== ANIMATIONS (CRITICAL — IMPLEMENT ALL) ===

1. PAGE TRANSITIONS
   - Every route change: smooth fade (opacity 0→1) + slight slide-up (translateY 8px→0) over 300–400ms with ease-out.
   - Use CSS transitions or Framer Motion. No instant cuts.

2. STAGGERED REVEALS ON LOAD
   - Hero sections: headline fades in first, then subhead, then CTA button — each 80–100ms apart.
   - Dashboard cards: each card animates in with fade + slide-up, staggered by 60–80ms.
   - List items (bookings, spaces): stagger entrance by 40–60ms per item.
   - Use animation-delay or Framer Motion staggerChildren.

3. HOVER STATES
   - Buttons: scale(1.02–1.05) on hover, smooth 200ms transition. Primary CTA can have subtle glow or gradient shift.
   - Cards: translateY(-2px to -4px) + increase box-shadow on hover. 200ms ease-out.
   - Nav links: smooth underline or background pill transition (200–300ms).
   - List rows: subtle background change or left border accent on hover.

4. SMOOTH SCROLLING
   - Enable smooth scroll for the entire app: html { scroll-behavior: smooth; }
   - For anchor links (e.g. #features, #pricing): use scroll-margin-top if there's a fixed header.
   - Scroll-triggered animations: when sections enter viewport, fade-in + slide-up. Use Intersection Observer or Framer Motion useInView.
   - Parallax (optional): subtle background movement on scroll for hero section.

5. LOADING STATES
   - Skeleton loaders with shimmer animation (gradient moving left-to-right) for cards, lists, and tables.
   - Buttons: show subtle pulse or spinner during submit. Disable and reduce opacity.
   - Page loads: show skeleton layout before content, then animate content in.

6. MICRO-INTERACTIONS
   - Form inputs: focus ring with 200ms transition. Label float or scale on focus.
   - Success states: checkmark with scale-in animation. Optional: subtle confetti or success toast.
   - Error states: gentle shake (translateX -4px, 4px, -4px) or red border pulse.
   - Toggle switches: smooth thumb slide. Checkboxes: checkmark draw-in.
   - Modals: backdrop fade-in, modal scale(0.95→1) + fade-in over 250ms.

7. CHARTS & DATA
   - Utilization charts: bars/lines animate in on load (stagger or grow from 0).
   - Numbers: consider count-up animation when stats first appear.
   - Use Recharts or similar with animation enabled. Duration 800–1200ms.

=== SMOOTH SCROLLING REQUIREMENTS ===

- Apply scroll-behavior: smooth globally.
- Long pages (Home, Dashboard): sections reveal as user scrolls. Use Intersection Observer to trigger fade-in + slide-up when element is 10–20% in viewport.
- Sticky headers: smooth transition when scrolling past threshold.
- Sidebar nav: highlight current section based on scroll position (optional).

=== PAGES TO BUILD ===

1. HOME (public)
   - Hero: Bold headline — use "Know what's booked vs what's used" or "30% of your meeting rooms are booked but empty. SpaceFlow shows you which ones." Subhead: market-aligned (ghost bookings, SMB, no sensors). Primary CTA. Staggered entrance.
   - Value pillars: 3 cards (Visibility, Intelligence, Simplicity) with icons. Scroll-triggered reveal.
   - Optional: subtle animated background (gradient mesh, floating shapes, or grid).
   - Nav: Login, Signup. Smooth hover states.

2. LOGIN & SIGNUP
   - Clean, centered forms. Strong CTA. Focus states on inputs.
   - Success: redirect with smooth transition. Error: inline message with gentle shake.

3. DASHBOARD (authenticated)
   - Overview cards: utilization %, recent bookings, quick actions. Staggered card entrance.
   - Charts: utilization over time, booking vs usage. Animated bar/line charts.
   - Sidebar: nav with active state, smooth hover. Collapsible on mobile.

4. BOOK SPACE
   - Space picker: grid of space cards with hover lift. Filters (type, floor) with smooth dropdowns.
   - Calendar/time picker: clear selection states, smooth transitions.
   - Confirmation: success animation (checkmark, optional confetti).

5. MY BOOKINGS
   - List or card grid. Each item: stagger on load. Hover highlight. "Check in" button (highlight when within 15 min of start). Cancel/reschedule with modal. Success state: "Checked in!" feedback.

6. UTILIZATION
   - Full-width charts. Animate on load. Time range selector with smooth transition.

7. RECOMMENDATIONS
   - Card list of AI recommendations. Each card: confidence badge (High/Medium/Low), "Why this?" expandable with explanation + data sources. Stagger entrance. Subtle "Powered by Gemini" label.

8. ADMIN (Admin role)
   - User table: sortable, hover rows. Modal for edit. Clean, data-dense but readable.

=== TECHNICAL REQUIREMENTS ===

- React + Vite or Next.js (whatever Lovable supports).
- Tailwind CSS for styling.
- Framer Motion for complex animations (page transitions, stagger, scroll-triggered). If not available, use CSS animations and transitions.
- Responsive: mobile-first. Sidebar collapses to hamburger on small screens.
- Accessibility: focus states, aria-labels where needed. Animations: prefer prefers-reduced-motion for users who disable motion.

=== WHAT TO AVOID ===

- Centered card stacks with identical spacing.
- Purple/violet gradients as primary.
- Inter, Roboto, Arial.
- Instant page changes with no transition.
- Static, non-animated charts.
- Cluttered layouts. Prioritize clarity and whitespace.

=== OUTPUT ===

Produce a complete, production-ready frontend. Every scroll should feel smooth. Every hover should respond. Every page load should reveal content gracefully. The first impression should make users think "I want to use this."
```

---

## Quick Reference: Animation Checklist

| Element | Animation |
|---------|-----------|
| Page transitions | Fade + slide-up, 300–400ms |
| Hero / cards on load | Staggered fade + slide, 60–100ms delay |
| Buttons hover | Scale 1.02–1.05, 200ms |
| Cards hover | translateY(-2px), shadow increase |
| Scroll behavior | `scroll-behavior: smooth` |
| Scroll-triggered sections | Fade-in + slide-up on viewport enter |
| Skeleton loaders | Shimmer gradient |
| Form focus | Ring transition, label float |
| Success state | Checkmark scale-in |
| Charts | Animate bars/lines on load |
