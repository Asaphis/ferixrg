# Version-history comparison enhancement

- [x] Review the existing Visual Editor state and identify the most useful comparison entry point.
- [x] Add selectable historical redesign alternatives with clear version metadata.
- [x] Implement a side-by-side comparison panel that preserves the active editor context.
- [x] Verify desktop and mobile layouts, then save a revised project checkpoint.

## Persistent drafts

- [x] Upgrade the project with authenticated database-backed storage for user draft records.
- [x] Define a saved-draft schema and secure ownership rules for editor versions.
- [x] Rehydrate restored design state and selected version metadata in the Visual Editor.
- [x] Verify the authenticated save-list-restore flow, including a fresh-session draft reload.
- [x] Add integration coverage for save, ownership-scoped list, and restore behavior.

## Simulated preview mode

- [x] Replace the editor’s protected persistent-draft calls with browser-local simulated storage.
- [x] Seed the preview with illustrative draft alternatives and retain newly saved drafts across reloads.
- [x] Verify simulated save, reload, comparison, and restoration without authentication.
- [x] Include the simulated browser-draft unit tests in the standard test suite.

## Tools Library

- [x] Define a catalogue of discoverable FerixRG tools grouped by work type and access requirements.
- [x] Add a dedicated Tools Library destination to the workspace navigation.
- [x] Show each tool’s purpose, supported inputs, required connections, and availability status before launch.
- [x] Provide simulated URL, screenshot, store-connection, and codebase setup choices based on the selected tool.
- [x] Bring the selected tool’s requirement panel directly into view after a mobile selection.
- [x] Verify desktop and mobile discoverability, then save the revised project version.

## Tools Library discovery

- [x] Strengthen search to match tool names, functions, inputs, and outcomes.
- [x] Add visible category-filter chips with result counts and a clear all-filters control.
- [x] Keep the selected tool details synchronized with filtered search results.
- [x] Add useful empty-state guidance and verify responsive tool discovery.

## Project activity dashboard

- [x] Define and present the project’s current focus, issue queue, fixes in progress, and completed implementation record.
- [x] Surface active drafts, recent tools, and recent project actions as the dashboard’s working context.
- [x] Add prioritized quick actions for URL, screenshot, Shopify, WooCommerce, theme, and publishing-related workflows.
- [x] Ensure all dashboard shortcuts navigate to the corresponding workspace tools or views.
- [x] Verify the redesigned dashboard on desktop and mobile, then save the revised project version.

## Dashboard connections and activity links

- [x] Add a connected-store status widget showing platform, connection health, available access, and a simulated reconnect option.
- [x] Make project activity timeline entries navigate directly to their relevant draft, issue, or tool.
- [x] Verify connected-store and activity-link interactions across desktop and mobile, then save the revised project version.

## Command-center dashboard redesign

- [x] Translate the dark dashboard reference into FerixRG-specific panels for active work, diagnostics, drafts, store health, and connections.
- [x] Recompose the desktop dashboard into a dense dark command-center grid with immediately actionable tools.
- [x] Design the mobile dashboard as a deliberate single-column command sequence rather than a reduced desktop layout.
- [x] Re-anchor the dark command-center accents in Ferix Blue while retaining orange only for risk and exception signals.
- [x] Verify all dashboard shortcuts, connection states, and activity links after the redesign, then save the revised project version.
- [x] Verify the URL scan, screenshot review, draft, and connection command shortcuts after the redesign.
- [x] Verify a command-center activity timeline entry routes directly to its related work.
- [x] Save the fully verified command-center dashboard as a new project version.

## Single command-center header

- [x] Remove the redundant workspace top bar from the command-center overview.
- [x] Retain and refine the command-center greeting, search, notification, and profile header as the only dashboard header.
- [x] Verify the single-header dashboard on desktop and mobile, then save the revised project version.

## Unified top bar correction

- [x] Prevent the unified top bar from compressing the greeting and search controls on mobile.

## Unified top bar correction

- [x] Move the greeting, search, notification, and profile controls into the actual top bar of the command center.
- [x] Remove the duplicate in-content command header below the top bar.
- [x] Verify the unified top bar on desktop and mobile, then save the revised project version.

## Top bar before greeting correction

- [x] Restore a compact top bar above the command-center greeting.
- [x] Keep the Good morning dashboard greeting below the top bar as the first content section.
- [x] Verify the corrected top-bar-before-greeting order on desktop and mobile, then save the revised project version.

## Simple store workspace dashboard

- [x] Replace the dense command-center dashboard with a clear user workspace focused on quick actions, activity, and stores.
- [x] Add a connected-stores list that makes each store’s connection, current work, draft count, and last activity understandable.
- [x] Add an individual store panel where users can analyse, fix, draft, validate, or prepare a publish workflow for that store.
- [x] Preserve direct navigation from quick actions, activity records, and store cards to their relevant panels or tools.
- [x] Verify the simplified workspace and store-panel flows on desktop and mobile, then save the revised project version.
- [x] Apply the simple workspace background and top-bar treatment consistently to the individual store panel.
- [x] Verify all individual store-panel core action routes at a mobile viewport.

## Store-context tool workspace

- [x] Add a clear tool picker inside each store panel for inspect, analyse, editor, issues, validate, and publishing workflows.
- [x] Show whether each store tool can use existing evidence immediately or requires a connected-store capability.
- [x] Keep selected tools in the active store context and provide guided source choices before launch.
- [x] Verify the store tool picker and evidence/connection paths on desktop and mobile, then save the revised project version.

## Dashboard visual approval

- [x] Generate a desktop FerixRG dashboard mockup that applies the reference layout to the store workspace.
- [x] Generate a mobile FerixRG dashboard mockup that preserves the same simple store-workspace priorities.
- [x] Obtain user approval of the visual direction before changing the implemented dashboard.
- [x] Deliver the actual desktop and mobile mockup image files directly for review, rather than a placeholder or inaccessible preview link.
- [x] Verify both rendered mockups exist as local image files before attaching them directly in chat.
- [x] Regenerate the mobile concept with every desktop dashboard action and module, including Connect Store, quick actions, analyses, publishing readiness, and activity, reflowed vertically without reducing capability.
- [x] Deliver the corrected mobile concept as one coherent vertical dashboard screen, with all desktop content responsive in the same app view rather than split alongside a duplicate detail column.
- [x] Audit the desktop concept against the mobile concept line by line and correct any missing metrics, sections, buttons, actions, status labels, or navigation before asking for approval.

## Approved dashboard implementation

- [x] Rebuild the desktop dashboard with the approved compact sidebar, utility header, action-led greeting, quick actions, store health, issues, recommendations, analysis, transformation, publishing, and activity modules.
- [x] Implement the approved dark FerixRG dashboard visual system, including cobalt decision actions, health and status indicators, and readable desktop module hierarchy.
- [x] Rebuild the mobile dashboard as one responsive vertical dashboard with every approved desktop action, score, section, and workflow state.
- [x] Add responsive navigation behavior: desktop sidebar and mobile Home / Stores / Analyze / More bottom navigation.
- [x] Add simulated interactive paths for search, store connection, store analysis, issue actions, reports, comparison, preview, and publish readiness.
- [x] Extend the dashboard data and tests to enforce desktop-to-mobile feature parity, including all five Store Health category scores.
- [x] Verify desktop and mobile renders, run tests and type checks, then save the approved dashboard implementation.
- [x] Add an explicit publish-readiness launch from the approved dashboard and verify that it retains the active-store context.
- [x] Make the approved dashboard search immediately launch the simulated Tools Library path rather than requiring a hidden keyboard-only action.
- [x] Re-run verification and save the approved dashboard implementation checkpoint.
- [ ] Save the verified approved-dashboard implementation as a new project checkpoint.
