```markdown
# Anonymization & Privacy Protocol

VERITAS is designed from the ground up to protect community reporters, especially in conflict‑sensitive areas. No personal data is ever collected or stored.

## Core Principles

1. **No accounts** – no email, no password, no registration.
2. **No IP logging** – server‑side strip of IP headers.
3. **EXIF stripping** – all location metadata removed from photos.
4. **GPS fuzzing** – optional ±100m blurring for conflict zones.
5. **Client‑side UUID** – unique identifier generated per report, never tied to device.

## Data Stored

For each report, the following is saved locally (IndexedDB) and synced to Supabase:

| Field | Stored? | Notes |
|-------|---------|-------|
| UUID | Yes | Random, client‑generated |
| Damage tier | Yes | None / Minor / Moderate / Major / Total Collapse |
| Infrastructure type | Yes | Residential / Road / Bridge / Utility / Medical / School |
| GPS coordinates | Yes | May be fuzzy if user selected area mode |
| DCI score | Yes | 0.0–1.0 |
| Timestamp | Yes | ISO 8601 |
| Photo (base64) | Yes | EXIF stripped; stored only locally (not synced) |
| Photo AI score | Yes | Result from TensorFlow.js analysis |
| Model confidence | Yes | 0.0–1.0 |

**Never stored:**  
- IP address  
- Device ID  
- Browser fingerprint  
- Any identifier that could link reports to the same user

## Implementation Details

### EXIF Stripping
When a user selects a photo, it is loaded into an `<img>` element, then drawn onto a `<canvas>` at the desired resolution. The resulting data URL (`canvas.toDataURL('image/jpeg', 0.85)`) contains no EXIF metadata.

```javascript
const canvas = document.createElement('canvas');
canvas.width = img.width;
canvas.height = img.height;
canvas.getContext('2d').drawImage(img, 0, 0);
const cleanBase64 = canvas.toDataURL('image/jpeg', 0.85);
```

GPS Fuzzing

When the user selects “Area Report (±100m)”, the exact coordinates are randomly offset within a 100‑meter radius before storage.

```javascript
const radius = 100; // meters
const offsetLat = (Math.random() - 0.5) * (radius / 111000);
const offsetLng = (Math.random() - 0.5) * (radius / (111000 * Math.cos(lat * Math.PI/180)));
lat += offsetLat;
lng += offsetLng;
```

No IP Logging

Supabase is configured via an Edge Function that strips the x-forwarded-for header before the request reaches the reports table. The function also ensures that only necessary fields are inserted.

Access Control

The responder dashboard is protected by a single access code (e.g., UNDP2026), distributed only to authorised partners. The code is hardcoded in the client‑side JavaScript and must be changed before deployment.

---

If you are a responder and need the access code, please contact the UNDP Accelerator Lab team.
