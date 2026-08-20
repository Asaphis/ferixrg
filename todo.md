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
- [x] Save the verified approved-dashboard implementation as a new project checkpoint.

## Entry-flow visual approval

- [x] Read the full landing, authentication, verification, and onboarding specification and map its required screens and states.
- [x] Generate desktop visual mockups for the FerixRG landing experience and the connected account-entry flow.
- [x] Generate mobile visual mockups that preserve the same entry-flow screens, actions, and content in a mobile-first layout.
- [x] Attach the actual entry-flow visual files directly for user review before implementing any new screens.
- [x] Regenerate the FerixRG landing-page concept using the supplied rounded editorial hero reference as the compositional direction.
- [x] Show a moving supported-platform logo strip beneath the hero for Shopify, WooCommerce, BigCommerce, Shopware, and URL-based analysis support.
- [x] Generate the reference-led mobile landing concept with every desktop hero action, platform marquee, problem/solution module, AI content, comparison, workflow, health report, and final CTA reflowed vertically.
- [x] Redesign both landing concepts from one shared content model so every desktop visual treatment, module, proof section, image, and action has a clearly equivalent mobile version.
- [x] Convert the new reference’s editorial proof-and-outcomes rhythm into FerixRG sections for store results, platform support, analysis outcomes, redesign evidence, and report-ready improvements.
- [x] Audit and reproduce every desktop landing visual element in mobile: hero montage, storefront images, phone preview, analysis panels, platform marks, dividers, proof icons, evidence images, before/after imagery, report graphics, and all actions.
- [x] Rebuild the mobile visual as real responsive components matching the desktop’s individual sections and columns; do not use a cropped desktop page image as a section background or substitute for component layout.
- [x] Redesign desktop and mobile from one shared art-direction system: identical hero montage objects, platform-logo treatment, card shapes, typography, dividers, micro-badges, and supporting visual details, with only responsive reflow changing.
- [x] Restore rich visual storytelling to both shared landing concepts: recognisable supported-platform logos, hero and product montage layers, floating insight cards, storefront imagery, proof graphics, comparison visuals, and report details.
- [x] Add an approval-stage hero motion concept with independently floating workspace, browser, phone, score, AI insight, redesign-impact, connector, badge, and decorative detail layers on both desktop and mobile.

## Approved landing implementation

- [x] Replace the public landing page with the approved rich FerixRG shared design system, including the desktop hero montage, analysis input, proof modules, storefront imagery, evidence cards, comparison, workflow, report, and final CTA.
- [x] Implement the recognisable moving supported-platform logo marquee for Shopify, WooCommerce, BigCommerce, Shopware, Custom / Headless, and URL Analysis.
- [x] Implement the matching mobile landing layout from the same components, with every desktop visual object and action preserved in a deliberate phone reflow.
- [x] Add refined hero floating motion, desktop-only parallax, interactive CTA behavior, marquee motion, and reduced-motion support.
- [x] Add or update unit tests for landing data, platform coverage, mobile parity, and motion configuration; verify desktop and mobile renders; run tests and type checks.
- [x] Save the final approved landing implementation checkpoint.
- [x] Record that the hero motion was approved directly for implementation without a separate motion-preview artifact.
- [x] Replace generic marquee glyphs with recognisable Shopify, WooCommerce, BigCommerce, and Shopware logo treatments while retaining dedicated Custom / Headless and URL Analysis marks.
- [x] Add desktop-only pointer parallax to the hero montage and ensure it is inactive on mobile and under reduced-motion preferences.
- [x] Extend landing tests to cover motion-layer configuration, desktop-only parallax behavior, and shared desktop/mobile visual-module parity data.
- [x] Add component-level tests for desktop parallax updates and mobile/reduced-motion parallax disablement.
- [x] Add an explicit shared landing-module parity contract covering every required hero, platform, evidence, report, workflow, and CTA section.
- [x] Add a component-level test that verifies Home hero pointer movement updates montage CSS variables only on desktop, while mobile and reduced-motion paths leave them unchanged.
- [x] Add a rendered Home UI test that simulates pointer movement over the live `.hero-montage` and verifies desktop CSS-variable updates plus mobile and reduced-motion no-op behavior.
- [x] Fix the Home DOM-test runtime import so the rendered landing component can execute under the project’s jsdom test environment.

## Mobile behaviour flow visual approval

- [x] Read both mobile navigation specifications in full and reconcile the stated correction without altering the approved Home dashboard.
- [x] Map Stores, Add Store, platform choice, connection, URL analysis, store details, capabilities, connection settings, Tools, setup, execution, results, publishing, and More into screen-by-screen state transitions.
- [x] Generate direct mobile UI/UX behaviour mockups that show what each tap opens, which navigation item becomes active, and which state changes at every step.
- [x] Attach all screen-flow image files directly for approval before implementing the new mobile behaviour.
- [x] Add a dedicated Stores → Analyze by URL screen showing public URL input, analysis CTA, and the next processing/result state.
- [x] Add a dedicated Stores → Connection Settings screen with reconnect, permissions refresh, access management, connection detail, and disconnect confirmation states.
- [x] Regenerate the Stores flow board so every specified store-management path is visible as an explicit state transition.

## Tools-only behaviour visual approval

- [x] Generate a concise Tools-only mobile flow from the active Tools tab through tool selection, source setup, execution, results, issue action, AI fix, preview, and publish or export.
- [x] Attach the focused Tools-only visual boards directly before implementing the mobile Tools behaviour.

## Approved mobile behaviour implementation

- [x] Replace the current mobile bottom navigation with the approved fixed Home · Stores · Tools · More design, using a refined icon-and-label active state while leaving Home content untouched.
- [x] Implement Stores list, Add Store, platform selection, connection, URL analysis, store detail, capabilities, connection settings, and disconnect confirmation behaviour.
- [x] Implement Tools Library, tool setup, source selection, visible execution progress, results workspace, issue action, AI-fix, editor/preview, save, and publish/export behaviour.
- [x] Implement More as workspace, account, platform, resource, and support management without duplicating Home, Tools, or store-level work.
- [x] Add mobile behaviour state tests, verify responsive desktop/mobile rendering, run tests and type checks, then save the approved implementation.

## Store workflow feedback

- [x] Add clear loading animation and non-blocking progress feedback to the simulated Store connection journey.
- [x] Add success and error toast notifications to the Store connection outcome, including retry guidance on an error state.
- [x] Add clear loading animation and non-blocking progress feedback to the simulated URL-analysis journey.
- [x] Add success and error toast notifications to URL-analysis outcomes, including retry guidance on an error state.
- [x] Add feedback-flow tests, verify responsive rendering, run checks, and save the revised implementation.

## Internal dashboard system consistency

- [x] Audit Stores, Tools, results, publishing, and More against the approved dark dashboard system and identify all light legacy surfaces.
- [x] Apply the approved dashboard shell, top bar, background, typography, Ferix Blue action system, and navigation treatment to all internal workspace routes.
- [x] Rebuild the Stores, Tools, results, publishing, and More page surfaces to use the same dark dashboard card and state language on desktop and mobile.
- [x] Verify Home dashboard content remains unchanged while every non-dashboard page has matching desktop/mobile dashboard-system treatment.
- [x] Add or update visual-system tests, verify renders, run checks, and save the unified internal system.

## Dashboard-native internal composition rebuild

- [x] Map the approved dashboard’s greeting, summary, action, paired-panel, and 12-column composition rules to Stores, More, Tools, results, and publishing content.
- [x] Rebuild Stores and More as modular dashboard workspaces with the approved action-led hierarchy and panel placement rather than full-width legacy lists.
- [x] Rebuild Tools, results, and publishing as dashboard-native panels and grids while retaining their existing content and interaction states.
- [x] Preserve the approved Home dashboard exactly while confirming desktop/mobile reflow follows the same composition system across every internal route.
- [x] Add structural-layout regression coverage, verify responsive renders, run checks, and save the rebuilt system.

## Clean internal dashboard content

- [x] Remove redundant descriptions, filters, repeated options, and nonessential panels from internal dashboard pages.
- [x] Simplify Stores and More into clean action-led boards with only essential status, controls, and next steps.
- [x] Simplify Tools, results, and publishing into clear single-purpose decision boards while preserving all existing actions.
- [x] Preserve the approved Home dashboard and verify concise desktop/mobile content hierarchy across internal routes.
- [x] Add regression coverage, verify responsive renders, run checks, and save the simplified internal system.

## Expanded desktop workspace navigation

- [x] Audit the desktop workspace routes and map a sidebar structure that carries more desktop-specific destinations than the four-item mobile navigation.
- [x] Rebuild the desktop sidebar with grouped workspace, intelligence, creation, and account destinations while preserving the approved mobile Home · Stores · Tools · More menu.
- [x] Align desktop top-bar context, active-route labels, quick actions, and shortcut destinations with the expanded sidebar architecture.
- [x] Verify the desktop dashboard, Stores, Tools, results, publishing, and More routes use the revised navigation and clean board system consistently.
- [x] Add navigation regression coverage, verify desktop/mobile renders, run checks, and save the expanded desktop workspace.

## Authentication system

- [x] Confirm whether the requested authentication flow is a full production credential system or a simulated prototype flow alongside the existing Manus OAuth integration.
- [x] Add responsive routes for login, registration, verification, changing email, password recovery, password reset, and their specified success, expired, and invalid states.
- [x] Implement password visibility, requirements, validation, loading, generic account-protection errors, resend cooldown, session-expiry, and logout/unsaved-work confirmations.
- [x] Keep the approved dashboard unchanged and protect application entry according to the selected authentication approach.
- [x] Add authentication state tests, verify desktop/mobile routes, run checks, and save the completed flow.

## Landing authentication entry points

- [x] Audit every public landing sign-in, registration, and account-entry action for broken or outdated routes.
- [x] Route public sign-in actions to `/auth/login` and account-creation actions to `/auth/register` without changing the approved landing visual system.
- [x] Add regression coverage, verify desktop/mobile entry interactions, run checks, and save the corrected public authentication links.

## Authentication return links

- [x] Map supported public tool and workspace destinations to a safe local return parameter.
- [x] Preserve the requested destination through simulated login, registration, verification, password recovery, reset, and onboarding paths.
- [x] Return the user to the requested tool after successful authentication while rejecting invalid or external return paths.
- [x] Add regression coverage, verify responsive journeys, run checks, and save the deep-link return behavior.

## AI-assisted and manual correction workspaces

- [x] Define the routing grammar from every tool result to AI-assisted correction, manual editing, or a report/export outcome.
- [x] Design a shared AI design conversation with text instructions, image/reference upload, contextual evidence, proposed changes, and user-controlled apply/revise actions.
- [x] Define the distinct manual workspaces and controls needed for layout, visual style, content, responsive, performance, and code-oriented corrections.
- [x] Connect each existing tool to only the relevant correction workspace instead of sending all tools into one generic editor.
- [x] Implement and test simulated AI/manual correction journeys with preview, versioning, validation, publish/export, and responsive behavior.

## Tool behavior and access architecture

- [x] Define casual public-analysis, signed-in project, connected-store, and developer-handoff user modes with clear capability boundaries.
- [x] Map each FerixRG tool to eligible inputs, result type, persistence, permitted next actions, and connection-dependent capabilities.
- [x] Define the different result experiences for one-off URL/screenshot findings, saved projects, connected stores, AI correction, manual editing, and export/developer handoff.
- [x] Present the complete tool behavior matrix and routing grammar for approval before changing the implemented product flows.
- [x] Implement the approved tool behavior system with tests and responsive verification.

## Tool-result interface audit and approval deck

- [x] Audit the current Tools Library, tool setup, connection, results, correction, version, validation, publish, and export interfaces against the supplied product architecture.
- [x] Document specific alignment gaps for casual URL/screenshot users, saved-project users, connected-store users, and developer-handoff users.
- [x] Generate complete screen-by-screen desktop and mobile visuals for casual analysis, AI-assisted correction with references, connected-store change/publish, and developer handoff journeys.
- [x] Attach the visual deck and concise audit findings for user approval before changing the live interface.
- [x] Implement only the approved interface corrections, then test, verify, and save the updated tool-result system.

## Direct visual-board delivery

- [x] Deliver the generated desktop and mobile tool-behavior boards as directly viewable image attachments rather than web links.

## Desktop-first behavior approval

- [x] Present only desktop tool-result behavior boards, one route at a time, and obtain explicit desktop approval before creating or presenting any mobile design.

## Complete desktop system and manual-editor audit

- [x] Extract and organize the supplied manual-editor requirements for canvas, pages, sections, elements, assets, components, contextual design controls, responsive states, history, preview, and publish.
- [x] Audit the current dashboard, Tools Library, store workspaces, result paths, AI correction, developer handoff, release paths, and Visual Editor against the complete system requirements.
- [x] Define the missing desktop dashboard and contextual manual-editor architecture, including live preview alongside editing controls and capability-aware publishing/export.
- [x] Generate actual desktop-only visual boards for the complete dashboard, manual editor, and their key correction/release flows, then obtain approval before implementation.

## Mobile command center and contextual editor approval

- [x] Translate the approved desktop command center into an intentionally focused mobile dashboard while preserving essential active-work, evidence, and release actions.
- [x] Translate the desktop manual editor into a focused mobile editing workspace with live preview, contextual controls, device overrides, AI collaboration, validation, and safe release access.
- [x] Generate and attach direct mobile-only visual boards for the command center, manual editing, and AI-assisted editing before responsive implementation.

## Complete routed tool behavior workflow

- [x] Audit every current tool-related screen: discovery, input setup, URL/screenshot analysis, store connection, processing, results, AI correction, manual editing, preview, validation, versioning, publishing, export, and developer handoff.
- [x] Define the complete screen-by-screen routing rules from each tool and input mode into the correct next workspace, including connected and unconnected capability limits.
- [x] Specify the manual editor as an actual editing workflow with live preview alongside contextual section/element controls, not as a standalone dashboard concept.
- [x] Generate desktop-only screen-by-screen behavior boards that show the full tool workflow from entry through release, then obtain approval before mobile or implementation work.

## Direct desktop workflow image delivery

- [x] Generate and attach actual desktop images in sequence for Tools Library, input setup, connection/URL fork, processing, result evidence, next actions, AI correction, manual editing, preview/version, validation, and publish/export.

## Corrected unified editor and release workflow

- [x] Replace the separate AI-versus-manual correction interpretation with one shared editor workspace containing live manual controls and a persistent AI panel.
- [x] Make tool setup a straightforward selected-tool flow: choose an eligible existing store, connect a store, enter a URL, upload screenshots, or use the other inputs that the selected tool supports.
- [x] Make every completed run show its findings, issue indicators, score/impact evidence, analysis report, report-download action, and clear next steps before entering the shared editor.
- [x] Design the shared editor with live storefront preview, before/after comparison, AI-proposed changes, user-controlled application, manual changes, and saved version history in one draft context.
- [x] Gate Publish behind an eligible connected store and granted permissions; otherwise show only the actionable export/download package required to apply the design externally.
- [x] Re-read and reconcile the complete uploaded architecture with the existing source-of-truth specification before generating a replacement desktop workflow image.

## Beginner-friendly feature translation

- [x] Translate the uploaded architecture into user tasks and progressive-disclosure rules rather than treating its feature list as a screen layout.
- [x] Ensure each screen exposes only the next understandable decision for a first-time, non-technical user, with advanced editing controls hidden until contextually requested.
- [x] Replace the rejected workflow-board approach with a simple visual flow that communicates what the user sees, chooses, learns, changes, and finishes at every stage.
- [x] Independently decide and validate the most user-friendly placement for all required capabilities within the existing FerixRG UI language, including what remains hidden until context makes it useful.

## Actual tools and sub-tools must remain discoverable

- [x] Preserve the real FerixRG tool catalogue and its sub-tools as the primary product offering; do not replace them with generic task labels.
- [x] Design the desktop Tools sidebar as an expandable grouped catalogue and retain a full searchable Tools Library for every actual tool.
- [x] Show a selected tool’s plain-language purpose, eligible inputs, access requirements, expected result, and available next actions only after that tool is chosen.
- [x] Regenerate the full desktop workflow in one continuous sequence after correcting any stage; never replace the real tool catalogue or stop at the corrected entry screens.

## Complete mobile workflow visual approval

- [x] Translate the full approved desktop tool workflow into focused mobile screens while preserving the actual tool catalogue, selected-tool context, result/report, shared AI/manual editor, validation, and publish/export behavior.
- [x] Generate and attach the full mobile sequence from Tools Library through permission-aware publish or download, without dropping desktop workflow capability.

## Approved desktop and mobile tool workflow implementation

- [x] Implement expandable actual tool groups and sub-tools in the desktop sidebar and mobile Tools Library while retaining the searchable full 23-tool catalogue.
- [x] Implement a selected-tool-specific source setup, processing state, scoped evidence result, priority indicators, downloadable report, and relevant next actions across desktop and mobile.
- [x] Implement one shared draft editor where live manual controls, AI conversation/proposal comparison, history, validation, and device preview work together.
- [x] Implement version/validation review and capability-aware publishing, store-draft, design-package, and developer-handoff completion states across desktop and mobile.
- [x] Add regression tests and verify both responsive flows without changing the approved public landing page or dashboard.

## More subsection UI alignment and safe cleanup

- [x] Audit the Platform, Resources, and Support destinations opened from More against the approved FerixRG desktop and mobile workspace system.
- [x] Restyle those More destinations to match the active dark workspace shell, top bar, cards, typography, actions, and mobile layout.
- [x] Inventory all project files and remove only abandoned, verified-unreferenced files while preserving active routes, imports, tests, and static assets.
- [x] Run tests, type checks, and desktop/mobile visual verification after cleanup, then save a restorable checkpoint.

## Remaining More destination alignment

- [x] Rebuild Team, Billing, Profile, and Preferences as focused FerixRG workspace panels instead of legacy mobile-flow lists.
- [x] Add clear simulated team membership, plan/usage, profile, notification, and preference controls that match the approved desktop and mobile design system.
- [x] Verify the remaining More destinations, preserve sign-out and account behavior, then save a restorable checkpoint.

## Interactive Team management

- [x] Implement a simulated invite-member flow with member email, role selection, invitation confirmation, and pending-invitation state.
- [x] Implement member role-management actions and clear safe removal or invitation-cancellation confirmation states.
- [x] Add Team-management regression tests and verify desktop/mobile interaction before saving a checkpoint.

## Complete More nested interaction system

- [x] Audit every nested item in Team, Billing & Usage, Profile, Preferences, Platform, Resources, and Support for dead ends or generic placeholder behavior.
- [x] Implement a consistent nested detail/action pattern so each listed More item opens a specific simulated panel, form, confirmation, or contextual destination.
- [x] Complete the Billing & Usage, Profile, Preferences, Platform, Resources, and Support subflows, including every currently listed action.
- [x] Add complete regression coverage and verify all nested More interactions on desktop and mobile before saving a checkpoint.
