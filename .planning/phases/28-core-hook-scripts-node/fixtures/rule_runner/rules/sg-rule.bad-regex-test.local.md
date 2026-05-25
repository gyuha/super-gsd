---
name: bad-regex-fixture
enabled: true
event: bash
pattern: "[unclosed"
action: warn
---

This rule should never fire because the regex is invalid.
