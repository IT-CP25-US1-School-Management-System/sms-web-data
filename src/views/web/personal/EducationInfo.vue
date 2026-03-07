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
      :isDropdown="false"
      :readonly="!isEditMode"
      :fields="[
        [
          {
            content: [
              {
                name: 'education-level',
                label: 'ระดับการศึกษา',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกระดับการศึกษา',
                options: [],
              },
              {
                name: 'degree',
                label: 'วุฒิการศึกษา',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'degree-name',
                label: 'ชื่อวุฒิการศึกษา',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'major',
                label: 'สาขาวิชาเอก',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'minor',
                label: 'สาขาวิชาโท',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'institution',
                label: 'สถานศึกษา',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'enrollment-date',
                label: 'วันที่เข้าศึกษา',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'graduation-date',
                label: 'วันที่สำเร็จการศึกษา',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'country',
                label: 'ประเทศ',
                type: 'select',
                required: true,
                placeholder: '',
                options: [],
              },
              {
                name: 'honors',
                label: 'เกียรตินิยม',
                type: 'select',
                required: true,
                placeholder: 'เลือกเกียรตินิยม',
                options: [],
              },
              {
                name: 'qualification-used',
                label: 'วุฒิที่ใช้บรรจุ /วุฒิการศึกษาสูงสุด',
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
