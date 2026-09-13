# Manage PA reports

The manage sidebar includes การประเมิน PA after คำร้อง. The web sidebar also includes
การประเมิน PA for users with `pa` or one of the configured `pa-*` subject-group roles.
Manage routes require the existing `admin` role; web routes require a PA role.

## Data integration

- Requests: `data_manage` / `v3.0.2` / `document_requests`, filtered by
  `document_type = การประเมินPA`. The table requests only the selected `page` and
  `per_page` (default 15), using the response `total_rows` / `total_pages`.
- Web-user PA requests use `data_manage` /
  `MANAGE_DATASETS.DATASET_VERSION_DOCUMENT_REQUEST_WEB` (`v3.2.0`) /
  `document_requests`; manage PA requests continue to use `v3.0.2`.
- All filters run on the server through `buildPAQuery`: `person_data.department_id = ID`,
  `document_requests.created_at > PREVIOUS-YYYY-12-31T23:59:59.999+07:00` and
  `< NEXT-YYYY-01-01T00:00:00+07:00`, plus first/last name search. Separate where groups
  are ANDed, while the two name conditions are ORed. Department IDs and names are
  defined in `src/lib/subjectGroups.ts`, including ID 13 for คณะผู้บริหาร.
- Web requests always include one OR group containing only the `department_id` values
  allowed by the signed-in user's roles. The response is checked again before it is
  displayed. The `pa` role allows every configured department; the roles `pa-thai`,
  `pa-sci`, `pa-social`, `pa-foreign`, `pa-career`, `pa-health-pe`, `pa-art`, `pa-com`,
  and `pa-guidance` map to their corresponding departments.
- PA details for both manage and web use one consolidated request:
  `pa_assessment` / `v1.2.0` / `pa_data` by request key. It supplies `person_data`,
  `education_records`, `governments`, `academic_rank`, `professional_licenses`,
  `request_committee_pa`, and `document_links`. The UI no longer requests those
  person relations from separate manage datasets.
- `document_links` contains keys and purposes only. Filename, size, MIME type, preview,
  and download data still come from the authenticated document service per file.
- Excel collects all matching server pages with an immutable copy of the table's
  filters and page size, including name search. Changing the page size or filters
  resets the table to page 1. Search is debounced by 500 ms and stale responses are ignored.

## Report semantics

- The current PA form has no assessment year/term. The filter explicitly uses
  **submission year in Bangkok time, Buddhist calendar**, not an inferred academic year.
  Add an explicit assessment year/term to the dataset before changing that meaning.
- Teacher information is current, not a historical snapshot of the submission year.
- Highest education is selected from records explicitly marked `is_highest_degree`.
  Unmarked education is not guessed to be the highest degree. Missing values show `-`.
- Current academic rank uses the latest awarded date, excluding future awards.
- Current salary comes from `request_committee_pa.salary` in the PA snapshot.
- Teaching hours are truncated to an integer as requested by the PDF; other hours
  retain their stored values. Zero is preserved.
- Excel has one sheet per subject group, one row per PA request, all 25 PDF items
  (education split into five columns), submission year, status, and unclassified files.
  Multiple requests by one person remain separate records.

## Files and login

Legacy PA uploads all use `purpose = การประเมินPA`. Filenames following the existing
form convention (`-pa1`, `-pa2-กรรมการ1/2/3`, `-pa3`) are classified. Ambiguous names
remain under ไฟล์ที่ยังไม่ระบุประเภท; array position is never used as a category.
Future uploads should persist a distinct file category in the dataset.

Admin Excel hyperlinks point to `/manage/pa/:id/files?category=...`; web-user Excel
hyperlinks point to `/pa-results/:id/files?category=...`. They never contain a storage
URL or token. The web file page verifies the request's department against the signed-in
user's current roles before requesting file metadata.
Each download refreshes document metadata through the authenticated document API;
document-service byte requests use the existing Axios refresh interceptor. Storage
URLs are fetched without forwarding the bearer token. API-side authorization is
still required for request and document access.

The pending PA navigation path is saved in sessionStorage across OAuth and consumed
after login. Only the six named manage/web PA routes are accepted. No tokens or personal
information are persisted. The document and request APIs remain responsible for enforcing
the same authorization server-side.

## Validation

### Current deployed filter error

The deployed API returned `filter is not allowed: document_requests.created_at >=`.
The frontend therefore uses the allowed `>` lower bound one millisecond before the
selected year and the `<` next-year boundary. The year UI offers the current Bangkok
Buddhist year and the ten preceding years (plus all years).

Merge the following entry into the runtime query's **existing** `where_allow` for
the `document_requests` view; preserve all existing entries and access policies:

```json
{
  "table_name": "document_requests",
  "field": "created_at",
  "operators": [">", "<"]
}
```

The supplied production response confirms `person_data.department_id` is correct.
It also confirms `person_data` is an object, not an array. The frontend now supports
both shapes and validates only a returned ID that actually conflicts with the filter.
The response returned rows while `total_rows` and `total_pages` were zero, so the
frontend derives a usable count for that returned page when this inconsistency occurs.

Run `bun test tests/pa.test.ts` and `bun run build`. Integration with actual records,
admin read permissions and protected file downloads needs a logged-in environment.
