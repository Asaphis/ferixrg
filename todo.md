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

## Exact tool taxonomy and simulator correction
- [x] Replace generic or incorrect tool names with the exact tool categories, tool names, and sub-tool distinctions extracted from the uploaded complete tools specification.
- [x] Separate user-facing analysis, generation, and redesign tools from internal workspaces, validation features, and release actions while preserving advanced direct access where appropriate.
- [x] Define accurate simulated inputs, analysis focus, evidence, result metrics, actions, workspace routing, export, and permission behavior for every listed tool.
- [x] Rebuild the desktop and mobile Tools Library and selected-tool simulator around the corrected taxonomy, then verify full tool coverage with regression tests and visual review.

## Fresh cleanup audit before organization
- [x] Inventory active source, styles, routes, tests, assets, generated artifacts, temporary files, and project documentation after the latest exact-tool update.
- [x] Classify every cleanup candidate conservatively and remove nothing that is active, imported, routed, tested, or a retained project specification.
- [x] Confirm the cleanup status and preserve a safe checkpoint before applying the user’s organization requirements.

## Production workspace organization
- [x] Move the active customer-facing application into `web/frontend` using only production-quality directory and file names.
- [x] Create the separate `web/admin-panel` application boundary without mixing it into the customer-facing frontend.
- [x] Move API, database, and shared backend code into named `backend` directories and update every configuration path, alias, script, import, and test.
- [x] Remove retired root application folders only after confirming the migrated workspace runs, tests, types, and builds successfully.

## GitHub delivery
- [x] Create a private FerixRG repository under the connected GitHub account, then commit and push the complete verified workspace.

## Backend implementation foundation
- [x] Classify every FerixRG tool by the right execution engine: AI, deterministic analysis, connected-store data, validation, export, or publishing.
- [x] Define the production data model and secure permission boundaries for users, stores, connections, tool runs, evidence, drafts, reports, and release actions.
- [x] Select the AI model strategy and real platform-integration approach before connecting any third-party accounts. Cloudflare Workers AI is the selected first provider through the provider-neutral Central AI Gateway; store-platform adapters remain separately gated.
- [x] Implement and test the first backend foundation without altering the approved frontend behavior.

## Central AI architecture
- [x] Define the central FerixRG AI layer, including model capabilities, agent actions, design context, review safeguards, and access pattern for every tool.
- [x] Compare a managed AI service, direct provider integration, and an open-source/self-hosted route before selecting the production architecture.
- [x] Connect the approved central AI layer to the first real FerixRG tool workflows without changing the approved frontend design.

## Open-source AI requirement
- [x] Select a free open-source multimodal model, model server, and agent framework that can support FerixRG’s central design AI. Superseded for the current launch by the selected Cloudflare-hosted model route; no local model server is approved for the present host.
- [x] Define the self-hosted AI deployment and backend connection without exposing the model service directly to users. Superseded by the server-side Cloudflare gateway route; a future self-hosted adapter remains a separate capacity-gated option.
- [x] Implement the approved open-source AI connection only after the required hosting capacity is available. No open-source self-hosted connection is approved or implied on the current no-GPU host.

## Open-source model inventory
- [x] List every essential and optional open-source model role for FerixRG, with no unnecessary duplicate models.
- [x] Verify Ubuntu compatibility, model-server requirements, and the setup order before installing any model.

## Complete launch AI foundation
- [x] Define every AI model role and supporting AI service needed for the full FerixRG launch, not only the first feature. The capability map assigns deterministic, AI-proposal, and provider-execution boundaries across the exact tool catalogue.
- [x] Compare NVIDIA hosted AI with self-hosted open-source serving and a hybrid fallback route for quality, cost, privacy, and launch reliability. The selected route is Cloudflare-hosted inference with provider-neutral future adapters; NVIDIA and local inference are not approved for the current host.
- [x] Design the production AI gateway, model router, safe agent-action registry, evaluation suite, monitoring, and failure fallback before tool implementation.
- [x] Implement and test the complete approved AI foundation before activating user-facing tool workflows. The configured Cloudflare gateway now provides bounded, audited, usage-tracked Design Copilot, Content Improver, Product Description Generator, CTA Generator, SEO Content Generator, and Meta Generator proposals; tools without a dedicated operation state that honestly.
- [x] Replace simulated AI workflow replies for tools without dedicated server-side AI operations with explicit capability-aware unavailable messages.
- [x] Add a workspace-scoped AI Content Improver execution path through the configured central Cloudflare gateway, with bounded text input, audit records, usage accounting, and honest unavailable states.
- [x] Add a workspace-scoped Product Description Generator execution path through the configured central Cloudflare gateway, with bounded product facts, audit records, usage accounting, and honest unavailable states.
- [x] Add a workspace-scoped marketing-copy generator through the configured central Cloudflare gateway for the exact CTA Generator, SEO Content Generator, and Meta Generator tools, with bounded source facts, audit records, usage accounting, and honest unavailable states.

## AI hosting decision
- [x] Confirm the real free-access limits of NVIDIA development APIs and the compute requirements of self-hosting open models on Ubuntu. The decision record excludes NVIDIA development access and local model hosting from the current production route; Cloudflare capacity is governed by the documented daily Neuron allocation.
- [x] Select one simple AI hosting route for FerixRG development and document the public-launch transition before any installation.

## Existing Ubuntu server assessment
- [x] Preserve the existing 8 GB RAM, two-core Ubuntu server for FerixRG application services and define a separate inference route for GPU-only visual AI workloads.
- [x] Select the GPU-backed AI inference option that connects securely to the existing Ubuntu server without requiring a frontend or tool rebuild.

## Hosted multi-model AI platform evaluation
- [x] Compare hosted multi-model dashboards and APIs that offer open-source models, visual AI, coding AI, image AI, and agent capabilities for FerixRG. This comparison is closed by the Cloudflare decision record and capability map; no secondary provider is activated.
- [x] Verify each provider’s free development access, current limits, production terms, and model-selection workflow before selecting the central connection. The current first-provider facts are reconfirmed in the AI hosting decision record; secondary-provider activation remains a future adapter-specific review.
- [x] Recommend one provider or provider combination and document the secure backend API connection for the FerixRG Central AI Gateway.

## Ready-made AI service evaluation
- [x] Identify established API-accessible AI agents and specialist services for FerixRG design, visual editing, code, storefront analysis, content, and automation workflows.
- [x] Exclude NVIDIA from the recommended production shortlist and distinguish usable production services from testing-only or internal-developer products.
- [x] Map the selected ready-made AI services to the actual FerixRG tool categories and define the secure backend API connection plan.

## GitHub Models evaluation
- [x] Review GitHub Models’ catalog, API access, free-use conditions, privacy controls, and production limits for FerixRG.
- [x] Determine the right GitHub Models role within the FerixRG AI service registry and document the backend connection path.

## User-researched AI platform evaluation
- [x] Verify the user-identified Vercel AI Gateway, Cloudflare Workers AI, Mistral, Cerebras, Groq, Google AI Studio, and free-LLM API resources against current official documentation.
- [x] Compare their available model types, free limits, privacy and production conditions, then assign each a precise FerixRG role or exclude it. Cloudflare is selected as the first provider; the other reviewed services are excluded from the current configured path and may only return through a provider-neutral adapter review.
- [x] Define the approved multi-provider stack, fallbacks, and secure Central AI Gateway connection sequence. The current approved stack is one Cloudflare adapter plus fail-closed fallback; no unconfigured provider is invoked.

## Verified free-access classification
- [x] Separate genuinely recurring free AI access from limited development free access and one-time trial credits for every user-identified platform. FerixRG relies only on the documented recurring Workers AI daily free allocation for its current path and does not treat trials or development-only access as launch capacity.

## Cloudflare Workers AI foundation
- [x] Make Cloudflare Workers AI the first FerixRG provider while keeping the central gateway provider-neutral.
- [x] Map Cloudflare text, vision, image, embedding, and safety capabilities to the current FerixRG tool catalogue.
- [x] Design and test the secure backend provider adapter, daily-free-limit guard, privacy policy, and fallback behavior before connecting credentials.

## Cloudflare capability and API verification
- [x] Verify whether Cloudflare Workers AI covers each required FerixRG AI capability and identify capability gaps that need a separate provider.
- [x] Verify the exact backend-only API authentication, request, and deployment connection path before provider implementation.

## Isolated Cloudflare connection test
- [x] Create and verify a Cloudflare Workers AI token and account connection outside the FerixRG prototype.
- [x] Run a direct model-response test and confirm token permissions, account access, response format, and free-tier usage without adding product backend code.
- [x] Begin FerixRG backend implementation only after the isolated provider test succeeds.

## Cloudflare free-plan test correction
- [x] Select a current Workers AI model available on the user's Free plan and complete the isolated response test.

## First Cloudflare-powered backend milestone
- [x] Implement the provider-neutral Central AI Gateway only after the core FerixRG backend foundation is complete.
- [x] Add Cloudflare AI tool-run contracts, daily-free-limit guards, privacy boundaries, and audit-ready records after core account and store data exists.
- [x] Connect and test the first real AI Design Copilot workflow only after the backend foundation and its permission model are complete.

## Core backend foundation before AI
- [x] Define the authentication approach and domain model for users, workspaces, team roles, stores, drafts, reports, tool runs, release actions, activity, usage, and billing state.
- [x] Create and migrate the foundational database tables before connecting any external AI service to FerixRG workflows.
- [x] Build protected backend APIs and permission checks for account, workspace, team, store, draft, activity, usage, and release data.
- [ ] Connect the approved frontend behaviors to the real backend foundation without changing the approved UI design.

## Foundational protected API contracts
- [x] Create personal workspace bootstrap and membership checks for every authenticated FerixRG user.
- [x] Add protected workspace, team, store, activity, usage, and tool-run read/write contracts with ownership enforcement.
- [x] Add backend tests proving user, workspace, and role scoping before connecting existing frontend components.

## Account identity backend
- [x] Add protected account profile, authentication-identity, and account-status contracts on top of the existing secure identity session.
- [x] Connect the approved authentication screen to real identity status without changing its visual design.

## Local account authentication foundation
- [x] Add secure local account registration, password hashing, sign-in, and sign-out session routes without changing the approved authentication UI.
- [x] Add account-status and credential tests before connecting the registration and sign-in forms to the real backend.

## Complete frontend-to-backend blueprint
- [x] Inventory every approved frontend route, component, static record, simulation, user state, action, and mobile behavior across FerixRG.
- [x] Map every frontend feature to its required backend data, authentication, roles, permissions, services, integrations, audit records, and failure states.
- [x] Create one complete backend implementation sequence for accounts, workspaces, teams, billing, stores, tools, editor drafts, reports, release, settings, support, and platform operations.
- [ ] Build all remaining backend work from the approved complete frontend-to-backend blueprint without changing the approved frontend design.

## Blueprint Step 1 — identity completion
- [x] Connect the approved registration, sign-in, verification, recovery, reset, and session-expiry screens to real local-account APIs without changing their visual design.
- [x] Replace browser-local simulated session creation and clearing with real authenticated session state, logout, and workspace bootstrap.
- [x] Connect approved Profile and Preferences panels to the protected account profile contracts.
- [x] Add a server-only transactional email adapter for verification, password-reset, and email-change messages; it truthfully reports unavailable delivery until deployment configuration is supplied.

## Complete frontend-derived backend implementation
- [x] Add account-scoped security-event persistence, authenticated event history, and truthful security-alert delivery state for sign-in and two-step security changes.
- [x] Finish remaining account security controls: configuration-aware two-step verification with protected enrollment, security-event and alert-delivery persistence, and live session-list/revocation UI wiring. The UI remains automatically unavailable without deployment encryption configuration.
- [x] Add encrypted two-step authenticator, recovery-code, and login-challenge persistence records before enabling any account-security toggle.
- [x] Replace remaining simulated workspace summary records with scoped live backend contracts. Team membership, invitations, role changes, removals, acceptance, dashboard workspace activity, stores, per-store workbench counts, release/billing summaries, and More-panel counts now use live scoped backend contracts.
- [ ] Replace remaining simulated connected-platform authorization, per-store workbench summaries, and platform-permission states with live backend contracts. Store registry, URL analysis source records, snapshot lists, bounded S3 upload sources, and pending connection lifecycle contracts are implemented.
- [x] Prevent unconfigured store providers from creating a pending connection or implying an authorization result; return the provider’s live readiness message instead.
- [x] Finish unsaved-work protection, live draft selection, and remaining editor-language cleanup. Canonical workspace draft creation, durable version history, side-by-side comparison inputs, restore, activity audit, and S3-backed draft assets are implemented.
- [ ] Add genuine deterministic and AI/provider tool executors plus generated report/export artifacts. The exact 57-tool registry, source validation, queue/start/complete/fail lifecycle, evidence, issues, reports, and developer-handoff persistence contracts are implemented.
- [x] Gate public-URL execution so a tool without a dedicated deterministic executor fails with an honest unsupported-execution message instead of receiving generic inspection results.
- [x] Add a bounded evidence-backed Navigation Analyzer public-URL executor using observed navigation landmarks, main landmarks, and anchor text only, with real stored output and no crawl or provider claims.
- [x] Add a bounded Performance Analyzer public-URL executor that records only measured fetch-and-read duration and inspected document bytes, without claiming a full performance audit.
- [x] Add a bounded CTA Analyzer public-URL executor that records observed links and buttons with visible text only, without conversion or journey claims.
- [x] Add a bounded Content Quality Analyzer public-URL executor that records extracted body-text, paragraph, and heading indicators only, without subjective writing-quality claims.
- [x] Add a bounded Product Page Analyzer public-URL executor that records observed Product JSON-LD declarations only, without catalog or merchant-data claims.
- [x] Add a bounded Image Optimization Analyzer public-URL executor that records image lazy-loading and width/height attribute indicators only, without byte-size or visual-performance claims.
- [x] Add a bounded Asset Analyzer public-URL executor that records observed image, stylesheet, and script reference hosts only, without loading, vulnerability, or performance claims.
- [x] Add a bounded Responsive Analyzer public-URL executor that records observed viewport metadata and inline responsive-style indicators only, without rendered-device or breakpoint behavior claims.
- [x] Add a bounded Mobile UX Analyzer public-URL executor that records observed viewport, telephone-link, and mobile-input markup indicators only, without usability or interaction claims.
- [x] Add a bounded Trust & Credibility Analyzer public-URL executor that records observed Organization, Review, and AggregateRating JSON-LD declarations only, without trust, authenticity, or rating claims.
- [x] Add the first bounded deterministic public-URL executor: it performs SSRF-aware HTML metadata inspection, records observed evidence only, and stores a generated JSON inspection export through the server-side storage boundary.
- [x] Replace the remaining static sidebar store summary with the live workspace-scoped store registry and an honest empty state.
- [x] Replace the remaining static Tools Library store label and summary counts with workspace-scoped live aggregates.
- [x] Connect the dashboard public-URL analysis action to a real queued, started, evidence-derived Storefront Analyzer run and JSON export.
- [x] Expose stored report artifacts through a protected workspace-scoped download action in the approved Reports panel.
- [x] Replace static editor draft/version labels with the persisted workflow draft and version state.
- [x] Replace static per-store issue and draft counts in the Stores workbench registry with scoped live workspace records.
- [x] Replace the static Connected sessions metrics and rows with real account-session records in the approved security panel.
- [x] Replace remaining browser-preview wording in the live editor with accurate persisted workspace-state language.
- [x] Replace the simulated Platform Integrations summary with live configuration-gated store-provider and central-AI readiness records.
- [x] Replace the retired simulated permission-refresh action with an honest live readiness-review action.
- [x] Remove simulated billing plan, receipt, and alert controls from the live read-only Billing panels.
- [x] Prevent the account-security UI from enabling two-step verification before the encrypted enrollment and login challenge flow exists.
- [x] Document the encrypted two-step enrollment, login challenge, recovery, rate-limit, and security-alert delivery design before activation.
- [x] Add a protected two-step enrollment-start operation that creates a fresh Base32 seed, returns setup material only to the authenticated account, and persists only AES-256-GCM encrypted secret data.
- [x] Expose non-sensitive two-step deployment and enrollment status to the approved Password & security panel, retain an honest unavailable state without encryption configuration, and add a guarded setup and confirmation path for configured deployments.
- [x] Add and connect a bounded deterministic saved-draft integrity validator to complete real validation runs without implying provider-side release execution.
- [x] Connect approved tool-workflow report-download controls to real generated public-URL artifacts and show an honest unavailable state for other runs.
- [x] Replace generic public-URL workflow result placeholders with observed inspection facts and a truthful no-evidence state for unexecuted sources.
- [x] Replace the dashboard prototype greeting and avatar initials with authenticated account data.
- [x] Replace static Stores-registry totals and other-store entries with live workspace store records.
- [x] Replace the active store-workspace detail header and health value with the selected live store record.
- [x] Derive and persist evidence-backed public-URL issues from observed metadata and image-accessibility facts.
- [x] Show evidence-derived public-URL issue records in the approved workflow results before the Issue Center.
- [x] Replace remaining release and billing usage records with workspace- and store-scoped backend read models. The rendered dashboard, analysis, issue center, report history, validation/release review, and Billing panels now use scoped live aggregates, stores, tool runs, issue records, reports, activity, releases, subscriptions, and usage ledgers.
- [x] Replace the remaining static More workspace and billing-summary wording with the existing scoped member, store, and usage read models.
- [ ] Add provider execution adapters for approved publish/rollback plans. Validation records, explicit approval/cancellation, export/publish/rollback plan records, passed-validation and critical-issue gating, supported-connection checks, rollback-history checks, and honest unsupported-action boundaries are implemented.
- [ ] Add a server-side payment-provider adapter when one is selected. Provider-agnostic subscriptions, plan entitlements, free-plan bootstrap, real tool-run ledger records, live usage summaries, billing access rules, and honest read-only Billing & Usage UI are implemented without credentials.
- [x] Implement the remaining Platform, Resources, Support, legal-version, feedback, and system-operation contracts behind every approved More action.
- [x] Add Cloudflare Workers AI orchestration only after real source, permissions, drafts, tool runs, usage, and audit foundations are complete.
- [x] Add integration tests, migration checks, authorization coverage, responsive UI verification, and deployment configuration documentation for the fully implemented system.

## Blueprint Step 2 — workspace and team
- [x] Connect real personal-workspace bootstrap to the approved workspace entry path.
- [x] Replace Team member lists, invitations, role changes, invitation-role changes, member removal, cancellation, and pending status with workspace-scoped backend queries and mutations.
- [x] Add secure invitation acceptance, owner protection, role-gated mutation rules, and workspace activity audit records.
- [x] Replace the approved dashboard’s Recent Activity panel with live workspace audit events while preserving the approved dashboard design.

## Blueprint Step 3 — store registry and sources
- [x] Add workspace-scoped store registry, store lookup, public URL source snapshots, source listing, and activity audit contracts.
- [x] Connect the approved URL analysis setup to save a real public storefront source before retaining the approved progress and results route.
- [x] Add protected screenshot, theme-export, and manual-upload source storage through server-side S3 helpers; persist only file metadata keys in the database.
- [x] Add pending store connection lifecycle records and safe connection/status read contracts without storing provider credentials in frontend code.
- [ ] Add individual Shopify, WooCommerce, Magento, and custom provider authorization adapters after their server-side deployment configuration is available.

## Blueprint Step 4 — persistent editor projects and versions
- [x] Add canonical workspace draft creation, durable version save/list, restore, current-version tracking, and activity audit contracts.
- [x] Connect the approved editor save, version history, left/right comparison, and restore behavior to real workspace draft and version APIs.
- [x] Add version-linked draft asset metadata and protected server-side S3 uploads for references, screenshots, theme exports, previews, and manual files.
- [x] Replace remaining browser-preview copy and add explicit dirty-state navigation/sign-out protection tied to live save state.
- [x] Replace the simulated editor sign-out prompt with live persisted-save protection for editor navigation and logout.

## Blueprint Step 5 — exact tool-run foundation
- [x] Add a backend canonical registry that enforces the exact approved 57-tool IDs and connection-required boundaries.
- [x] Add scoped queue, start, completion, failure, evidence, issue, report-record, export-record, and developer-handoff contracts with activity audit records.
- [x] Add durable issue and developer-handoff tables with an additive reviewed migration.
- [x] Connect the approved tool workflow Run action to real queued and started tool-run records without changing its approved visual structure.
- [ ] Add per-tool deterministic executors and the Cloudflare AI executor after the remaining aggregate, validation, release, usage, and audit boundaries are completed.
- [x] Add a bounded UX Analyzer public-URL executor that records observed form, ARIA-role, and skip-link markup only, without usability or accessibility conclusions.
- [x] Add a bounded Color & Contrast Analyzer public-URL executor that records observed inline and style-block color declarations only, without rendered contrast or accessibility conclusions.
- [x] Add a bounded Typography Analyzer public-URL executor that records observed inline and style-block font declarations only, without readability, hierarchy, or consistency conclusions.
- [x] Add a bounded Conversion Analyzer public-URL executor that records observed cart and checkout link or form-action markup only, without conversion, purchase, or revenue conclusions.
- [x] Add a bounded Breakpoint Analyzer public-URL executor that records observed media-query conditions in style blocks only, without viewport or layout-behavior conclusions.
- [x] Add a bounded Collection Analyzer public-URL executor that records observed collection-path links only, without category, filter, sorting, discovery, or presentation conclusions.
- [x] Add a bounded Product Presentation Analyzer public-URL executor that records observed Product JSON-LD image declarations and page image markup only, without visual-quality, gallery, price, badge, or hierarchy conclusions.
- [x] Add a bounded Product Content Analyzer public-URL executor that records observed Product JSON-LD title and description declarations only, without clarity, completeness, persuasion, or readability conclusions.
- [x] Add a bounded Cart Analyzer public-URL executor that records observed cart-path links and cart form actions only, without cart-clarity, quantity-control, shipping, upsell, or CTA conclusions.
- [x] Add a bounded Checkout UX Analyzer public-URL executor that records observed checkout-path links and checkout form actions only, without clarity, friction, trust, payment, mobile, or completion conclusions.
- [x] Add a bounded Customer Journey Analyzer public-URL executor that records observed product, collection, cart, and checkout link paths only, without a journey map, friction, progression, or purchase conclusions.
- [x] Add a bounded Layout Analyzer public-URL executor that records observed semantic layout elements only, without visual arrangement, spacing, alignment, hierarchy, or rendering conclusions.
- [x] Add a bounded Visual Design Analyzer public-URL executor that records observed style-block, color, and font declarations only, without visual-quality, brand, composition, or rendering conclusions.
- [x] Add a bounded Visual Hierarchy Analyzer public-URL executor that records observed heading levels and text-bearing interactive elements only, without visual hierarchy, emphasis, or rendering conclusions.
- [x] Add a dedicated proposal-only AI Store Redesign operation through the existing Cloudflare gateway, preserving workspace permission, tool-run context, capacity, usage, and audit boundaries.
- [x] Add a dedicated proposal-only Visual Style Studio operation through the existing Cloudflare gateway, preserving the manual editor, workspace permission, tool-run context, capacity, usage, and audit boundaries.
- [x] Add a dedicated proposal-only Content Editor operation through the existing Cloudflare gateway, preserving manual editing, workspace permission, tool-run context, capacity, usage, and audit boundaries.
- [x] Add a dedicated proposal-only Responsive Studio operation through the existing Cloudflare gateway, preserving manual editing, workspace permission, tool-run context, capacity, usage, and audit boundaries.
- [x] Add a dedicated proposal-only Layout Composer operation through the existing Cloudflare gateway, preserving manual editing, workspace permission, tool-run context, capacity, usage, and audit boundaries.
- [x] Add a dedicated proposal-only Component Builder operation through the existing Cloudflare gateway, preserving manual editing, workspace permission, tool-run context, capacity, usage, and audit boundaries.
- [x] Persist dedicated live AI proposal results as workspace-scoped evidence and generated JSON report artifacts without completing tool runs or creating automated store changes.
- [x] Add a bounded Before/After Comparator executor that compares persisted draft-version metadata and state sizes only, without visual, scoring, publishing, or quality conclusions.
- [x] Bind the bounded Before/After Comparator to the approved workflow with saved-version selection, a generated report download, and explicit non-visual result language.
- [x] Add a bounded Heading Structure Analyzer path for public URLs: capture observed H1–H6 text and order, persist evidence and JSON export, and create a missing-H1 issue only when the HTML lacks an H1 element.
- [x] Add a bounded Image SEO Analyzer path for public URLs using observed image alternative-text coverage only.
- [x] Add a bounded SEO Analyzer public-URL result using only observed title, description markup, canonical, heading, link, and image fields.
- [x] Add a bounded Accessibility Analyzer public-URL result using only observed language, viewport, heading, and image-alt indicators.
- [x] Add a bounded Site Structure Analyzer public-URL result using only observed page link, heading, host, and canonical indicators.

## Blueprint Step 6 — live dashboard and aggregate reads
- [x] Add a protected workspace dashboard read model derived from real stores, measured health, issues, drafts, tool runs, reports, and activity records.
- [x] Replace the rendered approved Overview dashboard with live scoped aggregate cards and truthful empty states without changing its approved layout.
- [x] Replace the rendered Analysis screen with live tool-run state and source-context records.
- [x] Replace the rendered Issue Center and Reports route with live workspace issue, report, and run records plus honest empty/export states.
- [x] Replace remaining release and billing usage panels with live scoped data in their dedicated backend phases. The Validation and release-review panels use scoped validation and release records, while Billing and More summaries use scoped subscription, entitlement, ledger, member, and store records.

## Blueprint Step 7 — validation and controlled release
- [x] Add workspace-scoped validation queue, start, completion, listing, version ownership checks, and audit records.
- [x] Add controlled export, publish, and rollback plan records with explicit approval and cancellation procedures.
- [x] Gate publish plans behind passed validation, no unresolved critical issues, a supported active connection, administrator approval, and a reasoned eligibility contract.
- [x] Gate rollback plans behind a supported active connection and a prior published release record; never imply provider execution before an adapter exists.
- [x] Replace the approved Preview & validate placeholder with a live validation and release-review panel.
- [ ] Add server-side provider executors that can process approved plans only after platform adapters are configured during deployment.

## Blueprint Step 8 — billing and usage
- [x] Add provider-agnostic plan entitlements and initialize every workspace with an idempotent active free subscription record.
- [x] Record actual queued tool-run usage in the workspace ledger and expose a role-protected subscription, ledger, and usage-summary contract.
- [x] Replace Billing & Usage panel metrics and records with live subscription, entitlement, and ledger data.
- [x] Keep billing actions explicitly read-only until a server-side payment provider is configured; no payment credentials, checkout, receipts, or subscription changes are simulated.

- [x] Commit and push the completed FerixRG implementation to the private GitHub repository at the user’s request.
- [x] Resolve the final comparator workflow regression and rerun the complete validation suite before the pushed release commit.
- [x] Document remaining deployment-gated provider OAuth, payment, publish, rollback, and platform adapter work.

## Accessibility Fix Assistant live proposal
- [x] Define a bounded accessibility-evidence and instruction input contract with credential rejection and explicit no-audit/no-compliance/no-change safety boundaries.
- [x] Add the proposal-only Cloudflare Workers AI operation and provider-neutral Central AI Gateway binding.
- [x] Add the protected workspace router procedure with editor access, exact tool-run matching, draft ownership checks, daily neuron reserve protection, message-free activity metadata, usage accounting, and reviewable JSON proposal artifacts.
- [x] Bind the approved Accessibility Fix Assistant workflow to the live server-side mutation and preserve manual review before any apply or publish action.
- [x] Add provider, gateway, router, and frontend regression coverage; verify the full test suite, TypeScript check, and production build.

Checkpoint: Accessibility Fix Assistant live proposal workflow completed and validated on 2026-08-21. The operation returns reviewable recommendations only; it does not claim to audit, test, score, make compliant, edit, publish, or change a store.

Remaining next work from the shared replay sequence: checkpoint this capability, then continue with the next remaining backend executor from the exact-tool registry.

## Continued backend execution hardening
- [x] Add a bounded Page Analyzer public-URL executor using the existing observed page structure and metadata evidence, with a truthful page-specific execution label and report artifact.
- [x] Add an approved-release execution mutation that enforces admin access, approved-plan state, active supported connection, provider readiness, publish/rollback capability, processing transition, provider reference, failure persistence, and audit metadata.
- [x] Bind the approved release-review frontend to the explicit provider-execution action while preserving cancellation and fail-closed unsupported states.

Checkpoint note: provider-side execution remains intentionally unavailable for the unconfigured adapters; the new path is ready to activate only when a reviewed deployment adapter advertises configuration and capability.

## Connected-store flow hardening
- [x] Replace the simulated frontend Store connection timeout with the protected `stores.beginConnection` mutation and provider-readiness response.
- [x] Create a real Shopify store record from the supplied storefront URL when no Shopify store record exists, while preserving the fail-closed not-configured adapter state.
- [x] Add frontend regression coverage for the backend connection request contract and canonicalize obsolete store tool entry points.

## Provider-selector truthfulness
- [x] Generalize Store onboarding across Shopify, WooCommerce, Adobe Commerce, and custom adapter readiness instead of presenting every platform as Shopify.
- [x] Keep provider names, URL input, store creation, requested scopes, loading, and not-configured errors aligned with the selected server-side adapter.

## Production-safe Shopify authorization foundation
- [x] Add versioned AES-256-GCM encryption for provider credentials using `STORE_CONNECTION_ENCRYPTION_KEY`; plaintext tokens never enter browser state or activity metadata.
- [x] Add one-time, expiring authorization state fields and encrypted connection-secret persistence to the database schema and generated migration.
- [x] Add pure Shopify OAuth helpers for `*.myshopify.com` validation, state-bearing authorization URLs, callback HMAC verification, least-privilege scope handling, and server-side token exchange requests.
- [x] Add the server callback route that validates state and HMAC, checks granted scopes, encrypts the token, updates connection status, records activity, and redirects with only a connection status.
- [x] Upgrade the provider adapter to return a real Shopify authorization URL only when all server-side prerequisites are configured; unsupported providers and release operations remain fail-closed.

## Live per-store connection state
- [x] Add a scoped `stores.connections` query to the Workspace and render the selected store’s provider, connection status, readiness message, and publish capability from backend records rather than hard-coded permission text.
- [x] Extend the mobile workspace harness with live connection records and keep the full frontend test suite green.

## Tool executor inventory continuation
- [x] Give Storefront Analyzer its own deterministic overview-inspection execution identity and regression coverage instead of leaving it under a generic public-URL label.

## Editor comparison truthfulness
- [x] Remove fabricated health scores, projected score deltas, and static redesign images from the active version-history editor surface.
- [x] Show persisted editor-state metadata, measured-health-unavailable labels, and an explicit requirement to run validation or generate a real render before making visual claims.

## Production configuration alignment
- [x] Update `DEPLOYMENT.md` with the Shopify OAuth variables, AES-256-GCM key requirement, exact callback route, migration/build sequence, and the still-gated publish, rollback, payment, and non-Shopify adapter boundaries.

## Production startup guard
- [x] Expose Shopify and connection-encryption environment fields through the server environment contract.
- [x] Fail fast in production when `DATABASE_URL` or `JWT_SECRET` is missing, while leaving optional AI, email, and provider adapters readiness-gated rather than pretending they are configured.

## Truthful live tool workflow
- [x] Replace the active AI workflow’s fixed validation checklist, projected health claims, simulated publishing messages, fabricated design-package claims, and static before/after renders with persisted-state metadata, live validation status, and explicit unavailable-provider/artifact states.
- [x] Keep proposal application as a manual editor decision and make provider-side draft creation/publishing remain gated until a configured adapter reports capability.
- [x] Validate the complete suite, TypeScript check, and production build after the workflow hardening.

## Production smoke-test surface
- [x] Add `GET /api/health` with service status and secret-free AI/provider readiness fields for deployment smoke tests.
- [x] Document the health check, production migration/build/start sequence, and post-deployment verification order.
