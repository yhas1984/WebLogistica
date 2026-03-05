# WebLogistica — Lessons Learned

## Session 2026-03-05

### Environment Secrets
- **Pattern**: `.env.local.example` was committed with real API keys.
- **Fix**: GitHub Push Protection blocked the push. Always sanitize example env files.
- **Rule**: Never put real secrets in example files. Use `your_..._key` placeholders only.

### Genei Token
- **Pattern**: Token expires after 15 days. Calling login on every request gets IP blocked.
- **Fix**: Cache token in memory for 14 days. Auto-invalidate on 401.
- **Rule**: Always cache auth tokens and implement auto-invalidation on 401.
