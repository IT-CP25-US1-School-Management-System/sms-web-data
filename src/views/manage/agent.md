# Teacher & Student Management System - Agent Documentation

## Overview

Implementation of teacher and student list management interfaces integrated with DMS (Data Management Service) API. This system provides comprehensive views for managing teacher and student records with filtering, searching, pagination, and full CRUD operations.

## Implementation Date

March 1, 2026

## Last Updated

March 11, 2026 - Applied same table CSS layout to ManageStudentView

## Changelog

### March 11, 2026

#### ManageStudentView — Same Table Layout as Teacher (`src/views/manage/ManageStudentView.vue`)

- Applied identical layout pattern from ManageTeacherView
- Outer container: `container mx-auto py-6 space-y-6` → `flex h-full flex-col gap-3 py-3`
- Header section: added `shrink-0`
- Blue title: detached from table with `rounded-lg mb-3`, `px-4 py-2 text-base`
- Table split into fixed header + scrollable body (`min-h-0 flex-1 overflow-auto`)
- Row cells: `py-3 px-4` → `py-2 px-2` (Figma 8px padding)
- Pagination: moved to bottom-right with `justify-end`, `shrink-0`, `py-2`, Thai labels
- Stats text merged into pagination row with `mr-auto`

#### ManageTeacherView — Figma Row Sizing & Title Spacing (`src/views/manage/ManageTeacherView.vue`)

- Table row cells: `py-3 px-4` → `py-2 px-2` to match Figma spec (padding: 8px, gap: 8px)
- Table header cells: `py-3 px-4` → `py-2 px-2` (same sizing as data rows)
- Blue title "รายชื่อคุณครู": separated from table with `mb-3`, uses `rounded-lg` (fully rounded)
- Table container: `border-t-0 rounded-b-lg` → `border rounded-lg` (standalone rounded border since title is detached)

#### ManageTeacherView — More Table Space (`src/views/manage/ManageTeacherView.vue`)

- Outer container: `space-y-4 py-6` → `gap-3 py-3` (less vertical padding)
- Header section: `space-y-4` → `shrink-0 space-y-2` (tighter + won't compress)
- Blue title bar: `p-4 text-lg` → `px-4 py-2 text-base` + `shrink-0`
- Pagination: `py-3` → `py-2` + `shrink-0`
- Reconnected blue header to table card: `border-t-0 rounded-b-lg`

#### ManageTeacherView Responsive Layout (`src/views/manage/ManageTeacherView.vue`)

- Uses flex layout chain (`h-full` → `min-h-0 flex-1`) to fill available viewport height
- Header section (tabs, search, add button) uses `shrink-0` so it never compresses
- Table card uses `min-h-0 flex-1` to take remaining space
- Table body inside `overflow-auto` with `min-h-0 flex-1` — scrolls only when rows exceed available space
- `<thead>` uses `sticky top-0 z-10` to stay visible during scroll
- Pagination bar uses `shrink-0` to always stay visible at the bottom
- All sizes are normal (not compact) — `py-3` rows, standard buttons, `text-sm` stats
- Layout adapts automatically: small screens scroll, large screens show everything without scroll
- **Layout chain**: MainLayout (`h-screen` → `flex-1 min-h-0 overflow-hidden`) → ManageTeacherView (`h-full flex-col` → table `min-h-0 flex-1 overflow-auto`)
- Pagination uses `mt-auto` to push to bottom of flex container
- Only `<tbody>` is inside the scrollable `<div>` now (two separate `<table>` elements sharing same column widths)
- Added `mb-2` to the blue "รายชื่อคุณครู" header for spacing between the title bar and the table
- Changed `rounded-b-lg` to `rounded-lg` on the table border container since the blue header is no longer visually attached

#### MainLayout Height Fix (`src/layouts/manage/MainLayout.vue`)

- `SidebarInset` now uses `class="flex h-screen flex-col overflow-hidden"` to constrain to viewport height
- `<main>` changed from `flex-1 p-6` to `min-h-0 flex-1 overflow-hidden p-6` so child flex layouts can calculate height correctly
- This allows ManageTeacherView's table to scroll within the viewport without pushing pagination off-screen

#### ManageTeacherView Table Layout Fix (`src/views/manage/ManageTeacherView.vue`)

- Changed outer container from `container mx-auto py-6 space-y-6` to `flex h-full flex-col space-y-4 py-6` so the page fills available height
- Table card uses `flex min-h-0 flex-1 flex-col` to fill remaining space
- Table body wrapped in `min-h-0 flex-1 overflow-auto` so only the table rows scroll (not the whole page)
- Table header uses `sticky top-0 z-10` to stay visible while scrolling
- Pagination moved to **bottom-right** with `justify-end` and pinned below the table (not inside scroll area)
- Stats text ("แสดง X รายการจาก Y รายการทั้งหมด") moved into the pagination bar with `mr-auto` to sit on the left side
- Pagination no longer requires scrolling down to find — always visible at the bottom

#### Manage Sidebar (`src/layouts/manage/AppSidebar.vue`)

- Removed "หน้าหลัก" (Home) menu item from the main menu section
- Removed unused `Home` icon import from lucide-vue-next

#### Layout Restructuring

- Moved `src/layouts/AppSidebar.vue` → `src/layouts/manage/AppSidebar.vue`
- Moved `src/layouts/MainLayout.vue` → `src/layouts/manage/MainLayout.vue`
- Updated all imports referencing the old layout paths

#### Router Changes (`src/router/index.ts`)

1. **Home route (`/`) — Role-based redirect**
   - If user has `admin` role → redirect to `/manage/teachers` (ROUTE_NAMES.MANAGE_TEACHERS)
   - Otherwise → redirect to `/personal/personal-details` (ROUTE_NAMES.PERSONAL_DETAILS)

   ```typescript
   {
     path: '/',
     name: ROUTE_NAMES.HOME,
     redirect: () => {
       const authStore = useAuthStore()
       if (authStore.hasRole('admin')) {
         return { name: ROUTE_NAMES.MANAGE_TEACHERS }
       }
       return { name: ROUTE_NAMES.PERSONAL_DETAILS }
     },
     meta: { requiresAuth: true },
   }
   ```

2. **Manage redirect (`/manage`)**
   - Added new route `/manage` that redirects to `/manage/teachers`

3. **Route meta flags for role-based access control**
   - `meta: { webOnly: true }` — Web routes (non-admin users only): `/personal`, `/work-history`, `/achievements`, `/documents`
   - `meta: { adminOnly: true }` — Admin routes only: `/manage`, `/manage/teachers`, `/manage/students`, `/import-data`, `/requests`

4. **`beforeEach` route guard (enabled)**
   - Uncommented and rewritten with role-based routing logic:
     - **Guest routes** (`requiresGuest`): If already authenticated → redirect to HOME
     - **Auth routes** (`requiresAuth`): If not authenticated → check session → redirect to LOGIN if failed
     - **Admin + webOnly route** → redirect to `/manage/teachers`
     - **Non-admin + adminOnly route** → redirect to `/personal/personal-details`

#### Role Detection

- Uses `useAuthStore().hasRole('admin')` to check if user has the `admin` role
- Admin role is found in `user_info.roles` array from the auth token response
- Example roles: `["offline_access", "default-roles-sms-project", "admin", "uma_authorization"]`

## Files Created/Modified

### Type Definitions

1. **`src/types/dataset.ts`** - Core DMS API types (Dataset, DatasetVersion, responses)
2. **`src/types/teacher.ts`** - Teacher/PersonData types with Government and EmploymentContract relations
3. **`src/types/student.ts`** - Student types with Address and Parent relations

### API Layer

4. **`src/stores/dataset.ts`** - Generic CRUD functions for DMS dataset operations
5. **`src/stores/students.ts`** - Student-specific API implementations
6. **`src/stores/teachers.ts`** - Teacher-specific API implementations

### Views

7. **`src/views/manage/ManageTeacherView.vue`** - Teacher list interface with API integration
8. **`src/views/manage/ManageStudentView.vue`** - Student list interface with API integration

## API Integration

### DMS API Structure

- **Base URL**: `https://bscit.sit.kmutt.ac.th/capstone25/cp25us1/data/api`
- **Dataset ID**: `capstone`
- **Dataset Version**: `v1.0.0`
- **Views**:
  - `person` - Teacher data (PersonData with Government/EmploymentContract relations)
  - `student` - Student data (Student with Address/Parent relations)

### Endpoint Pattern

```
GET /v1/datasets/{dataset_id}/versions/{version}/data?view_name={view}
```

### API Functions

**Generic CRUD (src/stores/dataset.ts)**

```typescript
getDatasetRows<T>(datasetId, version, params)
getDatasetRowByKey<T>(datasetId, version, key, viewName)
createDatasetRow<T>(datasetId, version, data)
updateDatasetRow<T>(datasetId, version, key, data)
deleteDatasetRow(datasetId, version, key)
```

**Students API (src/stores/students.ts)**

```typescript
getStudents(params) // view_name: 'student'
getStudentById(id)
createStudent(data)
updateStudent(id, data)
deleteStudent(id)
```

**Teachers API (src/stores/teachers.ts)**

```typescript
getTeachers(params) // view_name: 'person'
getTeacherById(id)
createTeacher(data)
updateTeacher(id, data)
deleteTeacher(id)
```

## Features Implemented

### ✅ Teacher Management (ManageTeacherView.vue)

#### Tab Navigation

- **ทั้งหมด (All)**: Shows all teachers regardless of type
- **ข้าราชการ (Government Officials)**: Filters by checking `government` object existence
- **ครูอัตราจ้าง (Contract Teachers)**: Filters by checking `employment_contract` object existence

**Filter Logic:**

```typescript
// Tab filter - uses is_government for API query
if (activeTab.value === 'government') {
  filterConditions.push({ column: 'is_government', operator: 'eq', value: true })
} else if (activeTab.value === 'contract') {
  filterConditions.push({ column: 'is_government', operator: 'eq', value: false })
}

// Display logic - checks actual objects
const getTeacherType = (teacher: PersonData) => {
  return teacher.government ? 'ข้าราชการ' : 'ครูอัตราจ้าง'
}
```

#### Search Functionality

- Real-time search by teacher's first name (first_name_th) or last name (last_name_th)
- 500ms debounce to reduce API calls
- Search icon positioned on the left side of input field
- Placeholder text: "ค้นหาชื่อคุณครู" (Search teacher name)
- Resets to page 1 on search

**Filter Structure:**

```typescript
// Flat array structure (not nested)
const filterConditions: any[] = [
  // Tab filter
  { column: 'is_government', operator: 'eq', value: true },
  // Search filter with OR logic
  {
    logic: 'OR',
    conditions: [
      { column: 'first_name_th', operator: 'like', value: '%query%' },
      { column: 'last_name_th', operator: 'like', value: '%query%' },
    ],
  },
]
```

#### Add Teacher Button

- Green colored button with plus icon
- Text: "เพิ่มรายชื่อ" (Add name)
- Shows "ฟีเจอร์กำลังพัฒนา" toast notification (TODO: implement form dialog)

#### Teacher Data Table

Displays teacher information from DMS API:

| Column       | Field             | Alignment | Description                                   |
| ------------ | ----------------- | --------- | --------------------------------------------- |
| ชื่อ         | first_name_th     | Left      | Teacher's first name (Thai)                   |
| นามสกุล      | last_name_th      | Left      | Teacher's last name (Thai)                    |
| ประเภท       | government object | Center    | Teacher type (checked via `getTeacherType()`) |
| การดำเนินการ | actions           | Center    | Action menu dropdown                          |

**Teacher Type Detection:**

- Has `government` object → "ข้าราชการ" (Government official)
- No `government` object (has `employment_contract`) → "ครูอัตราจ้าง" (Contract teacher)

**Table Styling:**

- All cells have vertical middle alignment for consistent appearance
- Name columns (ชื่อ, นามสกุล) are left-aligned for readability
- Category (ประเภท) and Actions (การดำเนินการ) are center-aligned for better visual hierarchy
- Loading state with spinner: "กำลังโหลดข้อมูล..."
- Empty state: "ไม่พบข้อมูลคุณครู"

#### Action Menu (Horizontal Three-Dot)

Each teacher row has a centered horizontal three-dot menu button (⋯) with dropdown options:

- **แก้ไข (Edit)**: Shows "ฟีเจอร์กำลังพัฒนา" toast (TODO: implement edit dialog)
- **ลบ (Delete)**: Confirms with native dialog, then calls `deleteTeacher(id)` API
  - Success: Shows success toast and reloads data
  - Error: Shows error toast with error message

#### Pagination System

- Uses `usePagination` composable
- Shows 15 teachers per page
- Server-side pagination via DMS API
- Displays page numbers with ellipsis for large datasets
- Previous/Next navigation buttons
- Current page highlighted
- Shows total count: "แสดง X รายการจาก Y รายการทั้งหมด"
- Pagination state synced with API response (total_rows, total_pages)

#### Blue Header Card

- Blue background (#3B82F6) with white text
- Title: "รายชื่อคุณครู" (Teacher List)

### ✅ Student Management (ManageStudentView.vue)

#### Search Functionality

- Real-time search by first name (first_name_th), last name (last_name_th), or student ID (student_id)
- 500ms debounce to reduce API calls
- Search icon on the left
- Placeholder text: "ค้นหาชื่อนักเรียน หรือรหัสนักเรียน"
- Resets to page 1 on search

**Filter Structure:**

```typescript
const filterConditions: any[] = [
  {
    logic: 'OR',
    conditions: [
      { column: 'first_name_th', operator: 'like', value: '%query%' },
      { column: 'last_name_th', operator: 'like', value: '%query%' },
      { column: 'student_id', operator: 'like', value: '%query%' },
    ],
  },
]
```

#### Add Student Button

- Green colored button with plus icon
- Text: "เพิ่มรายชื่อ" (Add name)
- Shows "ฟีเจอร์กำลังพัฒนา" toast notification (TODO: implement form dialog)

#### Student Data Table

| Column       | Field         | Alignment | Description                 |
| ------------ | ------------- | --------- | --------------------------- |
| ชื่อ         | first_name_th | Left      | Student's first name (Thai) |
| นามสกุล      | last_name_th  | Left      | Student's last name (Thai)  |
| รหัสนักเรียน | student_id    | Center    | Student ID number           |
| ชั้น         | grade_level   | Center    | Grade level (e.g., "ม.1")   |
| ห้อง         | class_section | Center    | Class section (e.g., "1")   |
| การดำเนินการ | actions       | Center    | Action menu dropdown        |

**Important Note:**

- ❌ **Do NOT use `sort_by: 'grade_level'`** - Not an allowed projection alias
- Sorting should be removed or use allowed fields only

#### Action Menu

Each student row has a dropdown menu with:

- **แก้ไข (Edit)**: Shows "ฟีเจอร์กำลังพัฒนา" toast (TODO: implement edit dialog)
- **ลบ (Delete)**: Confirms with native dialog, then calls `deleteStudent(id)` API

#### Pagination

- 15 students per page
- Server-side pagination via DMS API
- Same pagination controls as teacher view

#### Blue Header Card

- Blue background (#3B82F6) with white text
- Title: "รายชื่อนักเรียน" (Student List)

## Type System

### Dataset Types (src/types/dataset.ts)

OpenAPI-compliant types for DMS API operations:

```typescript
// Catalog types
interface Dataset {
  dataset_id: string
  name: string
  description?: string
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  created_at: string
  updated_at?: string
}

// Version types
interface DatasetVersion {
  dataset_id: string
  version: string
  source_id?: string
  description?: string
  access_policies?: any
  created_at: string
}

// Query params for data serving
interface DatasetQueryParams {
  page?: number
  per_page?: number
  filter?: any[] // Flat array structure
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Response wrappers
interface DatasetListResponse<T> {
  data: T[]
  page: number
  per_page: number
  total_rows: number
  total_pages: number
}

interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}
```

### Teacher Types (src/types/teacher.ts)

```typescript
interface PersonData {
  id: string
  prefix_id: number
  role_id: string
  is_government: boolean

  first_name_th: string
  middle_name_th?: string
  last_name_th: string
  first_name_en?: string
  middle_name_en?: string
  last_name_en?: string

  national_id?: string
  passport_id?: string
  gender?: Gender
  religion?: string
  nationality?: string
  ethnicity?: string
  blood_type?: BloodType
  phone?: string
  personal_email?: string
  birth_date?: string
  appointment_type_id?: number
  marital_status?: string
  spouse_name?: string

  // Relations (populated by API)
  government?: Government // มีเมื่อเป็นข้าราชการ
  employment_contract?: EmploymentContract // มีเมื่อเป็นครูอัตราจ้าง

  created_at: string
  updated_at?: string
}

interface Government {
  id: string
  person_id: string
  work_status: string
  executive_group?: string
  department_id?: number
  salary?: number
  retirement_date?: string
  government_entry_date?: string
  direct_pay_no?: string
  position_number?: string
  created_at: string
  updated_at?: string
}

interface EmploymentContract {
  id: string
  person_id: string
  contract_action: string
  hiring_nature: string
  department_id?: number
  salary: number
  social_security: string
  period_start: string
  period_end: string
  first_contract_start?: string
  order_no?: string
  contract_sequence?: number
  budget_type: string
  school_revenue_type?: string
  work_status: string
  created_at: string
  updated_at?: string
}
```

### Student Types (src/types/student.ts)

```typescript
interface Student {
  id: string
  student_id: string
  grade_level: string // "ม.1", "ม.2", etc.
  class_section: string
  academic_track?: string
  student_type?: string

  prefixe_id: string
  first_name_th: string
  last_name_th: string
  first_name_en?: string
  last_name_en?: string

  date_of_birth?: string
  age_years: number
  birth_province?: string
  weight_kg?: number
  height_cm?: number
  blood_type?: BloodType
  gender?: Gender
  religion?: string
  ethnicity?: string
  nationality?: string
  phone_number?: string
  marital_status?: string

  address_id: string
  created_at: string
  updated_at: string
}

interface Address {
  id: string
  student_id: string
  house_registry_no?: string
  house_no?: string
  moo?: string
  building?: string
  soi?: string
  road?: string
  subdistrict?: string
  district?: string
  province?: string
  postal_code?: string
  is_house_registered?: boolean
  is_current?: boolean
  created_at: string
  updated_at: string
}

interface Parent {
  id: string
  student_id: string
  parent_type: 'father' | 'mother' | 'guardian'
  prefix_id?: number
  first_name?: string
  last_name?: string
  national_id?: string
  occupation?: string
  workplace?: string
  phone_number?: string
  email?: string
  monthly_income?: number
  is_alive?: boolean
  created_at: string
  updated_at: string
}
```

## Technical Details

### Dependencies

- Vue 3 Composition API (`<script setup lang="ts">`)
- TypeScript (strict mode)
- Existing UI Components (shadcn-vue):
  - Button
  - Input
  - DropdownMenu
- Lucide Vue Icons (lucide-vue-next):
  - Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2
- Toast Notifications:
  - vue-sonner (toast.success, toast.error, toast.info)
- Custom Composables:
  - usePagination (pagination state and helpers)
- HTTP Client:
  - Axios (three instances: authApiInstance, dataApiInstance, documentApiInstance)

### State Management (Both Views)

```typescript
// Data state
const teachers = ref<PersonData[]>([]) // or students
const loading = ref(false)
const searchQuery = ref('')

// Teacher-specific
const activeTab = ref<TabType>('all') // 'all' | 'government' | 'contract'

// Pagination state
const pagination = ref<PaginationData>({
  page: 1,
  per_page: 15,
  total_pages: 1,
  total_rows: 0,
})
```

### API Call Pattern

```typescript
const fetchTeachers = async () => {
  loading.value = true
  try {
    // Build filter array
    const filterConditions: any[] = []

    // Add filters based on tab/search
    if (activeTab.value === 'government') {
      filterConditions.push({ column: 'is_government', operator: 'eq', value: true })
    }

    if (searchQuery.value.trim()) {
      filterConditions.push({
        logic: 'OR',
        conditions: [
          { column: 'first_name_th', operator: 'like', value: `%${query}%` },
          { column: 'last_name_th', operator: 'like', value: `%${query}%` },
        ],
      })
    }

    // Call API
    const response = await getTeachers({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      filter: filterConditions.length > 0 ? filterConditions : undefined,
      sort_by: 'first_name_th',
      sort_order: 'asc',
    })

    // Update state
    teachers.value = response.data
    pagination.value.total_rows = response.total_rows
    pagination.value.total_pages = response.total_pages
  } catch (error: any) {
    console.error('Failed to fetch teachers:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลคุณครูได้',
    })
  } finally {
    loading.value = false
  }
}
```

### Watchers

```typescript
// Watch for tab changes (teacher only)
watch([() => activeTab.value, () => pagination.value.page], () => {
  fetchTeachers()
})

// Watch for search query changes (debounced)
let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchTeachers()
  }, 500)
})

// Load data on mount
onMounted(() => {
  fetchTeachers()
})
```

### Event Handlers

**Teacher View:**

- `changeTab(tab: TabType)`: Switch between tabs and reset to page 1
- `goToPage(page: number)`: Navigate to specific page
- `previousPage()`: Go to previous page if available
- `nextPage()`: Go to next page if available
- `handleEdit(teacher: PersonData)`: Shows "ฟีเจอร์กำลังพัฒนา" toast (TODO)
- `handleDelete(teacher: PersonData)`: Confirms and calls `deleteTeacher(id)` API
- `handleAddTeacher()`: Shows "ฟีเจอร์กำลังพัฒนา" toast (TODO)
- `getTeacherType(teacher: PersonData)`: Returns label by checking `teacher.government` object

**Student View:**

- `goToPage(page: number)`: Navigate to specific page
- `previousPage()`: Go to previous page if available
- `nextPage()`: Go to next page if available
- `handleEdit(student: Student)`: Shows "ฟีเจอร์กำลังพัฒนา" toast (TODO)
- `handleDelete(student: Student)`: Confirms and calls `deleteStudent(id)` API
- `handleAddStudent()`: Shows "ฟีเจอร์กำลังพัฒนา" toast (TODO)

## Styling

- Uses Tailwind CSS classes exclusively
- Responsive design with container wrapper
- Hover effects on table rows (`hover:bg-muted/30`)
- Blue header cards (#3B82F6 / `bg-blue-600`)
- Green add buttons (`bg-green-600 hover:bg-green-700`)
- Loading states with spinner animation
- Empty states with muted text color
- Disabled states for inputs/buttons during loading

## Known Issues & Limitations

### ⚠️ Sort Field Restrictions

- **Error**: `sort_by field 'grade_level' is not an allowed projection alias for sorting`
- **Solution**: Remove `sort_by` parameter or use only allowed fields
- **Affected**: ManageStudentView.vue - removed grade_level sorting

### 🔧 Pending Features (TODO)

1. **Add/Edit Form Dialogs**: Both teacher and student views show "ฟีเจอร์กำลังพัฒนา" toast
2. **Form Validation**: Need vee-validate + Zod schemas for create/update forms
3. **Confirmation Dialogs**: Currently using native `confirm()`, should use AlertDialog component
4. **Advanced Filters**: More filter options (department, grade, academic track, etc.)
5. **Sorting UI**: Column headers should be clickable for sorting
6. **Bulk Operations**: Select multiple rows for batch delete/update

### ✅ Completed Integrations

- [x] Real API calls to DMS backend
- [x] Server-side pagination
- [x] Server-side filtering
- [x] Loading states with spinners
- [x] Error handling with toast notifications
- [x] Success feedback with toast notifications
- [x] Debounced search (500ms)
- [x] Delete operations with API calls
- [x] Type safety with TypeScript interfaces
- [x] Filter structure aligned with backend expectations

## Testing Recommendations

### Manual Testing Checklist

**Teacher View:**

- [x] Tab switching works correctly
- [x] Tab switching resets to page 1
- [x] Search filters results via API
- [x] Search with debounce (500ms)
- [x] Pagination navigates correctly
- [x] Pagination syncs with API response
- [x] Add button shows toast notification
- [x] Edit menu shows toast notification
- [x] Delete menu confirms and calls API
- [x] Loading state displays during API calls
- [x] Empty state when no results found
- [x] Error handling shows toast messages
- [x] Teacher type detection from `government` object

**Student View:**

- [x] Search by name or student ID works
- [x] Search with debounce (500ms)
- [x] Pagination navigates correctly
- [x] Add button shows toast notification
- [x] Edit menu shows toast notification
- [x] Delete menu confirms and calls API
- [x] Loading state displays during API calls
- [x] Empty state when no results found
- [x] Error handling shows toast messages
- [ ] Sort by grade level (blocked by API limitation)

### API Integration Testing

- [x] Teacher list API (`/v1/datasets/capstone/versions/v1.0.0/data?view_name=person`)
- [x] Student list API (`/v1/datasets/capstone/versions/v1.0.0/data?view_name=student`)
- [x] Delete teacher API (`DELETE /v1/datasets/capstone/versions/v1.0.0/data/key/{id}?view_name=person`)
- [x] Delete student API (`DELETE /v1/datasets/capstone/versions/v1.0.0/data/key/{id}?view_name=student`)
- [x] Filter structure matches backend expectations
- [x] Pagination parameters work correctly
- [ ] Create teacher API (pending form dialog)
- [ ] Update teacher API (pending form dialog)
- [ ] Create student API (pending form dialog)
- [ ] Update student API (pending form dialog)

### Data Edge Cases

- [x] No teachers/students available (empty state)
- [x] Single page of results (< 15 items)
- [x] Multiple pages navigation
- [x] Search with no results (empty state)
- [x] Special characters in search (handled by LIKE operator)
- [x] API errors (toast notifications)
- [ ] Network timeouts (needs testing)
- [ ] Invalid filter fields (API validation)

### Performance Testing

- [x] Debounced search reduces API calls
- [x] Loading states prevent duplicate requests
- [x] Server-side pagination handles large datasets
- [ ] Response time monitoring
- [ ] Concurrent request handling

## Performance Considerations

### Current Implementation

- ✅ Server-side filtering and pagination via DMS API
- ✅ Debounced search input (500ms) to reduce API calls
- ✅ Loading states prevent duplicate requests
- ✅ Watchers optimize re-fetching on state changes
- ✅ Reactive refs for efficient Vue reactivity
- ✅ Pagination composable for reusable logic

### Optimization Strategies Applied

1. **API Call Reduction**: Debouncing search prevents excessive requests
2. **Request Deduplication**: Loading state blocks concurrent identical requests
3. **Efficient Watchers**: Combined watchers for tab + page changes reduce redundant calls
4. **Server-Side Processing**: All heavy operations (filter, sort, paginate) handled by backend
5. **Selective Re-renders**: Only affected components re-render on state changes

### Future Optimizations

1. **Request Caching**: Cache recently fetched pages to avoid redundant API calls
2. **Optimistic Updates**: Update UI immediately on delete, rollback on error
3. **Virtual Scrolling**: For very large single-page views (if needed)
4. **Progressive Loading**: Load visible rows first, then off-screen rows
5. **Web Workers**: Move heavy computation to background threads (if client-side processing added)
6. **Request Cancellation**: Cancel pending requests when new search initiated

## Design Fidelity

✅ Matches Figma design specifications:

- Tab navigation layout (teacher view)
- Search input with left-aligned icon
- Green add button with plus icon
- Blue header cards (#3B82F6)
- Table structure and column alignment
- Horizontal three-dot menu (⋯) with dropdown
- Pagination style and layout
- Loading states with spinner
- Empty states with muted text
- Action icons (Pencil, Trash2)

✅ Additional UI enhancements:

- Toast notifications for user feedback
- Loading spinners during API calls
- Disabled states during operations
- Hover effects on interactive elements
- Consistent spacing and typography
- Responsive container layout

## Important Implementation Notes

### Data Management

- ✅ **No Mock Data**: All data fetched from real DMS API endpoints
- ✅ **Server-Side Operations**: Filtering, sorting, and pagination handled by backend
- ✅ **Type Safety**: Full TypeScript type definitions for all entities
- ✅ **Error Handling**: Try-catch blocks with user-friendly toast notifications
- ✅ **Loading States**: Prevent user actions during API operations

### Filter Structure

- **Format**: Flat array, NOT nested FilterGroup structure
- **Logic Operators**: Use `{ logic: 'OR', conditions: [...] }` for OR conditions
- **Column Names**: Must match database column names exactly
- **Operators**: `eq`, `like`, `gt`, `lt`, etc.
- **Example**:
  ```typescript
  ;[
    { column: 'is_government', operator: 'eq', value: true },
    {
      logic: 'OR',
      conditions: [
        { column: 'first_name_th', operator: 'like', value: '%query%' },
        { column: 'last_name_th', operator: 'like', value: '%query%' },
      ],
    },
  ]
  ```

### Teacher Type Detection

- **Query Filter**: Uses `is_government` boolean field for database filtering
- **Display Logic**: Checks for `government` object presence for UI display
- **Reasoning**: `government` and `employment_contract` are relations that may or may not be loaded
- **Implementation**: `teacher.government ? 'ข้าราชการ' : 'ครูอัตราจ้าง'`

### API Endpoint Structure

- **Base**: `https://bscit.sit.kmutt.ac.th/capstone25/cp25us1/data/api`
- **Pattern**: `/v1/datasets/{dataset_id}/versions/{version}/data`
- **Query Params**: `view_name`, `page`, `per_page`, `filter`, `sort_by`, `sort_order`
- **View Names**:
  - `person` → Teacher/PersonData with Government/EmploymentContract
  - `student` → Student with Address/Parent relations

### Sort Field Limitations

- ⚠️ **Not all fields support sorting** - API enforces allowed projection aliases
- ❌ `grade_level` is NOT an allowed sort field
- ✅ Use `first_name_th`, `last_name_th`, `student_id` for sorting
- 💡 Remove `sort_by` parameter if field causes errors

### Component Architecture

- **Pattern**: Composition API with `<script setup lang="ts">`
- **State**: Reactive refs (not Pinia stores for views)
- **Watchers**: Debounced search, tab changes, pagination
- **Lifecycle**: `onMounted()` triggers initial data fetch
- **Props**: None (standalone page components)
- **Emits**: None (self-contained)

### Toast Notifications

- **Library**: vue-sonner (NOT useToast composable)
- **Import**: `import { toast } from 'vue-sonner'`
- **Methods**: `toast.success()`, `toast.error()`, `toast.info()`
- **Structure**: `toast.error('หัวข้อ', { description: 'รายละเอียด' })`

### Pending Implementation (TODO)

1. **Form Dialogs**: Create/edit dialogs for teachers and students
2. **Form Validation**: Vee-validate + Zod schemas
3. **Confirmation Dialogs**: Replace native `confirm()` with AlertDialog component
4. **Sorting UI**: Clickable column headers
5. **Bulk Operations**: Multi-select with batch actions
6. **Export**: CSV/Excel export functionality
7. **Advanced Filters**: More filter criteria (department, subjects, etc.)
8. **Detail Views**: Click row to see full profile

## Related Files

### Type Definitions

- `src/types/dataset.ts` - DMS API types (Dataset, DatasetVersion, responses)
- `src/types/teacher.ts` - PersonData, Government, EmploymentContract types
- `src/types/student.ts` - Student, Address, Parent types

### API Layer

- `src/stores/dataset.ts` - Generic CRUD functions + constants (DATASET_ID, DATASET_VERSION)
- `src/stores/students.ts` - Student-specific API functions
- `src/stores/teachers.ts` - Teacher-specific API functions
- `src/stores/api.ts` - Axios instances, interceptors, and auth API functions

### Views

- `src/views/manage/ManageTeacherView.vue` - Teacher management interface
- `src/views/manage/ManageStudentView.vue` - Student management interface

### Composables

- `src/composables/usePagination.ts` - Pagination state and helpers
- `src/composables/useToast.ts` - Toast helper (NOT used in these views)

### UI Components (shadcn-vue)

- `src/components/ui/button/` - Button component
- `src/components/ui/input/` - Input component
- `src/components/ui/dropdown-menu/` - Dropdown menu component
- `src/components/ui/alert-dialog/` - Alert dialog (TODO: use for confirmations)

## Contact & Maintenance

- **Documentation**: This file (`src/views/manage/agent.md`)
- **Source Code**:
  - Teacher view: `src/views/manage/ManageTeacherView.vue`
  - Student view: `src/views/manage/ManageStudentView.vue`
- **API Types**: `src/types/dataset.ts`, `src/types/teacher.ts`, `src/types/student.ts`
- **API Functions**: `src/stores/dataset.ts`, `src/stores/students.ts`, `src/stores/teachers.ts`

For questions, modifications, or bug reports, refer to this documentation and the component source code.

---
## March 30, 2026

### Add Teacher - EducationInfo uses teacher.ts with admin NormalForm flow
- `src/views/manage/add-edit-teacher/personal/EducationInfo.vue` now fetches education data via `getEducationById()` from `src/stores/teachers.ts`.
- The page stays in the manage/admin `NormalForm` style and does not switch to `CreateForm`.
- Saving now uses teacher-side helpers:
  - `updateEducationRecord()` for existing rows
  - `createEducationRecord()` when the teacher has no education row yet
- Required education fields now match the schema for `education_level`, `qualification`, `qualification_name`, `institution`, and `country`.
- The page resolves the target teacher from URL query/store so admin edits the selected teacher, not the current web user.

# DMS API Knowledge Base

## POST Data Endpoint (Create Row)

### Endpoint

```
POST /v1/datasets/{dataset_id}/versions/{version}/data
```

### Request Structure

- **Content-Type**: `application/json`
- **Body**: Plain JSON object with field names as keys
- **Example**:

```json
{
  "first_name_th": "สมชาย",
  "last_name_th": "ใจดี",
  "prefix_id": 1,
  "is_government": true
}
```

### Response Structure

```json
{
  "code": 201,
  "message": "Row created successfully",
  "data": {
    "id": "uuid-string",
    "first_name_th": "สมชาย",
    "last_name_th": "ใจดี",
    ...
  }
}
```

### Error Responses

| Code | Scenario                                         | Example                                                                                     |
| ---- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 400  | Config error in dataset policy                   | `"config error: field 'building' in AllowEdit not found in schema for table 'person_data'"` |
| 400  | Validation error (missing required field)        | `"validation failed: field 'first_name_th' is required"`                                    |
| 401  | Unauthorized (invalid/expired token)             | `"Unauthorized"`                                                                            |
| 403  | Forbidden (no write permission for policy)       | `"Forbidden"`                                                                               |
| 404  | Dataset or version not found                     | `"Dataset or version not found"`                                                            |
| 409  | Conflict (duplicate key or constraint violation) | `"Conflict - duplicate key or constraint violation"`                                        |

## DMS Validation Pipeline

### Step 1: Authentication

- Check Bearer token in Authorization header
- Return 401 if invalid/expired

### Step 2: Authorization

- Check access policies (`access_policies`) for write permission
- Return 403 if user doesn't have write permission

### Step 3: Policy Configuration Validation ⚠️ **CRITICAL**

- Load dataset version's `policies.write` section:
  ```json
  "write": {
    "query": {
      "from": {
        "source": "source_id",
        "schema": "schema_name",
        "table": "table_name"  // ← where data will be inserted
      }
    },
    "allow_edit": ["col1", "col2", "col3", ...]  // ← allowed fields
  }
  ```
- **Validate**: Every field in `allow_edit` must exist as a column in the target `table`
- **If failed**: Return 400 error
  ```
  config error: field '{field_name}' in AllowEdit not found in schema for table '{table_name}'
  ```

### Step 4: Schema Validation

- Check request JSON keys against `allow_edit` list
- Reject any field not in `allow_edit`

### Step 5: Data Validation

- Check required fields (no NULL constraints)
- Validate data types, formats, constraints
- Return 400 if any validation fails

### Step 6: Insert Row

- Execute INSERT using target table and validated data
- Generate row ID (UUID)
- Return 201 with full row data

## Common DMS Configuration Errors

### Error 1: AllowEdit Field from Wrong Table

**Symptom**: "field 'X' in AllowEdit not found in schema for table 'Y'"

**Cause**: Backend admin configured `allow_edit` with fields from a related/joined table instead of the target table.

**Example**:

```json
{
  "write": {
    "query": { "from": { "table": "person_data" } },
    "allow_edit": [
      "first_name_th", // ✅ exists in person_data
      "last_name_th", // ✅ exists in person_data
      "building", // ❌ exists in person_addresses (wrong table!)
      "phone", // ❌ exists in person_phones (wrong table!)
      "minor_group" // ❌ exists in education_records (wrong table!)
    ]
  }
}
```

**Solution**: Admin must remove fields that don't belong to the target table from `allow_edit`:

```json
"allow_edit": [
  "first_name_th",
  "last_name_th",
  "prefix_id",
  "gender",
  "phone",
  "email",
  "birth_date"
  // REMOVE: building, minor_group, etc. (use separate datasets for those tables)
]
```

**Frontend Workaround** (temporary, not recommended):

- Filter payload to only include whitelisted fields before sending
- But this only masks the problem — request will eventually fail for allowed cross-table fields

### Error 2: Missing Required Fields

**Symptom**: `validation failed: field 'X' is required`

**Cause**: Request missing a field that has NOT NULL constraint and no default value.

**Solution**: Include all required fields in request body.

### Error 3: Trying to Update Related Tables via Main Table

**Symptom**: Same as Error 1 (field not in schema)

**Cause**: Trying to insert `person_addresses`, `person_family`, `education_records` etc. via the `person_data` dataset.

**Solution**: Create separate dataset versions for each related table:

- Dataset: `data_get_view`, Version: `v1.3.0` → for `person_data` CREATE
- Dataset: `data_get_view`, Version: `v1.3.1` → for `person_addresses` CREATE (separate `allow_edit`)
- Dataset: `data_get_view`, Version: `v1.3.2` → for `person_family` CREATE (separate `allow_edit`)
- etc.

**Current Implementation** (Add Teacher Feature):

```typescript
// src/stores/teachers.ts
const ADDRESS_DATASET_ID = DATASET_ID // TODO: replace with real dataset ID
const FAMILY_DATASET_ID = DATASET_ID // TODO: replace with real dataset ID
const EDUCATION_DATASET_ID = DATASET_ID // TODO: replace with real dataset ID
const LICENSE_DATASET_ID = DATASET_ID // TODO: replace with real dataset ID

// These all use the same dataset version (v1.3.0)
// which is configured for person_data / allow_edit=['person_data fields only']
// So createFamilyMember, createEducationRecord etc. will FAIL
```

**Fix Required**: Backend must provide separate dataset versions or update main dataset's `allow_edit` to include all related table fields safely.

## Add Teacher Feature Implementation

### File Structure

```
src/stores/
├── addTeacher.ts ← Pinia store to pass personId between wizard pages
└── teachers.ts ← API functions

src/types/
└── teacher.ts ← DTOs: TeacherCreateDTO, PersonAddressCreateDTO, etc.

src/views/manage/add-edit-teacher/personal/
├── PersonalDetail.vue ← Creates person_data row → saves personId to store
├── AddressInfo.vue ← Creates person_addresses row → uses personId from store
├── FamilyInfo.vue ← Creates person_family rows → uses personId from store
├── EducationInfo.vue ← Creates education_records rows → uses personId from store
└── ProfessionalLicense.vue ← Creates professional_licenses rows → uses personId from store
```

### Wizard Data Flow

1. **PersonalDetail**: Collect Thai name, prefix, gender, etc. → Call `createTeacher(TeacherCreateDTO)` → Save `result.data.id` to `addTeacherStore.personId` → Redirect to AddressInfo
2. **AddressInfo**: Collect address fields → Call `createPersonAddress({ person_id: store.personId, ...address })` → Redirect to FamilyInfo
3. **FamilyInfo**: Multi-entry family members → For each: Call `createFamilyMember({ person_id: store.personId, ...family })` → Redirect to EducationInfo
4. **EducationInfo**: Multi-entry education → For each: Call `createEducationRecord({ person_id: store.personId, ...education })` → Redirect to ProfessionalLicense
5. **ProfessionalLicense**: Single professional license → Call `createProfessionalLicense({ person_id: store.personId, ...license })` → Clear store → Redirect to ManageTeachers

### Implementation Status

- ✅ `useAddTeacherStore` (Pinia) created — stores `personId` across pages
- ✅ DTOs created — PersonAddressCreateDTO, FamilyMemberCreateDTO, EducationRecordCreateDTO, ProfessionalLicenseCreateDTO
- ✅ API functions created — createPersonAddress, createFamilyMember, createEducationRecord, createProfessionalLicense
- ✅ PersonalDetail.vue — wired to createTeacher API, saves personId
- ✅ AddressInfo.vue — wired to createPersonAddress API
- ✅ FamilyInfo.vue — multi-entry form, wired to createFamilyMember API
- ✅ EducationInfo.vue — multi-entry form, wired to createEducationRecord API
- ✅ ProfessionalLicense.vue — single form, wired to createProfessionalLicense API

### Current Blocker

**DMS Configuration Error**: Dataset `data_get_view` v1.3.0 has mismatched `allow_edit` policy:

- `write.query.from = person_data`
- `allow_edit` includes fields from `person_addresses` (building, province_code, etc.)
- Solution: Backend admin must fix by either:
  - Option A: Remove cross-table fields from `allow_edit` (breaks ADDRESS creation)
  - Option B: Create separate dataset versions for ADDRESS, FAMILY, EDUCATION, LICENSE tables
  - Option C: Server validates and filters `allow_edit` based on actual `from` table schema (dynamic policy)

### Test Case

Add a new teacher with minimal data:

```json
{
  "first_name_th": "สมชาย",
  "last_name_th": "ใจดี",
  "prefix_id": 1,
  "is_government": true
}
```

**Expected**: 201, personId returned  
**Actual**: 400, "config error: field 'building' in AllowEdit not found in schema..."

---

## March 30, 2026
### Add Teacher - ProfessionalLicense uses teacher.ts with manage admin flow

- `src/views/manage/add-edit-teacher/personal/ProfessionalLicense.vue` now resolves `personId` from the route query and `useTeacherStore()` like the other manage add-edit-teacher pages.
- The page fetches professional license records via `getProfessionalLicensesByTeacherId()` from `src/stores/teachers.ts`.
- The store fetches professional licenses with `getDatasetRows(..., { view: 'professional_licenses', where: professional_licenses.person_id = teacherId })` so manage pages receive every license row for the selected teacher, including nested `document_links`.
- License record persistence now uses the teacher helpers:
  - `createProfessionalLicense()`
  - `updateProfessionalLicense()`
  - `deleteProfessionalLicense()`
- The page keeps the existing admin `CreateForm` UX because this step still supports file attachments and multiple license entries.
- Document uploads and document-link row management remain in the view layer so the page can:
  - upload new files
  - attach uploaded files to the saved license row
- Only the document-link handling now mirrors `src/views/web/personal/ProfessionalLicense.vue`, including the `storeFile()` payload shape and the objects passed into `storeFile()` during create/update.
- When creating document links, the manage page now prefers `person_id` from the saved license record over the local payload to reduce FK failures on `document_links.person_id`.
  - delete detached files and links during edit/delete flows

### Add Teacher - Work History pages now use manage-scoped teacher selection

- `src/views/manage/add-edit-teacher/work_history/AcademicRankHistory.vue`
- `src/views/manage/add-edit-teacher/work_history/ContractPosition.vue`
- `src/views/manage/add-edit-teacher/work_history/Employment.vue`
- `src/views/manage/add-edit-teacher/work_history/PositionHistory.vue`
- `src/views/manage/add-edit-teacher/work_history/RoyalDecorations.vue`
- These pages no longer proxy directly to `src/views/web/work_history/*`.
- They now keep the same UI and page behavior as the web versions, but resolve `personId` from the admin route query plus `useTeacherStore()`.
- Their fetches now filter by the selected teacher with these table names:
  - `governments`
  - `employment_contracts`
  - `academic_rank`
  - `contract_positions`
  - `decorations`
- Editable work-history pages now also fall back to the selected manage `personId` when building payloads, so updates stay scoped to the teacher being edited by the admin.
- Admin placeholders were updated, including the `license_no` field and the loading-state messaging on the page.
- `AcademicRankHistory.vue` now uses `data_manage / v7.0.0` for academic create/update/delete and `data_manage / v0.0.0` for its `document_links`.

### Add Teacher - FamilyInfo update now preserves created_at

- `src/views/manage/add-edit-teacher/personal/FamilyInfo.vue` now resends the existing `created_at` when updating a family member row so backend-required metadata is not dropped during edit.

### Manage dataset/version constants

- Manage-side dataset IDs and versions are now centralized in `src/lib/constants.ts`.
- The related admin stores/views now reuse those constants instead of repeating hardcoded strings:
  - `src/stores/teachers.ts`
  - `src/stores/document_request.ts`
  - `src/stores/students.ts`
  - `src/stores/reporting.ts`
  - `src/views/manage/add-edit-teacher/personal/PersonalDetail.vue`
  - `src/views/manage/add-edit-teacher/personal/ProfessionalLicense.vue`
- `src/views/manage/add-edit-teacher/work_history/AcademicRankHistory.vue`
- `src/views/manage/ImportDataView.vue`
- `src/views/manage/CreateAttendanceReportTemplateDialog.vue`
- `src/views/manage/add-edit-teacher/work_history/ContractPosition.vue` now uses `data_manage / v8.0.0 / history_position` for fetch/create/update/delete and reuses `MANAGE_DATASETS` for document-link dataset settings.
- Its `position` field now loads options from `data_get_dropdown` with the same role-source pattern used by `src/views/manage/add-edit-teacher/personal/PersonalDetail.vue`, while keeping the saved value as the selected role name.

### Add Teacher - FamilyInfo delete flow and AcademicRank schema alignment

- `src/stores/teachers.ts` now includes `deleteFamilyMember()` so the manage add-edit-teacher flow deletes family rows through the same teacher store used for fetch/create/update.
- `src/views/manage/add-edit-teacher/personal/FamilyInfo.vue` now enables the `CreateForm` delete action, defers confirmation through `ConfirmModal`, and supports both persisted-row deletes plus unsaved-row cleanup by reloading the family dataset.
- `src/views/manage/add-edit-teacher/work_history/AcademicRankHistory.vue` now aligns the manage form and payload with the `academic_rank` table schema by using the actual field names:
  - `order_no`
  - `ranking_type`
  - `position_rank`
  - `criteria`
  - `field_of_expertise`
  - `reward`
  - `special_month_reward`
  - `special_reward`
  - `position_reward`
  - `awarded_date`
  - `approval_date`
- The manage academic page no longer sends the copied field `special_compensation`, and its confirm/save UI now reads `ranking_type` directly.
- Family `prefix_id` handling now uses `src/lib/helpers.ts` so family forms display a helper-derived `prefix_name` and convert it back with `getPrefixId(...)` before update payloads are sent.

### Add Teacher - Manage family prefix dropdown and AcademicRank revert

- `src/views/manage/add-edit-teacher/personal/FamilyInfo.vue` now uses a manage-only dropdown for `prefix_id`, and its option list comes from prefix helper data in `src/lib/helpers.ts`.
- The web family page was not switched to this dropdown flow.
- `src/views/manage/add-edit-teacher/work_history/AcademicRankHistory.vue` was reverted to the prior alias-based form version that uses `order-no`, `academic-rank`, and `special-compensation` instead of the later schema-aligned field set.
- That reverted academic page now still maps its existing alias fields back to DB columns on save:
  - `order-no` -> `order_no`
  - `academic-rank` -> `ranking_type`
  - `special_reward` -> `special_month_reward`
  - `special-compensation` -> `special_reward`
- Existing DB dates such as `approval_date` are normalized to `YYYY-MM-DD` before update payloads are sent.
- The reverted academic salary fields are also normalized to numbers before save/update for `reward`, `special_month_reward`, `special_reward`, and `position_reward`.
