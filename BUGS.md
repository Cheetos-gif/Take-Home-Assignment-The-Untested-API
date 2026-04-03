# Bug Report

## Bug 1 - `getByStatus` uses substring match instead of exact match

**File:** `src/services/taskService.js` line 7  
**Expected:** Filtering by `status=todo` should return only tasks with status exactly `"todo"`. If a user searches "Jo", they'll recieve strings like "John", "Joey", etc. thats why we fix this so we get an exact match.
**Actual:** Uses `.includes(status)` which does a substring match - filtering by `"do"` returns both `"todo"` and `"done"` tasks  
**Discovered:** Unit test `does not return partial status matches` failed  
**Fix:** Change `.includes(status)` to `=== status`

---

## Bug 2 - `getPaginated` has wrong page offset calculation

**File:** `src/services/taskService.js` line 11  
**Expected:** Page 1 with limit 3 should return the first 3 tasks  
**Actual:** Uses `page*limit` as offset, because of this so page 1 skips the first 3 items and returns tasks 4 and 5  
**Discovered:** Unit tests `page 1 returns first set of tasks` and `page 2 returns next set` both failed  
**Fix:** Change `page*limit` to `(page-1)*limit`

---

## Bug 3 - `completeTask` silently resets priority to medium

**File:** `src/services/taskService.js` line 46  
**Expected:** Completing a task should only update `status` and `completedAt`  
**Actual:** The updated object hardcodes `priority: 'medium'`, so a high priority task becomes medium when completed  
**Discovered:** Unit test `preserves original priority` failed  
**Fix:** Remove the `priority: 'medium'` line from the updated object in `completeTask`

---

## Bug 4 - Cannot filter by status and paginate at the same time

**File:** `src/routes/tasks.js` lines 8-22  
**Expected:** `GET /tasks?status=todo&page=1&limit=5` should return paginated results filtered by status  
**Actual:** The route checks for `status` first and returns immediately, pagination params are ignored entirely  
**Discovered:** Code review, the if/else structure makes combined queries impossible  
**Fix:** Apply status filter first, then apply pagination on top of the filtered results