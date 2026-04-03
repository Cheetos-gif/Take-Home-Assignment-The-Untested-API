# Submission Notes

## Coverage Summary

File             | % Stmts | % Branch | % Funcs | % Lines
-----------------|---------|----------|---------|--------
All files        |   96.02 |    92.85 |    93.1 |   95.62
app.js           |   69.23 |       75 |       0 |   69.23
tasks.js         |     100 |    92.59 |     100 |     100
taskService.js   |     100 |    94.73 |     100 |     100
validators.js    |    91.3 |    94.11 |     100 |    91.3

## Assign Feature Design Decisions

For the assign feature, empty strings are rejected as whoever the task is being assigned needs to exist and a blank string doesn't point to anybody. Reassigning tasks is enabled since tasks may be shifted to someone else in case someone is sick or some other management reason. Lastly, if a task that doesn't exist is being assigned to someone, a 404 error will be thrown.

## What I'd test next with more time

- Combined filtering + pagination (`?status=todo&page=1&limit=5`) 
currently these can't be used together and there are no tests for that interaction
- What happens if some user sends letters instead of numbers, because right now we have parseInt that turns the garbage into 1, this can be tested further
- We are just using an array in memory, so if two people edit the same task at the same time, one update could overwrite the other
- The error handler in `app.js`, triggering a genuine 500 to confirm it responds correctly, we need to generate a real crash to test this

## What surprised me in the codebase

- `completeTask` silently resetting priority to `"medium"`, this would be very hard to notice without tests since the endpoint still returns 200 and looks correct at first glance
- The pagination offset bug (`page * limit` instead of `(page-1)*limit`) was subtle, page 1 worked fine if you expected 0-indexed pages, but the API reference clearly treats page 1 as the first page
- `getByStatus` using `.includes()` instead of `===`, a one character difference that causes completely wrong results for any partial string match

## Questions I'd ask before shipping to production

- Can someone edit a task thats been completed, ideally it should be locked right?
- What's the expected behavior when filtering by an invalid status, currently it returns an empty array instead of a 400 error
- Is the in-memory store intentional long term or is a database planned? Right now all data is lost on every restart
- Should `assignee` be validated against a list of real users, or is any string acceptable?
- Are there any auth requirements because right now anyone can create, update, or delete any task with no authentication