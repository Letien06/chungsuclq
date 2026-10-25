# Behavior sweep

- Desktop header: nav actions trigger existing scroll/modal handlers; login CTA opens Google auth.
- Mobile header: hamburger drawer exposes the same actions without horizontal overflow.
- Package selection: current dynamic package remains selected; selecting another package updates totals.
- Order summary: totals, balance state, and CTA are live from `AppContext`.
- Footer: siteInfo controls branding and support details; no target contact details are hardcoded into backend behavior.
