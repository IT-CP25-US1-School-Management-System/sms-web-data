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

## Summary

✅ **URL Persistence**: ID ถูกผ่านใน query parameter ทั่วทั้ง add teacher flow
✅ **Sidebar Sync**: Sidebar โหลด teacher data จาก API เมื่อ refresh หน้า
✅ **Disabled Menu**: Menu items ถูก disable จนกว่าจะสร้าง personal data (ได้ ID)
✅ **Delete Modal**: Delete ใช้ confirm modal แทน browser confirm()
