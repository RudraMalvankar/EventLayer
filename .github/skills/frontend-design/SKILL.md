# frontend-design

Name: frontend-design

Description:
Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples: websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.

License: Complete terms in LICENSE.txt

---

Purpose
-------
This skill captures a repeatable, high-quality workflow for designing and implementing frontends with a strong, intentional aesthetic direction and production-ready code. It produces working components/pages plus a short implementation checklist and design rationale.

When to use
-----------
- Building a new UI component, page, or small application
- Re-skinning an existing UI with a bold aesthetic
- When the user requests high-design quality and creative choices

Inputs
------
- Requirements: functional spec, target audience, constraints (framework, accessibility, performance), and any example assets or brand tokens.
- Target platform: (e.g., Next.js App Router, React SPA, plain HTML/CSS)
- Deliverable type: component, page, layout, poster, or full app

Outputs
-------
- A `design rationale` (one-paragraph aesthetic direction)
- Implementation files (HTML/CSS/JS or React components) with production-ready structure
- A minimal usage example and dev commands (how to run/test)
- A short checklist of acceptance criteria and accessibility checks

Design & Implementation Process (step-by-step)
--------------------------------------------
1. Clarify purpose & constraints
   - Ask: Who is the user? What is the primary goal? Any platform or performance constraints? Any brand rules?
2. Choose an aesthetic direction
   - Select a single, bold aesthetic (e.g., refined minimalism, retro-futuristic, brutalist).
   - Pick the single-most-memorable design detail (hero interaction, dramatic layout, unique typography).
3. Define core tokens
   - Colors, type scale, spacing, and motion strategy (CSS variables and a small token file).
4. Wireframe structure
   - Small ASCII or bullet wireframe describing layout and primary states.
5. Implement
   - Produce working code matching the chosen framework. Prioritize semantic HTML and accessibility.
   - Use CSS variables, utility-first patterns (Tailwind optional), or component-scoped CSS.
6. Add motion & micro-interactions
   - One well-scoped, high-impact animation (page reveal, hero micro-interaction).
7. Polish & QA
   - Accessibility checks (contrast, keyboard nav, ARIA where required), responsiveness, and cross-browser sanity.
8. Deliver
   - Provide files, usage snippet, and checklist for acceptance.

Decision points and branching logic
----------------------------------
- If the user provides a framework preference (React/Next/Vue), implement in that framework; otherwise default to plain HTML + modern CSS or React as requested.
- If the brief emphasizes performance (low-latency, mobile), trade some animations for lower paint cost and simpler assets.
- If a brand font is supplied, prefer that; otherwise suggest a distinctive display + refined body pairing from Google Fonts or fallback system stack.

Quality criteria / completion checks
-----------------------------------
- Visual fidelity: The delivered UI reflects the stated aesthetic and has a clear memorable detail.
- Code quality: Clean, modular, minimal dependencies, and reproducible.
- Accessibility: Basic checks passed (contrast ratios, keyboard focus states, semantic markup).
- Responsiveness: Works across narrow, medium, and wide viewports.
- Documentation: Includes usage example and run/test commands.

Ambiguities & Clarifying questions (ask early)
---------------------------------------------
- Who is the primary user and what is the main action they should take?
- Any brand colors, fonts, or assets to use or avoid?
- Target browsers or performance budget?
- Preferred framework (plain HTML/CSS, React/Next, Vue) and CSS approach (Tailwind, CSS Modules, styled-components)?

Iteration guidance
------------------
1. Produce an initial design rationale + small static prototype.
2. Ask the user to select or refine the aesthetic choices (type, color, motion).
3. Implement the full component/page and run basic QA.
4. Iterate on user feedback and tighten accessibility/performance.

Suggested file layout for repo deliveries
----------------------------------------
- /design/notes.md — design rationale and tokens
- /src/components/<ComponentName>.jsx — component implementation
- /src/styles/<component>.css — CSS or Tailwind config
- /examples/index.html or storybook entry — usage example

Example prompts to invoke this skill
-----------------------------------
- "Design a retro-futuristic landing page for a blockchain developer conference using Next.js App Router."
- "Create a product card React component in a refined-minimalist aesthetic with a memorable hover interaction." 
- "Re-style our onboarding flow to feel luxurious and editorial. Use Tailwind and suggest fonts." 

Related customizations to create next
-----------------------------------
- `frontend-a11y` — checklist and automated tests for accessibility specific to UI deliveries.
- `frontend-motion` — reusable motion utilities and patterns for production-grade CSS/JS motion.
- `frontend-tokens` — shared token library generator (colors, spacing, typography) and theme switcher.

Notes for maintainers
---------------------
- Encourage explicit aesthetic choices in briefs; vague briefs produce safe but forgettable outputs.
- Always include a one-paragraph design rationale with any deliverable.

---

If you want, I can now scaffold a concrete example implementation for a chosen aesthetic and framework — tell me the desired deliverable and constraints.
