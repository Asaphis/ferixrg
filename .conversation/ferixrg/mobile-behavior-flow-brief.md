# FerixRG Mobile Behaviour Flow Brief

## Correction that governs this work

The later specification supersedes the earlier Home description: **Home is already complete and must not be changed, repeated, or redesigned.** The permanent mobile navigation is exactly **Home · Stores · Tools · More**. The screen-flow visuals cover the remaining three destinations and their subordinate states; Home appears only as the unchanged navigation reference.

## Shared interaction language

Every main mobile screen keeps the fixed four-item bottom navigation. The active item uses Ferix Blue and a filled icon/pill. A tapped primary card or button opens the next full-screen state through a rightward transition; back returns to the prior context. Local modal confirmations and bottom sheets dim the current screen without removing the fixed navigation unless the destination is an immersive editor or publishing confirmation.

## Flow set for visual approval

| Board | Screens shown in order | Behaviour to make visible |
| --- | --- | --- |
| Stores | Stores list → Add Store → Platform selection → Connect platform / Analyze URL → Store detail | Search/filter state, selected platform, platform capabilities, connection and URL alternative. |
| Tool workbench | Tools Library → Tool setup → Input method → Progress → Results workspace | Selected category/tool, input selection, task stages, result tabs, issue state and AI-fix entry. |
| Improve & publish | Issue detail → Proposed AI fix → Preview / editor entry → Publish review → Confirmation / success or export | Selected issue highlight, before/after, primary action state, publishing availability, success and fallback. |
| More | More hub → Team / billing / usage → account / platform / support groups | Workspace-management boundaries; no tools, dashboard, or individual stores. |

## Store-detail requirements

Each dedicated store screen shows name, platform, live connection state, Store Health, action row (Analyze, Tools, Preview, Publish), capability rows, recent work, analysis/design/publishing history, and connection settings. Platform permissions and limitations must be visible rather than implied.

## Tool-flow requirements

All tools follow the same visible grammar: **Select Tool → Select Input → Run → Processing → Results → Fix / Redesign / Edit → Preview → Save → Publish / Export.** Tool setup never launches a tool immediately. Input choices vary by tool and can include a connected store, store URL, screenshot, product/page URL, or page selection.

## Publishing requirements

The review screen must explain store, platform, version, pages/sections/elements affected, and capabilities before publish. Full support produces Preview and Publish. Limited or unavailable access produces Export Changes, View Instructions, or Open Store—not a deceptive disabled publish action.
