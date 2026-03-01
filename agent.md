# Teacher List Management System - Agent Documentation

## Overview
Implementation of the teacher list management interface based on Figma design specifications. This system provides a comprehensive view for managing teacher records with filtering, searching, and pagination capabilities.

## Implementation Date
March 1, 2026

## Last Updated
March 1, 2026 - Improved table column alignment for better visual hierarchy

## Files Created/Modified

### 1. `src/views/manage/ManageTeacherView.vue`
Main component implementing the teacher list interface.

## Features Implemented

### ✅ Tab Navigation
- **ทั้งหมด (All)**: Shows all teachers regardless of type
- **ข้าราชการ (Government Officials)**: Filters teachers with `is_government: true`
- **ครูอัตราจ้าง (Contract Teachers)**: Filters teachers with `is_government: false`

### ✅ Search Functionality
- Real-time search by teacher's first name or last name
- Search icon positioned on the left side of input field
- Placeholder text: "ค้นหาชื่อคุณครู" (Search teacher name)

### ✅ Add Teacher Button
- Green colored button with plus icon
- Text: "เพิ่มรายชื่อ" (Add name)
- Click handler ready for implementation

### ✅ Teacher Data Table
Displays teacher information in a structured table format:

| Column | Field | Alignment | Description |
|--------|-------|-----------|-------------|
| ชื่อ | firstName | Left | Teacher's first name |
| นามสกุล | lastName | Left | Teacher's last name |
| ประเภท | is_government | Center | Teacher type (displayed via `getTeacherType()`) |
| การดำเนินการ | actions | Center | Action menu dropdown |

**Teacher Type Logic:**
- `is_government: true` → แสดงว่า "ข้าราชการ" (Government official)
- `is_government: false` → แสดงว่า "ครูอัตราจ้าง" (Contract teacher)

**Table Styling:**
- All cells have vertical middle alignment for consistent appearance
- Name columns (ชื่อ, นามสกุล) are left-aligned for readability
- Category (ประเภท) and Actions (การดำเนินการ) are center-aligned for better visual hierarchy

### ✅ Action Menu (Horizontal Three-Dot)
Each teacher row has a centered horizontal three-dot menu button (⋯) with dropdown options displayed horizontally:
- **แก้ไข (Edit)**: Edit button with pencil icon (opens edit interface - handler ready)
- **ลบ (Delete)**: Delete button with trash icon in red color (deletes teacher record - handler ready)
- The action menu is center-aligned in the column for better visual hierarchy

### ✅ Pagination System
- Uses existing `usePagination` composable
- Shows 15 teachers per page
- Displays page numbers with ellipsis for large datasets
- Previous/Next navigation buttons
- Current page highlighted
- Shows total count: "แสดง X รายการจาก Y รายการทั้งหมด"

### ✅ Blue Header Card
- Blue background (#3B82F6) with white text
- Title: "รายชื่อคุณครู" (Teacher List)

## Mock Data

### Data Structure
```typescript
interface Teacher {
  id: number
  firstName: string
  lastName: string
  is_government: boolean  // true = ข้าราฎการ, false = ครูอัตราจ้าง
  status: 'active' | 'resigned'
}
```

### Sample Data
The component includes 1,000 mock teacher records for testing pagination:
- First 14 teachers match the Figma design exactly
- Remaining 986 teachers are auto-generated with random status
- Mix of active and resigned teachers for testing filters
- Mix of government and contract teachers

### Example Records
```typescript
{ id: 1, firstName: 'นายก', lastName: 'ข้าว', is_government: true, status: 'active' }
{ id: 2, firstName: 'นายA', lastName: 'B', is_government: true, status: 'active' }
{ id: 8, firstName: 'นายMID', lastName: 'LANE', is_government: false, status: 'active' }
```

## Technical Details

### Dependencies
- Vue 3 Composition API
- Existing UI Components:
  - Button
  - Input
  - DropdownMenu (horizontal layout)
- Lucide Vue Icons:
  - Search (search input icon)
  - Plus (add button icon)
  - MoreHorizontal (three-dot menu icon)
  - Pencil (edit icon)
  - Trash2 (delete icon)
- Custom Composables:
  - usePagination

### State Management
- `activeTab`: Current selected tab (all/government/contract)
- `searchQuery`: Real-time search input
- `pagination`: Pagination state object
  - page: Current page number
  - per_page: 15 items per page
  - total_pages: Calculated from filtered results
  - total_rows: Total filtered teacher count

### Computed Properties
- `filteredTeachers`: Applies tab filter (by `is_government`) and search query
- `paginatedTeachers`: Returns current page slice of filtered teachers

### Event Handlers
- `changeTab(tab)`: Switch between tab views
- `goToPage(page)`: Navigate to specific page
- `previousPage()`: Navigate to previous page
- `nextPage()`: Navigate to next page
- `handleEdit(teacher)`: Edit teacher (ready for implementation)
- `handleDelete(teacher)`: Delete teacher (ready for implementation)
- `handleAddTeacher()`: Add new teacher (ready for implementation)
- `getTeacherType(teacher)`: Returns teacher type label based on `is_government` field

## Styling
- Uses Tailwind CSS classes
- Responsive design with container
- Hover effects on table rows
- Blue header matching Figma design
- Green accent for add button

## Integration Points

### Ready for Backend Integration
Replace mock data with API calls:

```typescript
// TODO: Replace with actual API calls
import { api } from '@/stores/api'

// Fetch teachers
const fetchTeachers = async () => {
  const response = await api.get('/teachers', {
    params: {
      status: activeTab.value,
      search: searchQuery.value,
      page: pagination.value.page,
      per_page: pagination.value.per_page
    }
  })
  
  mockTeachers.value = response.data.teachers
  pagination.value.total_rows = response.data.total
  pagination.value.total_pages = response.data.total_pages
}
```

### Action Handlers
Current handlers log to console. Implement these actions:

1. **Edit**: Navigate to edit form or open modal
2. **Delete**: Show confirmation dialog, then call delete API
3. **Add**: Navigate to create form or open modal

## Future Enhancements

### Recommended Features
1. **Sorting**: Click column headers to sort
2. **Bulk Actions**: Select multiple teachers for batch operations
3. **Export**: Export teacher list to Excel/PDF
4. **Filters**: Additional filters (department, subject, etc.)
5. **Teacher Details**: Click row to view full teacher profile
6. **Status Badges**: Visual indicators for active/resigned status
7. **Loading States**: Skeleton loaders during data fetch
8. **Error Handling**: Display error messages for failed operations
9. **Confirmation Dialogs**: Use AlertDialog for delete confirmation
10. **Toast Notifications**: Success/error feedback using toast

## Testing Recommendations

### Manual Testing Checklist
- [ ] Tab switching works correctly
- [ ] Search filters results in real-time
- [ ] Pagination navigates correctly
- [ ] Add button triggers handler
- [ ] Edit menu item triggers handler
- [ ] Delete menu item triggers handler
- [ ] Table displays correctly on mobile
- [ ] Empty state when no results found

### Data Edge Cases
- [ ] No teachers available
- [ ] Single page of results (< 15 teachers)
- [ ] Maximum page navigation
- [ ] Search with no results
- [ ] Special characters in search

## Performance Considerations

### Current Implementation
- In-memory filtering and pagination of 1,000 records
- O(n) filtering complexity
- Local state management

### Production Optimization
- Move filtering and pagination to server-side
- Implement debouncing for search input
- Add loading states during API calls
- Consider virtual scrolling for very large datasets
- Cache frequently accessed pages

## Design Fidelity
✅ Matches Figma design specifications:
- Tab navigation layout
- Search input with icon
- Green add button
- Blue header card
- Table structure and columns
- Horizontal three-dot menu (⋯) with horizontal dropdown
- Pagination style and layout

## Notes
- Mock data is embedded in the component for demonstration
- All action handlers are placeholder functions ready for implementation
- Component follows Vue 3 Composition API best practices
- Uses existing design system components
- Fully typed with TypeScript interfaces
- Responsive and accessible design
- Teacher type is determined by `is_government` boolean field:
  - `true` = ข้าราชการ (Government official)
  - `false` = ครูอัตราจ้าง (Contract teacher)
- All icons are from Lucide Vue (lucide-vue-next) for consistency and maintainability

## Contact
For questions or modifications, refer to this documentation and the component source code at `src/views/manage/ManageTeacherView.vue`.
