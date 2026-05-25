---
name: block-file-test-fixture
enabled: true
event: file
conditions:
  - field: new_string
    operator: regex_match
    pattern: "FIXTURE_FORBIDDEN_TOKEN"
action: block
---

Fixture block message body for forbidden token detection.
