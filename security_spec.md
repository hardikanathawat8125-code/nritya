# NRITYA Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Identity & Role Integrity**: Every user-authored record (`UserProfile.uid`, `CommunityPost.authorId`, `PostComment.authorId`, `PostLike.userId`, `VerificationRequest.userId`, `ClassRegistration.userId`, `EventApplication.applicantId`, `GatheringRegistration.userId`, `ModerationReport.reporterId`) must match `request.auth.uid` on creation and remain immutable on update.
2. **Privilege Escalation Prevention**: Users cannot self-assign `verificationStatus: 'verified'`, `isFeatured: true`, `accountStatus: 'suspended'`, or create `/admins/{uid}` documents. Only verified administrators (`isAdmin()`) may approve verifications, moderate events/posts, or grant admin privileges.
3. **PII Isolation**: Email addresses, notification preferences, and blocked user lists are stored strictly in `/users/{userId}/private/account`, readable/writable only by `isOwner(userId)` or `isAdmin()`.
4. **Master Gate & Relational Integrity**:
   - Subcollections `/posts/{postId}/comments/{commentId}` and `/posts/{postId}/likes/{userId}` require the parent `/posts/{postId}` to exist and be `published`.
   - Event applications require the parent `/events/{eventId}` to exist and have `moderationStatus == 'approved'`.
   - Class and gathering registrations require the parent class/gathering to exist and not be cancelled, and counter updates are bounded (`registeredCount` delta <= 1).
5. **Event Moderation Workflow**: Organizer-submitted events must enter with `moderationStatus == 'pending'` (unless created by an admin). Public `list` queries on `/events` only expose `moderationStatus == 'approved'` documents unless queried by the event's `organizerId` or an administrator.
6. **Temporal Integrity & Strict Keys**: Every write validates exact allowed keys (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly(...)` on update), server timestamps (`createdAt == request.time`, `updatedAt == request.time`), string length limits, and regex-guarded document IDs (`^[a-zA-Z0-9_\-]+$`).

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Self-Verification Spoof**: User creates `/users/{uid}` with `verificationStatus: 'verified'` or `isFeatured: true`.
2. **Ghost Field Injection (Shadow Update)**: User updates `/users/{uid}` adding `{ "roleAdmin": true }`.
3. **Identity Spoofing on Post**: User A creates `/posts/{postId}` with `authorId: "userB"`.
4. **PII Snooping**: User A attempts `get` on `/users/userB/private/account`.
5. **Unverified Event Self-Approval**: Organizer creates `/events/{eventId}` with `moderationStatus: 'approved'` directly.
6. **Admin Registry Poisoning**: Non-admin user attempts `set` on `/admins/{uid}`.
7. **Timestamp Forgery**: User creates `/posts/{postId}` with client-backdated `createdAt`.
8. **ID Poisoning**: User attempts write to `/posts/invalid id with spaces and 2000 chars...`.
9. **Orphaned Comment Write**: User writes `/posts/nonexistent_post/comments/c1`.
10. **Other User's Application Tampering**: User A updates `/eventApplications/{appId}` owned by User B to `status: 'shortlisted'`.
11. **Unauthenticated Mutation**: Anonymous client attempts to create a post, like, or report.
12. **Blanket Admin-Only Report Scraping**: Non-admin user attempts `list` on `/reports` without `where('reporterId', '==', uid)`.
