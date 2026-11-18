import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * NRITYA Firestore Security Rules — Phase 0 Payload-First Audit Verification
 * Verifies that all 12 "Dirty Dozen" adversarial vectors are structurally blocked
 * by the compiled ruleset in firestore.rules.
 */
const rulesText = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');

const assertions: Array<{ name: string; pass: boolean }> = [
  {
    name: '01. Global default-deny safety net present',
    pass: rulesText.includes('match /{document=**}') && rulesText.includes('allow read, write: if false;'),
  },
  {
    name: '02. Self-verification & featured flag spoof blocked on user create',
    pass: rulesText.includes("incoming().verificationStatus == 'none'") && rulesText.includes('incoming().isFeatured == false'),
  },
  {
    name: '03. Shadow/ghost field injection blocked via hasOnly + affectedKeys',
    pass: rulesText.includes('data.keys().hasOnly(') && rulesText.includes('incoming().diff(existing()).affectedKeys().hasOnly('),
  },
  {
    name: '04. Identity spoofing blocked on posts, comments, likes, reports',
    pass: rulesText.includes('incoming().authorId == request.auth.uid') && rulesText.includes('incoming().reporterId == request.auth.uid'),
  },
  {
    name: '05. PII isolated in /users/{userId}/private/account with owner/admin only access',
    pass: rulesText.includes('match /private/account') && rulesText.includes('allow get: if isValidId(userId) && (isOwner(userId) || isAdmin());'),
  },
  {
    name: '06. Organizer events forced into pending moderation queue on create',
    pass: rulesText.includes("incoming().moderationStatus == 'pending'"),
  },
  {
    name: '07. Admin registry protected against non-admin writes',
    pass: rulesText.includes('match /admins/{uid}') && rulesText.includes('allow create, update, delete: if isValidId(uid) && isAdmin();'),
  },
  {
    name: '08. Server timestamp enforcement on create/update',
    pass: rulesText.includes('incoming().createdAt == request.time') && rulesText.includes('incoming().updatedAt == request.time'),
  },
  {
    name: '09. Path variable ID poisoning guard applied',
    pass: rulesText.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"),
  },
  {
    name: '10. Master gate enforces published parent post for comments/likes',
    pass: rulesText.includes("get(/databases/$(database)/documents/posts/$(postId)).data.moderationStatus == 'published'"),
  },
  {
    name: '11. Atomic existsAfter/getAfter guards on counter increments',
    pass: rulesText.includes('existsAfter(') && rulesText.includes('getAfter('),
  },
  {
    name: '12. Email verification required for admin & standard writes',
    pass: rulesText.includes('request.auth.token.email_verified == true'),
  },
];

let failed = 0;
for (const check of assertions) {
  if (!check.pass) {
    console.error(`FAIL: ${check.name}`);
    failed += 1;
  } else {
    console.log(`PASS: ${check.name}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log('All 12 NRITYA Dirty-Dozen security assertions passed.');
