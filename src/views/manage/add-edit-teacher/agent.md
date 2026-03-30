# แก้ไขที่ทำในส่วน Add Teacher

## 1. URL-based ID Persistence (ทั้งหมด)

### PersonalDetail.vue
- เพิ่ม `useRoute` และ `onMounted`
- เพิ่ม `onMounted` hook เพื่ออ่าน ID จาก URL query parameter
- เปลี่ยนการ navigate เมื่อบันทึกผล: เพิ่ม `query: { id: personId }`
- ตอนนี้หลังบันทึกแล้ว ID จะผ่านไปใน URL ไปยังหน้า ADDRESS

### AddressInfo.vue
- เพิ่ม `useRoute` และ `onMounted`
- เพิ่ม `onMounted` hook เพื่ออ่าน ID จาก URL
- ในฟังก์ชัน `handleSave` เอา ID จาก URL หรือ store: `const idFromUrl = route.query.id as string; const personId = idFromUrl || teacherStore.personId`
- เปลี่ยน navigate ไปหน้า FAMILY เพื่อเพิ่ม query parameter: `query: { id: personId }`

### FamilyInfo.vue
- เพิ่ม `useRoute` และ `onMounted`
- เพิ่ม `onMounted` hook อ่าน ID จาก URL
- ฟังก์ชัน `saveEntry` อ่าน ID จาก URL + store
- ปุ่ม "ถัดไป" (`handleNext`) ผ่าน ID ไปหน้า EDUCATION: `query: { id: personId }`
- ปุ่ม "ย้อนกลับ" ผ่าน ID ไปหน้า ADDRESS: `query: { id: personId }`

### EducationInfo.vue
- เพิ่ม `useRoute` และ `onMounted`
- เพิ่ม `onMounted` hook อ่าน ID จาก URL
- ฟังก์ชัน `saveEntry` อ่าน ID จาก URL + store
- ปุ่ม "ถัดไป" ผ่าน ID ไปหน้า PROFESSIONAL_LICENSE
- ปุ่ม "ย้อนกลับ" ผ่าน ID ไปหน้า FAMILY

### ProfessionalLicense.vue
- เพิ่ม `useRoute` และ `onMounted`
- เพิ่ม `onMounted` hook อ่าน ID จาก URL
- ฟังก์ชัน `handleSave` อ่าน ID จาก URL + store
- ปุ่ม "ย้อนกลับ" ผ่าน ID ไปหน้า EDUCATION

## 2. Sidebar Navigation ID Persistence

### AppSidebar.vue
- เพิ่ม `onMounted` และ `getTeacherById` import
- เพิ่มฟังก์ชัน `getTeacherIdForNavigation()`: อ่าน ID จาก URL query หรือ store
- เพิ่ม `onMounted` hook: เมื่อ mount ถ้ามี ID ใน URL จะ fetch teacher data จาก API เก็บไว้ใน store
  - ลดเรือก: ถ้า URL มี ID และ store ยังไม่มี teacher data ให้ fetch จาก API
  - เซต: `teacherStore.setCurrentTeacher(response.data)`
- เปลี่ยน add teacher menu item navigation ทั้งหมดให้ผ่าน ID ในทั้ง parent และ child menus

## 3. Disable Menu Items Without Teacher ID

### AppSidebar.vue
- เพิ่มฟังก์ชัน `isPersonIdAvailable()`: return true ถ้ามี ID ใน URL หรือ store
- เพิ่ม `showCondition: isPersonIdAvailable` ให่ทุก menu item ยกเว้น "ข้อมูลส่วนบุคคล":
  - ข้อมูลที่อยู่
  - ข้อมูลครอบครัว
  - ข้อมูลการศึกษา
  - ใบประกอบวิชาชีพ
  - ข้อมูลการดำรงตำแหน่ง (work history)
  - เครื่องราชอิสริยาภรณ์
  - ประวัติวิทยฐานะ
  - ข้อมูลการจ้างงาน
  - ประวัติการดำรงตำแหน่ง
  - ข้อมูลการอบรม/ศึกษาดูงาน (achievements)
  - ข้อมูลผลงานและนวัตกรรม

- Template changes:
  - เพิ่ม `:class="{ 'opacity-50 cursor-not-allowed': child.showCondition && !child.showCondition() }"` ให้ disabled items
  - เพิ่ม `:disabled="child.showCondition && !child.showCondition()"` ให้ button
  - เช็ค `v-if="!child.showCondition || child.showCondition()"` สำหรับ RouterLink - ถ้า pass condition ให้ render link, ถ้า fail ให้ render plain text
  - ตัวอักษรจาง (opacity-50) และ cursor-not-allowed เมื่อไม่ผ่าน condition

## 4. Delete Teacher Feature (Confirm Modal)

### ManageTeacherView.vue
- เพิ่ม AlertDialog components import
- เพิ่ม state: `showDeleteDialog`, `teacherToDelete`, `deleting`
- ฟังก์ชัน `handleDelete()`: เปิด modal แล้วเก็บ teacher ที่จะลบ
- ฟังก์ชัน `confirmDelete()`: ลบข้อมูลจริง, show success/error toast, reload data
- ฟังก์ชัน `cancelDelete()`: ปิด modal และ clear data
- เพิ่ม AlertDialog component ที่แสดง:
  - ไอคอน check
  - ข้อความ "ยืนยันการลบ"
  - ชื่อคุณครู
  - ปุ่ม "ยกเลิก" (แดง)
  - ปุ่ม "ลบ" (เขียว)

## 5. Edit Teacher Feature (Add/Edit Unified)

### ManageTeacherView.vue
- ปุ่ม "แก้ไข" ใน dropdown menu เรียก `handleEdit(teacher)`:
  - ```typescript
    const handleEdit = (teacher: PersonData) => {
      router.push({ name: ROUTE_NAMES.ADD_TEACHER_PERSONAL, query: { id: teacher.id } })
    }
    ```
  - ส่ง teacher ID ไปยัง PersonalDetail ผ่าน query parameter (เหมือน add ส่งไปแต่ add ไม่มี ID)

### PersonalDetail.vue
- ใส่ `isEditing` ref: ตั้งค่า true เมื่อ URL มี ID
- Enhanced `onMounted`:
  - อ่าน ID จาก `route.query.id`
  - ถ้ามี ID: เซต `isEditing = true` และ fetch teacher data จาก API
  - Map API response fields กลับไปเป็น form format:
    - `gender`: 'ชาย' → 'male', 'หญิง' → 'female'
    - `marital_status`: 'โสด' → 'single', 'สมรส' → 'married', 'หม้าย' → 'widowed', 'หย่า' → 'divorced'
    - `prefix_id`: 1 → 'นาย', 2 → 'นาง', 3 → 'นางสาว'
  - เซต `teacherStore.setCurrentTeacher(teacher)` เก็บ data สำหรับ sidebar
- Unified `handleSave`:
  - Create commonPayload object (field สำหรับทั้ง create และ update)
  - ถ้า `isEditing = true`: 
    - เรียก `updateTeacher(personId, payload)` พร้อม preserve `created_at` จาก store
    - Set `updated_at` เป็นเวลาปัจจุบัน
    - Toast: 'แก้ไขข้อมูลส่วนบุคคลสำเร็จ'
  - ไม่ใช่: 
    - สร้าง new ID แล้วเรียก `createTeacher(payload)`
    - ตั้ง `created_at` และ `updated_at` เป็นเวลาปัจจุบัน
    - Toast: 'เพิ่มข้อมูลส่วนบุคคลสำเร็จ'
- ปุ่ม Save แสดง:
  - Loading state: 'กำลังแก้ไข...' (edit) หรือ 'กำลังบันทึก...' (add)
  - Normal state: 'แก้ไข' (edit) หรือ 'บันทึก' (add)

### AddressInfo.vue onwards
- ไม่มีการเปลี่ยนแปลง: ID ต่อไปจาก PersonalDetail ผ่าน URL ดังเดิม
- Pattern: `const idFromUrl = route.query.id as string` + `const personId = idFromUrl || teacherStore.personId`
- ทำงานเหมือนเดิมสำหรับทั้ง add และ edit flow

### Key: ID Persistence is Identical
- **Add**: No ID in initial URL → generateUUID() on PersonalDetail save → Pass ID to next pages
- **Edit**: ID in initial URL → Load data on PersonalDetail mount → Pass ID to next pages  
- **Result**: Both flows persist ID through entire wizard using same mechanism

## Summary

✅ **URL Persistence**: ID ถูกผ่านใน query parameter ทั่วทั้ง add teacher flow
✅ **Sidebar Sync**: Sidebar โหลด teacher data จาก API เมื่อ refresh หน้า
✅ **Disabled Menu**: Menu items ถูก disable จนกว่าจะสร้าง personal data (ได้ ID)
✅ **Delete Modal**: Delete ใช้ confirm modal แทน browser confirm()
✅ **Edit Feature**: Edit mode ใช้ query parameter เพื่อ load data และ populate form, unified CREATE/UPDATE logic
## March 30, 2026 - EducationInfo admin flow update

- `src/views/manage/add-edit-teacher/personal/EducationInfo.vue` now fetches teacher-specific education data through `src/stores/teachers.ts`.
- The manage Education page keeps the admin-oriented `NormalForm` pattern instead of switching to `CreateForm`.
- The page now resolves `personId` from URL query and `useTeacherStore()` like the other manage add-edit-teacher steps.
- Save behavior now follows the manage/admin flow:
  - load the selected teacher via `getEducationById()`
  - update existing rows with `updateEducationRecord()`
  - create the first row with `createEducationRecord()` when no education record exists yet
- Required education fields now follow the schema for `education_level`, `qualification`, `qualification_name`, `institution`, and `country`.
- The field `qualification-used` stays on the form and is mapped back to:
  - `is_used_for_first_appointment`
  - `is_highest_degree`

## March 30, 2026 - ProfessionalLicense manage flow update

- `src/views/manage/add-edit-teacher/personal/ProfessionalLicense.vue` now resolves the selected teacher from URL query plus `useTeacherStore()`.
- Professional license fetching now goes through `getProfessionalLicensesByTeacherId()` from `src/stores/teachers.ts`.
- The store fetches professional licenses with `getDatasetRows(..., { view: 'professional_licenses', where: professional_licenses.person_id = teacherId })` so the manage page receives every license row for the selected teacher, including nested `document_links`.
- Create, update, and delete license records now use the teacher store helpers:
  - `createProfessionalLicense()`
  - `updateProfessionalLicense()`
  - `deleteProfessionalLicense()`
- The manage page still keeps the admin-side `CreateForm` and document upload flow for license attachments.
- File document linking remains in the view because it still needs to:
  - upload new files to the document service
  - create document-link rows
  - remove deleted file links and underlying files during updates/deletes
- Only the document-link handling is now aligned with `src/views/web/personal/ProfessionalLicense.vue`, including the `storeFile()` payload shape and the object passed into `storeFile()` during create/update.
- When creating document links, the manage page now prefers `person_id` from the saved license record over the local payload to avoid FK failures on `document_links.person_id`.
- The form placeholders were updated for the admin flow, including a clearer placeholder for `license_no`.

## March 30, 2026 - Work History manage pages now own their admin flow

- `src/views/manage/add-edit-teacher/work_history/*.vue` no longer import the `src/views/web/work_history/*.vue` pages as wrappers.
- The manage pages now use the same UI and page-level logic as the matching web pages, but resolve the selected teacher from the admin route query plus `useTeacherStore()`.
- Fetching on each manage work-history page now filters by the selected teacher `person_id`:
  - `PositionHistory.vue` uses `governments.person_id`
  - `Employment.vue` uses `employment_contracts.person_id`
  - `AcademicRankHistory.vue` uses `academic_rank.person_id`
  - `ContractPosition.vue` uses `contract_positions.person_id`
  - `RoyalDecorations.vue` uses `decorations.person_id`
- Save flows on the editable pages now also fall back to the selected manage `personId` when building payloads, so admin edits stay attached to the chosen teacher instead of the logged-in user context.
- `AcademicRankHistory.vue` now writes academic rows through `data_manage / v7.0.0` and writes/deletes its `document_links` through `data_manage / v0.0.0`.
