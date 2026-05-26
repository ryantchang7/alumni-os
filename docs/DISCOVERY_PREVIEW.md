# Alumni OS — Discovery Preview API

## What It Does

`POST /api/discovery/preview` takes a team name and official public team website URL, fetches that page, discovers links to team-related pages, and attempts to extract roster entries from the root page.

This is a **preview only**. Nothing is saved.

## Input

```json
{
  "teamName": "Penn Men's Golf",
  "schoolName": "University of Pennsylvania",
  "sport": "Men's Golf",
  "gender": "Men",
  "website": "https://pennathletics.com/sports/mens-golf"
}
```

Required: `teamName`, `website`. All others optional.

## Response

```json
{
  "team": { ... },
  "rootPage": {
    "url": "https://...",
    "finalUrl": "https://...",
    "title": "Penn Men's Golf",
    "status": 200,
    "contentType": "text/html"
  },
  "discoveredPages": [
    {
      "url": "https://...",
      "label": "2024-25 Roster",
      "pageType": "current_roster",
      "season": "2024-25",
      "confidence": 0.9,
      "priority": "high",
      "reason": "Roster reference with season 2024-25"
    }
  ],
  "rosterEntriesFromRootIfAny": [
    {
      "fullName": "Ryan Chang",
      "classLabel": "Jr.",
      "sourceUrl": "https://...",
      "extractionConfidence": 0.7
    }
  ],
  "warnings": ["Robots.txt checking is not implemented..."],
  "trustNotes": ["Preview only: no data is saved.", ...]
}
```

## Limitations

- **Single page only**: Only fetches and analyzes the root URL you submit. Does not crawl discovered pages.
- **No persistence**: Nothing is stored in a database.
- **No login-gated pages**: Rejects URLs with login/auth/dashboard/portal in path.
- **No LinkedIn**: LinkedIn URLs are rejected entirely.
- **No multi-page crawling**: Discovered pages are links found on the root page — they are not fetched.
- **Roster extraction is best-effort**: Works for structured HTML tables and common card layouts. PDF rosters and JavaScript-rendered content are not supported.
- **robots.txt not checked**: This prototype does not check robots.txt. Production crawling must check and respect robots.txt before fetching any page.
- **10 second timeout**: Requests that take longer than 10 seconds will fail.

## Trust Rules

1. Public HTTP/HTTPS URLs only
2. LinkedIn URLs are rejected
3. Login-gated-looking URLs are rejected (path contains: login, signin, auth, account, dashboard, portal, sso, admin)
4. Only fetches the submitted URL — does not auto-crawl discovered links
5. No data is saved
6. Production must add: robots.txt checking, rate limiting, user-agent transparency, source attribution

## Next Step: Crawl Selected Pages

After discovery preview, the user should be able to select specific high-confidence roster pages from the discovered list and trigger `/api/discovery/crawl?url=...` to fetch and extract from those pages. This is Phase 3.
