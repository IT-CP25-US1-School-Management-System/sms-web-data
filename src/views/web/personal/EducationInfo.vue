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
                name: 'education_level',
                label: 'ระดับการศึกษา',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกระดับการศึกษา',
                options: [],
              },
              {
                name: 'qualification',
                label: 'วุฒิการศึกษา',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'qualification_name',
                label: 'ชื่อวุฒิการศึกษา',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'major_group',
                label: 'สาขาวิชาเอก',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'minor_group',
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
                name: 'start_date',
                label: 'วันที่เข้าศึกษา',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'graduation_date',
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
                name: 'honor_type',
                label: 'เกียรตินิยม',
                type: 'select',
                required: true,
                placeholder: 'เลือกเกียรตินิยม',
                options: [],
              },
              {
                name: 'qualification-used',
                label: 'วุฒิที่ใช้บรรจุ /วุฒิการศึกษาสูงสุด',
                type: 'select',
                placeholder: '',
                options: [
                  { label: 'ใช้บรรจุครั้งแรก', value: 'is_used_for_first_appointment' },
                  { label: 'วุฒิการศึกษาสูงสุด', value: 'is_highest_degree' }, 
                  { label: 'วุฒิตรงตามมาตรฐานตำแหน่ง', value: 'is_meets_position_standard' }, 
                  { label: 'วุฒิ กคศ./คุรุสภา รับรอง', value: 'is_recognized_by_kksa' }, 
                  { label: 'วุฒิ ก.พ. รับรอง', value: 'is_recognized_by_ocsc' }, 
                ],
              },
            ],
          },
        ],
      ]"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>

</template>
