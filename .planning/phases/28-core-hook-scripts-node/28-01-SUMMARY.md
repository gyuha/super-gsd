# 28-01 Summary — transcript_matcher.cjs (NODE-02)

## Output

- Created: `hooks/transcript_matcher.cjs` — **53 lines**.
- Coexists with `hooks/transcript_matcher.py` (unchanged; per D-06 deletion deferred to Phase 31 CLEAN-01).

## Python → JS function mapping

| Python (`hooks/transcript_matcher.py`) | JS (`hooks/transcript_matcher.cjs`) |
|----------------------------------------|--------------------------------------|
| L1–6 module docstring | L1 single-line header comment |
| L9–10 `def detect_signal(transcript_path)` | L33 `function detectSignal(transcriptPath)` |
| L14–15 `if not transcript_path: return ''` | L34 `if (!transcriptPath) return '';` |
| L17–21 `try: open().read() except (FileNotFoundError, IOError, PermissionError, UnicodeDecodeError): return ''` | L36–41 `try { fs.readFileSync(path, 'utf-8') } catch { return '' }` |
| L24–30 `GSD_PLAN_SIGNALS` literal list | L5–11 top-level `const GSD_PLAN_SIGNALS` (verbatim) |
| L32–35 `IMPLEMENTATION_SIGNALS` | L12–15 `const IMPLEMENTATION_SIGNALS` (verbatim) |
| L37–41 `REVIEW_SIGNALS` | L16–20 `const REVIEW_SIGNALS` (verbatim) |
| L43–47 `HOOKIFY_SIGNALS` | L21–25 `const HOOKIFY_SIGNALS` (verbatim) |
| L50 `recent = '\n'.join(content.splitlines()[-200:])` | L27–31 `_splitlines` helper + L43–44 `lines.slice(-200).join('\n')` |
| L52–53 `if any(sig in recent for sig in GSD_PLAN_SIGNALS): return 'gsd-plan-complete'` | L46 `if (GSD_PLAN_SIGNALS.some(sig => recent.includes(sig))) return 'gsd-plan-complete'` |
| L54–55 IMPLEMENTATION_SIGNALS branch | L47 same branch |
| L56–57 REVIEW_SIGNALS branch | L48 same branch |
| L58–59 HOOKIFY_SIGNALS branch | L49 same branch |
| L60 fallthrough `return ''` | L50 fallthrough `return ''` |
| (export) — Python implicit module-level `detect_signal` symbol | L53 `module.exports = { detectSignal };` (per D-16 camelCase) |

## B-1 (trailing-newline) regression — negative-test proof

The `_splitlines` helper exists to mirror Python `str.splitlines()` semantics. Python `"a\nb\nc\n".splitlines()` → `['a','b','c']` (3 elements). JS `"a\nb\nc\n".split(/\r?\n/)` → `['a','b','c','']` (4 elements). Without popping the phantom trailing empty, `.slice(-200)` on a 201-line file with trailing `\n` drops the signal at line 2.

To confirm the fix is real, not theoretical, I temporarily commented out the pop line in `_splitlines`:

```js
function _splitlines(s) {
  const lines = s.split(/\r?\n/);
  // if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();  // <-- disabled
  return lines;
}
```

Re-running the fixture loop produced:

```
MISMATCH long-with-trailing-newline.txt got= "" expected= "gsd-plan-complete"
exit=1
```

This is exactly the B-1 failure mode predicted in 28-CONTEXT.md and 28-01-PLAN.md. The pop was then restored and the full fixture loop printed `transcript_matcher.cjs parity OK` (all 6 fixtures match `expected.json`).

## Verification

- Embedded `<verify>` block in 28-01-PLAN.md: **PASS** — printed `transcript_matcher.cjs parity OK` over all 6 fixtures (`gsd-plan.txt`, `implementation.txt`, `review.txt`, `hookify.txt`, `empty.txt`, `long-with-trailing-newline.txt`).
- 28-VERIFY.md Section "transcript_matcher.cjs verification" recipe: equivalent automated assertion ran inline as part of the embedded `<verify>` (same fixture set, same expected mapping) — parity confirmed across all 6 fixtures.
- Zero external `require()` targets beyond `fs` (verified by `grep -E "require\('[^./]" hooks/transcript_matcher.cjs | grep -vE "(fs|path|process|child_process|util)" | wc -l` = 0).
- `module.exports.detectSignal` is a function (`typeof` check passes).
- `hooks/transcript_matcher.py` unchanged.

## Deviations

None. Plan executed verbatim.
