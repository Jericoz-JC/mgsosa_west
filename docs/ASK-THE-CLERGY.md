# Ask the Clergy: moderation guide

Ask the Clergy (`/qa`) collects the questions youth ask priests, bishops, and guest speakers at conferences and Bible studies, with clergy-verified answers.

## How a question moves

| Status | Who sees it | How it gets there |
| --- | --- | --- |
| Review queue | Moderators only | Someone submits the public form |
| Awaiting answer | Everyone | A moderator approves it, or adds it without an answer |
| Answered | Everyone | A moderator publishes a clergy-verified answer |
| Hidden | Moderators only | A moderator hides it. It can be restored |

Nothing a visitor types is public until a moderator approves it. Names are optional, and questions are anonymous by default. Draft answers on unpublished questions are never sent to the public page.

## Moderator access

Open `/qa/admin` and enter the moderator PIN. The PIN is stored in Convex and never in this repository:

```bash
pnpm exec convex env set QA_ADMIN_PIN --prod
```

If `QA_ADMIN_PIN` is not set, the Game Master `HOST_PIN` also unlocks moderation. Set a separate PIN so Q&A moderators don't need Game Master access.

## Publishing an answer

1. Only publish answers that a priest, bishop, or the guest speaker has given or reviewed. The Spiritual Advisor has the final say on spiritual content.
2. Choose **Verified by**: Priest, Bishop, or Guest speaker.
3. Choose **Show on the website as**:
   - **Their name** shows, for example, "Fr. Lazarus Yassa · Guest speaker".
   - **Just the role** shows "Verified by a priest", "Verified by a bishop", or "Verified by a guest speaker".
4. Optionally add the session ("Saturday Q&A panel").
5. Tag the conference so people can filter by **SOFC 2026**, **All MGSOSA conferences**, or **Everything**.

To enter questions asked live in a session, use **Add question**. These appear as "Asked at a session · added by MGSOSA West admins".

## Adding a conference

Add it to `conferences` in `lib/qa/conferences.ts`. It then appears in the public filters, the ask form, and the admin editor. Deploy Convex first, because the backend validates conference slugs.

## Safety limits

- Each browser can have at most 5 questions waiting in the review queue per hour, and the queue holds at most 500.
- Links are rejected in questions.
- Votes ("I've wondered this too") are one per browser and stored as a hash of a random browser id.
