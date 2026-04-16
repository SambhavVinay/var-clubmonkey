### 11.1 End-to-End Deployment Flow

Date: April 16, 2026. Duration: ~15 minutes from code commit to production. The workflow below illustrates the complete DevOps lifecycle — from a developer writing code to the application running in production on Hugging Face Spaces.

| Stage | Tool | Result | Time |
| :--- | :--- | :--- | :--- |
| Local development | VS Code + Python/Node | Feature coded & committed | 5 min |
| Push & PR creation | GitHub | Pull request opened | 1 min |
| Lint & code quality | Ruff | Pass — 0 errors | 5 sec |
| Unit tests | pytest | Pass — All tests complete | 10 sec |
| API Integration Tests | GitHub Actions / Jenkins | 11/11 endpoints healthy (HTTP 200) | 20 sec |
| Code review | GitHub PR | Approved by reviewers | 3 min |
| Merge to main | GitHub | Merged | 30 sec |
| Push to registry/deploy | Hugging Face Git | Code pushed to Spaces repository | 1 min |
| Docker build | Hugging Face Spaces | Image built successfully | 2 min |
| Production deploy | Hugging Face Spaces | Production LIVE on port 7860 | 1 min |
| Production verification | Browser | HTTP 200 — all features work | 1 min |
| **TOTAL** | — | **SUCCESS** — near-zero manual steps | **~15 min** |
