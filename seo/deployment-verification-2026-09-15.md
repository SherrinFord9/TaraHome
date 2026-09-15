# Pages verification correction, September 15, 2026

## Observed failure mode

The Bluetooth guide refresh was pushed as
`0c4cb3c9ad74de6462fc7576f7bf0f5509c7b63a`. Its successful
[Pages workflow](https://github.com/SherrinFord9/TaraHome/actions/runs/35016477184)
reported `2bbd3ca58b46eab79958971bae578503aa6407c6` as its `head_sha` and
`pages_build_version`. The checkout log, however, records the new `0c4cb3c` commit.
The [Pages build record](https://api.github.com/repos/SherrinFord9/TaraHome/pages/builds/1217573025)
also names `0c4cb3c` and reached `built`. The live article, sitemap, writer prompt,
homepage, configurator, and library index matched the production worktree bytes.

This is a concrete metadata discrepancy, not a failed article deployment. It does
not establish the cause of any earlier cron failure. The former runner only used
`gh run list --commit`; this observed case has no matching workflow row and would
time out despite the successful publish.

## Correction

The verifier still accepts a successful matching Pages workflow. When that is
missing, pending, or failed, it also checks the repository's Pages build records
for the exact published commit. A successful build alone is not enough: the live
article must return 200, preserve its canonical, and match the committed HTML
exactly. The site is a static `.nojekyll` deployment, so byte comparison is an
appropriate contract here.

This uses the documented [Pages builds API](https://docs.github.com/en/rest/pages/pages#list-github-pages-builds)
and [repository placeholders in gh api](https://cli.github.com/manual/gh_api).
It performs read-only checks; it does not request another build, run a writer,
force a push, or change the daily quota. Temporary observation/network failures
and stale CDN content are polled within the existing verification window. A
verified build for a different commit cannot satisfy the gate. A later intentional
edit to the same article is not silently accepted as the requested revision.

## Verification

Twenty-one runner tests pass, including stale workflow commit metadata, the normal
workflow path, unrelated commits, failed and pending builds, cancellation,
wrong/stale content, wrong canonical, temporary network failure, and CDN propagation.
The existing nine isolation/quota/retry tests remain intact. The revised function
was also called directly against the live `0c4cb3c` article and returned its exact
Pages build record. No additional article or form submission was created.

The actual cron remains `0 6,18 * * *` and invokes
`/home/sherrinford/bin/tarahome-blog-run.sh`. The launcher fetches remote main and
loads its versioned runner, so the pushed correction is picked up on the next
run. Search rankings and daily article quality remain separate from deployment
verification; this fix does not establish traffic recovery.
