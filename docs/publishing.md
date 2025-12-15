## Publishing checklist
- Ensure `package.json` is ready (`name: ai-light-widget`, version set, sideEffects false).
- Run `pnpm build` and confirm `dist/` outputs are regenerated without React peer warnings.
- Verify `dist/index.d.ts` exports `ChatWidget`, `ChatWindow`, `WidgetController`, and `LightWidgetProps`.
- Sanity-check bundle size/treeshaking: `dist/index.js` ≈ 39 KB (ESM) with `sideEffects: false`.

## Tagging & release
```bash
# Dry-run: verify tag push without publishing
git tag -a v0.1.0 -m "v0.1.0" && git push --dry-run origin v0.1.0

# Real tag + push
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

## Publish (npm)
- Use your registry credentials: `pnpm publish --access public`
- If using 2FA, run `pnpm publish --access public --otp <code>`
