# Security Specification: Hospital Management System (Aegis Health)

## 1. Data Invariants

1. **User Identity & Isolation**: A user document at `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId`.
2. **Role & Privilege Protection**: Users cannot modify sensitive system fields such as `role` without authorization.
3. **Patient Data Integrity**: Only authenticated healthcare staff (`request.auth != null`) can read or write to `/patients/{patientId}`.
4. **Mandatory Patient Constraints**: Patient document ID must conform to valid format (`^[a-zA-Z0-9_\-]+$`), have `fullName` length <= 120, `phone` length <= 32, and have non-empty visits array.
5. **No Unauthorized Access**: Unauthenticated requests are rejected across all paths. Default deny catch-all `match /{document=**} { allow read, write: if false; }`.

## 2. The "Dirty Dozen" Malicious Payloads

1. **Unauthenticated Read on Patients**: Anonymous client attempting to read `/patients/PT-2026-0104`.
2. **Unauthenticated Write on Patients**: Anonymous client attempting to create `/patients/PT-9999-0001`.
3. **Identity Spoofing in User Profile**: Authenticated User A attempting to write `/users/user-B-id`.
4. **ID Poisoning Attack**: Patient creation with 2KB junk string as document ID.
5. **Role Escalation Attack**: Standard staff user setting `role: "SuperAdmin"` on another user's profile.
6. **Shadow Field Injection**: Patient payload containing undocumented hidden field `shadowAdminToken: "bypass"`.
7. **Malformed Phone Number Flood**: Creating patient with 50KB string as phone number.
8. **Missing Mandatory Fields**: Creating patient without `fullName` or `bloodGroup`.
9. **Negative Age or Invalid Type**: Creating patient with `age: -15` or string for age.
10. **Unbounded Array Attack**: Attempting to store 5,000 arbitrary items in allergies array.
11. **Client Timestamp Spoofing**: Attempting to forge server creation timestamps.
12. **Cross-Tenant Overwrite**: Authenticated User attempting to delete patient records without proper role.

## 3. Test Runner Coverage
All access patterns evaluated against `isValidId`, `isSignedIn`, `isValidUser`, and `isValidPatient`.
