<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

// TODO: เปลี่ยนเป็น false เมื่อต้องการดูอย่างเดียว (readonly)
const isEditMode = true

function handleSave(groupIndex: number) {
  // TODO: เรียก API บันทึกข้อมูล
  toast(`บันทึกข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}

function handleDelete(groupIndex: number) {
  // TODO: เรียก API ลบข้อมูล
  toast(`ลบข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}
</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    <CreateForm
      :isDropdown="true"
      :readonly="!isEditMode"
      :fields="[
        [
          {
            topic: 'ข้อมูลส่วนตัว',
            content: [
              {
                name: 'relationship',
                label: 'ความสัมพันธ์',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกความสัมพันธ์',
                options: [
                  { label: 'บิดา', value: 'father' },
                  { label: 'มารดา', value: 'mother' },
                  { label: 'คู่สมรส', value: 'spouse' },
                  { label: 'บุตร', value: 'child' },
                  { label: 'อื่นๆ', value: 'other' },
                ],
              },
              {
                name: 'title',
                label: 'คำนำหน้า',
                type: 'select',
                required: true,
                placeholder: '',
                options: [
                  { label: 'นาย', value: 'mr' },
                  { label: 'นาง', value: 'mrs' },
                  { label: 'นางสาว', value: 'miss' },
                ],
              },
              {
                name: 'first-name',
                label: 'ชื่อ',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'last-name',
                label: 'นามสกุล',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'maiden-name',
                label: 'นามสกุลเดิม',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'middle-name',
                label: 'ชื่อกลาง',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'id-card',
                label: 'เลขบัตรประชาชน',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'gender',
                label: 'เพศ',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'living-status',
                label: 'การมีชีวิต',
                type: 'select',
                required: true,
                placeholder: '',
                options: [
                  { label: 'มีชีวิต', value: 'alive' },
                  { label: 'เสียชีวิต', value: 'deceased' },
                ],
              },
              {
                name: 'birth-date',
                label: 'วัน / เดือน / ปี เกิด',
                type: 'date',
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'phone',
                label: 'โทรศัพท์',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'email',
                label: 'อีเมล',
                type: 'email',
                placeholder: '',
              },
              {
                name: 'marital-status',
                label: 'สถานภาพ',
                type: 'select',
                required: true,
                placeholder: '',
                options: [
                  { label: 'โสด', value: 'single' },
                  { label: 'สมรส', value: 'married' },
                  { label: 'หย่า', value: 'divorced' },
                  { label: 'หม้าย', value: 'widowed' },
                ],
              },
            ],
          },
          {
            topic: 'ที่อยู่ตามทะเบียนบ้าน',
            content: [
              {
                name: 'province',
                label: 'จังหวัด',
                type: 'select',
                required: true,
                placeholder: '',
                options: [],
              },
              {
                name: 'postal-code',
                label: 'รหัสไปรษณีย์',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'district',
                label: 'อำเภอ/เขต',
                type: 'select',
                required: true,
                placeholder: '',
                options: [],
              },
              {
                name: 'sub-district',
                label: 'ตำบล/แขวง',
                type: 'select',
                required: true,
                placeholder: '',
                options: [],
              },
              {
                name: 'road',
                label: 'ถนน',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'alley',
                label: 'ตรอก/ซอย',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'village',
                label: 'หมู่บ้าน/อาคาร',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'moo',
                label: 'หมู่ที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'house-no',
                label: 'บ้านเลขที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'house-reg-no',
                label: 'รหัสทะเบียนบ้าน',
                type: 'text',
                placeholder: '',
              },
            ],
          },
        ],
      ]"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>

  <!-- ปุ่มบันทึก - อยู่ข้างล่างตลอด -->
  <div
    class="shrink-0 flex justify-end border-t border-gray-200 bg-white dark:bg-background rounded-b-xl p-3 mx-4 sm:mx-6"
  >
    <Button
      class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
    >
      บันทึก
    </Button>
  </div>
</template>
