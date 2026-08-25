# Public URL executor availability

FerixRG’s canonical registry permits public-URL sources for more tools than currently have dedicated deterministic implementations. The workspace execution endpoint must therefore enforce an explicit server-side supported-tool set before it fetches, creates evidence, issues generic findings, or writes a report.

Dedicated public-URL implementations currently exist for Storefront Analyzer, Heading Structure Analyzer, Image SEO Analyzer, SEO Analyzer, Accessibility Analyzer, Site Structure Analyzer, Navigation Analyzer, Performance Analyzer, CTA Analyzer, Content Quality Analyzer, Product Page Analyzer, and Image Optimization Analyzer. All other public-URL tools must return a clear unsupported-execution message until their dedicated executor is built.
