---
name: Use TanStack Query
description: User prefers @tanstack/vue-query for server state instead of manual fetching in Pinia stores
type: feedback
---

Use @tanstack/vue-query for server state (API data fetching, caching, mutations).
**Why:** User knows TanStack Query from React, prefers it over manual fetch logic in Pinia.
**How to apply:** Keep Pinia for client-only state (activeConversationId, socket). Use vue-query for all API calls.
