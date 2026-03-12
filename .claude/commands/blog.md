Run the TARA blog pipeline. Orchestrate three sub-agents in sequence: Checker → Researcher → SEO Watcher.

---

## Step 1 — Checker Agent

Spawn a sub-agent with these exact instructions:

> You are the Checker Agent for tarahome.ai.
>
> 1. Read all `.html` files in `/Users/Sherrinford/Personal/website/TaraHome/blog/` (excluding `index.html`) to get the list of existing slugs.
> 2. Read `/Users/Sherrinford/Personal/website/TaraHome/blog/pipeline-state.json` to see previously published and queued topics.
> 3. Use web search to find: trending smart home / home automation news from the last 2 weeks, hot threads on Reddit r/homeautomation and r/homeassistant, and any new device launches or protocol updates (Matter, Thread, Zigbee, Z-Wave).
> 4. Pick ONE topic that:
>    - Is NOT already covered by the existing blog posts
>    - Fits TARA's angle: privacy-first, local processing, no cloud, mmWave presence detection, Matter/Thread/Zigbee protocols
>    - Has strong search intent right now
> 5. Write this JSON to `/Users/Sherrinford/Personal/website/TaraHome/blog/pipeline-state.json`, preserving the existing `published` and `seoChecks` arrays:
>    ```json
>    {
>      "queued": {
>        "title": "...",
>        "slug": "url-friendly-slug",
>        "category": "How-To",
>        "targetKeywords": ["keyword 1", "keyword 2", "keyword 3"],
>        "metaDescription": "Under 160 chars.",
>        "angle": "The specific hook for this post",
>        "estimatedReadTime": 6,
>        "queuedAt": "YYYY-MM-DD"
>      },
>      "published": [...existing...],
>      "seoChecks": [...existing...]
>    }
>    ```
>    category must be one of: How-To, Deep Dive, Basics, News
> 6. Report back the chosen title, slug, and keywords.

Wait for the Checker Agent to finish. Read the queued topic from `blog/pipeline-state.json`.

---

## Step 2 — Researcher Agent

Spawn a sub-agent with these exact instructions, passing it the topic brief from Step 1:

> You are the Researcher Agent for tarahome.ai. Your job is to research a topic, write a full SEO-optimised blog post, and publish it.
>
> **Topic brief:** (paste the queued JSON from pipeline-state.json here)
>
> **TARA's voice:** Technical but accessible. Privacy-focused. No fluff. Readers are smart home enthusiasts who want real, actionable information. Weave in TARA's angle naturally: local processing, no cloud, no cameras, mmWave radar, Matter support.
>
> **Steps:**
>
> 1. Read `/Users/Sherrinford/Personal/website/TaraHome/blog/what-is-smart-home-hub.html` to understand the exact HTML structure and CSS classes to use.
>
> 2. Use web search to research the topic thoroughly. Find:
>    - Specific product names, specs, real data points
>    - Recent news or updates (last 3 months)
>    - Common questions people ask (check Reddit, forums, Google autocomplete suggestions)
>    - Best practices and how-to steps
>
> 3. Find 4–5 images from Unsplash — one hero + one per major H2 section:
>    - Search the web for relevant Unsplash photos using specific search terms per image slot
>    - For each image collect: direct URL (`https://images.unsplash.com/photo-PHOTO_ID?w=900&q=80&auto=format&fit=crop`), photographer name, photographer Unsplash profile URL
>    - Images must be techy, modern, dark-friendly — no cheesy stock photos, no fake AI hands, no generic lightbulbs
>    - Each image must be contextually relevant to its specific section (not the same subject repeated 4 times)
>    - Vary the subjects: e.g. hero=device shot, section 2=setup/wiring, section 3=software screenshot-style, section 4=real home environment
>
> 4. Write the complete blog post HTML file to `/Users/Sherrinford/Personal/website/TaraHome/blog/{slug}.html`. Match the EXACT structure of `what-is-smart-home-hub.html` with these SEO requirements:
>
>    **Head / meta:**
>    - `<title>`: Start with the primary keyword, end with "- TARA". Under 60 chars total.
>    - `<meta name="description">`: Include the primary keyword naturally. Under 155 chars. Make it a compelling reason to click.
>    - Same OG, Twitter, canonical, robots tags
>    - **Two JSON-LD blocks** (see schema rules below)
>
>    **Body structure:**
>    - Same nav, particles.js background div, footer
>    - `article-container` > `article-back` > `article-meta` > `article-title` > **hero image** > `article-content`
>    - Between the `<h1>` and `<div class="article-content">`, insert:
>      ```html
>      <figure class="article-image">
>          <img src="UNSPLASH_URL" alt="ALT TEXT WITH PRIMARY KEYWORD" loading="lazy" width="900" height="500" />
>          <figcaption>Photo by <a href="PHOTOGRAPHER_UNSPLASH_PROFILE_URL" target="_blank" rel="noopener">PHOTOGRAPHER NAME</a> on Unsplash</figcaption>
>      </figure>
>      ```
>    - Use the hero Unsplash image URL as the `"image"` field in the Article JSON-LD
>    - Same waitlist CTA form (Formspree: `https://formspree.io/f/mqelrgbl`)
>    - 2 related posts (most relevant from existing posts)
>    - Same `blog.js` and GA tag (`G-Q1R4JEF4T4`)
>
>    **Article content rules (SEO-critical):**
>    - **First paragraph**: Must contain the primary keyword naturally within the first 2 sentences
>    - **H2 headings**: At least one H2 must contain the primary keyword or a close variant
>    - **Length**: Minimum 1,500 words of article content — thorough coverage beats thin content
>    - **Structure**: 4–6 `<h2>` sections, use `<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<figure>`, `<img>`, `<figcaption>` only
>    - **NO** div, span, class, style, or id attributes inside `article-content`
>    - **Inline images**: After each major `<h2>` section (except the FAQ), insert a contextually relevant Unsplash image using this exact pattern:
>      ```html
>      <figure>
>          <img src="UNSPLASH_URL" alt="DESCRIPTIVE ALT TEXT WITH RELEVANT KEYWORD" loading="lazy" width="900" height="500" />
>          <figcaption>Photo by <a href="PHOTOGRAPHER_PROFILE_URL" target="_blank" rel="noopener">PHOTOGRAPHER NAME</a> on Unsplash</figcaption>
>      </figure>
>      ```
>    - Alt text must describe what's in the image AND include a relevant keyword — this is important for Google Image search
>    - **Final section**: Always end with an `<h2>Frequently Asked Questions</h2>` section containing 4–5 real questions people search for, each as `<h3>Question?</h3><p>Answer...</p>`. Answers should be 2–4 sentences — concise enough for Google to pull as a featured snippet.
>
>    **Schema.org JSON-LD (two blocks required):**
>
>    Block 1 — Article schema (same as existing posts, add `dateModified` and `wordCount`):
>    ```json
>    {
>      "@context": "https://schema.org",
>      "@type": "Article",
>      "headline": "...",
>      "description": "...",
>      "datePublished": "YYYY-MM-DD",
>      "dateModified": "YYYY-MM-DD",
>      "wordCount": 1600,
>      "author": { "@type": "Organization", "name": "TARA", "url": "https://tarahome.ai" },
>      "publisher": { "@type": "Organization", "name": "TARA", "url": "https://tarahome.ai" },
>      "url": "https://tarahome.ai/blog/{slug}.html",
>      "image": "https://tarahome.ai/assets/images/og-image.png",
>      "mainEntityOfPage": { "@type": "WebPage", "@id": "https://tarahome.ai/blog/{slug}.html" }
>    }
>    ```
>
>    Block 2 — FAQPage schema (generated from your FAQ section — this gets rich results in Google):
>    ```json
>    {
>      "@context": "https://schema.org",
>      "@type": "FAQPage",
>      "mainEntity": [
>        {
>          "@type": "Question",
>          "name": "Question text here?",
>          "acceptedAnswer": { "@type": "Answer", "text": "Answer text here." }
>        }
>      ]
>    }
>    ```
>    Include all 4–5 FAQ questions in this schema. The questions and answers must exactly match the FAQ section in the article HTML.
>
> 4. Update `/Users/Sherrinford/Personal/website/TaraHome/blog/index.html`:
>    - Add a new `<a href="/blog/{slug}.html" class="blog-card">` as the FIRST card inside `<div class="blog-list">`
>    - Add a new entry at the START of the `"blogPost"` array in the `<script type="application/ld+json">` block
>
> 5. Update `/Users/Sherrinford/Personal/website/TaraHome/sitemap.xml`:
>    - Add a new `<url>` block before `</urlset>`
>    - Update the `<lastmod>` of the `blog/` URL to today
>
> 6. Update `/Users/Sherrinford/Personal/website/TaraHome/llms.txt`:
>    - Add a new `### Title` entry at the TOP of the `## Blog Articles` section
>    - Format: `### Title\nURL: ...\nCategory: ... | X min read | Month Day, Year\nDescription.\n`
>
> 7. Update `/Users/Sherrinford/Personal/website/TaraHome/blog/pipeline-state.json`:
>    - Move `queued` → prepend to `published` array with `seoChecked: false`
>    - Set `queued` to `null`
>
> 8. Run these git commands:
>    ```bash
>    git -C /Users/Sherrinford/Personal/website/TaraHome add blog/{slug}.html blog/index.html blog/pipeline-state.json sitemap.xml llms.txt
>    git -C /Users/Sherrinford/Personal/website/TaraHome commit -m "blog: add {slug}"
>    git -C /Users/Sherrinford/Personal/website/TaraHome push
>    ```
>
> 9. Report the live URL when done.

Wait for the Researcher Agent to finish.

---

## Step 3 — SEO Watcher Agent

Spawn a sub-agent with these exact instructions:

> You are the SEO Watcher Agent for tarahome.ai.
>
> 1. Read `/Users/Sherrinford/Personal/website/TaraHome/blog/pipeline-state.json` and find posts where `seoChecked` is `false`.
>
> 2. For each unchecked post:
>    a. Fetch the live URL (`https://tarahome.ai/blog/{slug}.html`) to confirm GitHub Pages deployed it.
>    b. Search the web for `site:tarahome.ai {slug}` to check if Google has indexed it.
>    c. Search for the primary keyword to see if tarahome.ai appears in results.
>    d. Search for the exact post title to see if it appears in results.
>
> 3. Report:
>    - Is the URL live? (HTTP 200 or not)
>    - Is it indexed by Google yet?
>    - Where does it rank for the primary keyword?
>    - Any SEO recommendations?
>
> 4. Update `pipeline-state.json` — add a `lastSeoCheck` object to the post entry with your findings. Set `seoChecked: true` only if the post IS indexed.
>
> Note: New posts typically take 24–72h to appear in Google. If not indexed yet, that's normal — just report it.

---

## Final report

After all three agents finish, summarise:
- The new post title and live URL
- Whether GitHub Pages deployed it (HTTP status)
- Whether it's indexed in Google yet
- Any SEO tips from the watcher
- Tell the user to run `/blog` again in 48h to re-check indexing
