# LabFlow Pro — Style Guide

This document defines the visual and content conventions for LabFlow Pro. Follow these rules across every page, component, and feature to keep the product consistent.

---

## 1. Design Principles

1. **Clarity over decoration.** Every element must serve the operator. No gratuitous gradients, blur effects, or floating blobs.
2. **White-space is a feature.** Use generous padding and spacing. Dense lab data needs breathing room, not visual noise.
3. **Flat and structured.** Use subtle borders and background tints for hierarchy — not drop shadows or glassmorphism.
4. **Content-first.** Headlines are direct and action-oriented. No marketing fluff in the workspace.

---

## 2. Layout

- **Max content width:** `max-w-6xl` (1152px). Use on all pages.
- **Page padding:** `px-6 lg:px-8`.
- **Section spacing:** `py-20 lg:py-28` for landing page sections. `space-y-8` for workspace page sections.
- **Grid system:** Use Tailwind grid. Prefer `sm:grid-cols-2`, `lg:grid-cols-3`, or `lg:grid-cols-4` depending on card density.
- **Border radius:** `rounded-lg` (0.5rem) for buttons and inputs. `rounded-xl` (0.75rem) for cards. `rounded-2xl` (1rem) for hero sections or large containers. Do NOT use extreme radii like `rounded-[2.3rem]`.

---

## 3. Color

### Primary palette (defined in globals.css via oklch)

| Token         | Usage                                    |
|---------------|------------------------------------------|
| `primary`     | Teal — buttons, links, active states     |
| `slate-950`   | Headings, dark backgrounds, emphasis     |
| `slate-600`   | Body text                                |
| `slate-500`   | Secondary text, labels                   |
| `slate-200`   | Borders                                  |
| `slate-50`    | Subtle background sections               |
| `white`       | Cards, primary background                |

### Accent colors (use sparingly for status/badges)

| Color        | Usage                              |
|--------------|------------------------------------|
| `teal-*`     | Success, active, primary accents   |
| `sky-*`      | Informational, in-progress states  |
| `amber-*`    | Warnings, pending states           |
| `red-*`      | Errors, rejected, destructive      |
| `violet-*`   | Review, approval states            |
| `emerald-*`  | Completed, released states         |

### Rules
- Do NOT use arbitrary gradient backgrounds like `bg-[linear-gradient(...)]` or `bg-[radial-gradient(...)]`.
- Backgrounds are `white`, `slate-50`, or `slate-950`. That's it.
- Do NOT use `backdrop-blur`, `bg-white/72`, or semi-transparent backgrounds.

---

## 4. Typography

### Font stack (defined in globals.css)

| Token          | Family                                  | Usage           |
|----------------|-----------------------------------------|-----------------|
| `font-sans`   | Aptos, Segoe UI, Helvetica Neue         | All body text   |
| `font-display`| Iowan Old Style, Palatino, Georgia      | **DO NOT USE** in new code — use `font-sans font-bold` for headings instead |
| `font-mono`   | Cascadia Code, SFMono                   | Code snippets   |

### Heading sizes

| Level | Class                                                         |
|-------|---------------------------------------------------------------|
| H1    | `text-[clamp(2.4rem,5.5vw,4.2rem)] font-bold tracking-tight` |
| H2    | `text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-tight` |
| H3    | `text-[1.05rem] font-semibold`                                |
| Body  | `text-base` or `text-[0.94rem] leading-relaxed`              |
| Small | `text-sm` or `text-[0.9rem]`                                 |
| Label | `text-xs font-semibold uppercase tracking-widest`            |

### Rules
- Headings: `text-slate-950`
- Body: `text-slate-600`
- Labels/caps: `text-slate-500` or `text-primary`
- Do NOT use font sizes with deeply nested calc or arbitrary `text-[0.76rem]` values. Stick to the scale above.

---

## 5. Components

### Buttons
- Primary: `<Button>` (filled, primary color). Use `rounded-lg px-4` or `px-6` for larger.
- Secondary: `<Button variant="outline">`.
- Ghost: `<Button variant="ghost">`.
- Always use `asChild` with `<Link>` for navigation buttons.
- Do NOT use `rounded-full` on buttons. Use `rounded-lg`.

### Cards
- Use `rounded-xl border border-slate-200/80 bg-white p-5` as the base card style.
- Hover state (when interactive): `hover:shadow-md`.
- Do NOT add `backdrop-blur`, gradient backgrounds, or complex shadow strings.

### Badges
- Use `<Badge variant="secondary">` for status labels and section tags.
- Use `<Badge variant="outline">` for data table status cells.
- Keep badge text short (1-3 words).

### Tables
- Use the `<Table>` components from shadcn/ui.
- Header: `bg-slate-50/80` background.
- Keep cells simple — text or a `<Badge>`.

### Inputs
- Standard shadcn `<Input>` and `<Label>`.
- No custom wrappers or extra visual styling.

### Section headers (landing/marketing pages)
```
<p className="text-xs font-semibold uppercase tracking-widest text-primary">
  Section label
</p>
<h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-tight tracking-tight text-slate-950">
  Section headline
</h2>
<p className="text-base leading-relaxed text-slate-600">
  Supporting paragraph.
</p>
```

---

## 6. Icons

- Use `lucide-react` exclusively.
- Icon size: `size-4` (inline/buttons), `size-5` (cards/features), `size-6` (hero).
- Icon containers: `flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary` or use accent color variants.

---

## 7. Spacing & Borders

- Section dividers: `border-t border-slate-200/80` between landing page sections.
- Card borders: `border border-slate-200/80`.
- Internal spacing: prefer `p-5` or `p-6` for cards, `gap-5` or `gap-6` for grids.
- Do NOT use shadows heavier than `shadow-md`. Prefer `shadow-sm` or none.

---

## 8. Content & Copy Rules

1. **Never expose internal details.** No mention of Supabase, scaffolding, schema, RLS, SSR, preview mode, or any implementation detail in user-facing text.
2. **Write for operators, not developers.** Use language a lab technician or intake staff would understand.
3. **Be direct.** Headlines should state the benefit or action. No "A product surface your team can actually start from" — say "Track every specimen from collection to report."
4. **No hype words.** Avoid: "revolutionary", "powerful", "seamless", "cutting-edge", "next-gen". Prefer concrete descriptions.
5. **Status badges use operational language:** Active, Pending, In Progress, Completed, Rejected, Released — not "Must-have module" or "Scaffold ready".

---

## 9. Dark sections

- Use `bg-slate-950 text-white` for emphasis sections (CTA blocks, stat bars).
- Inside dark sections: headings `text-white`, body `text-slate-300` or `text-slate-400`, accents `text-primary` or `text-teal-300`.
- Keep dark sections minimal (1-2 per page max).

---

## 10. Responsive

- Mobile-first. All layouts must work at 375px+.
- Use `sm:`, `md:`, `lg:` breakpoints progressively.
- Navigation collapses behind a compact nav on mobile.
- Tables scroll horizontally on small screens (`overflow-x-auto`).

---

## 11. Anti-patterns (DO NOT USE)

These patterns exist in legacy code and should be removed or avoided:

- `rounded-[2.3rem]` or any radius > `rounded-2xl`
- `backdrop-blur-xl`, `bg-white/72`, glassmorphism effects
- `shadow-[0_44px_140px_-70px_rgba(...)]` — custom long shadows
- `bg-[linear-gradient(...)]` or `bg-[radial-gradient(...)]` backgrounds
- `.bg-grid-fade` background grid pattern
- `.animate-drift` floating blob animations
- `font-display` serif headings
- "scaffold", "wired", "PRD", "first-pass" language in UI copy
- Sections with 3+ nested rounded containers
