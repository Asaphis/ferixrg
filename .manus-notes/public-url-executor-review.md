# Public URL executor review

The shared public URL executor already applies an SSRF boundary, a 15-second timeout, a one-megabyte HTML limit, and server-side evidence/report storage. It currently records structural metadata, headings, image alt-text coverage, links, viewport and canonical declarations.

The next compatible exact tool is Navigation Analyzer. Its result will be limited to observed HTML navigation landmarks, main landmarks, links, and non-empty anchor text. It will explicitly avoid crawl, click-path, usability, conversion, or full accessibility claims. A missing navigation landmark will be recorded only as a low-severity observed semantic-structure issue.

The existing workflow executes every public-URL source through the persisted executor and renders tool-specific observed metrics. Navigation Analyzer therefore requires only the same scoped result fields and focused tests; no additional source path, connection permission, or simulated output is needed.
