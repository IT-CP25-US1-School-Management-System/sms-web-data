<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { toast } from 'vue-sonner'

const isEditMode = true

function handleSave(groupIndex: number) {
  toast(`บันทึกข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}

function handleDelete(groupIndex: number) {
  toast(`ลบข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    <CreateForm
      :isDropdown="false"
      :readonly="!isEditMode"
      :fields="[
        [
          {
            content: [
              {
                name: 'work-type',
                label: 'เลือกประเภทผลงาน',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกประเภทผลงาน',
                options: [],
              },
              {
                name: 'course-title',
                label: 'หลักสูตร/เรื่อง/หัวข้อ',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'date-range',
                label: 'ระหว่างวันที่',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป – วว / ดด / ปปปป',
              },
              {
                name: 'hours',
                label: 'จำนวนชั่วโมง',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'academic-year',
                label: 'ปีการศึกษา',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'organizer',
                label: 'หน่วยงานที่จัด',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'location',
                label: 'สถานที่จัด',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'training-outcome',
                label: 'สิ่งที่ได้รับจากการอบรม',
                type: 'textarea',
                required: true,
                placeholder: 'Value',
              },
              {
                name: 'photo-file',
                label: 'แนบภาพ',
                type: 'file',
                accept: '.jpg,.jpeg,.png',
                multiple: true,
              },
              {
                name: 'certificate-file',
                label: 'แนบเกียรติบัตร',
                type: 'file',
                accept: '.pdf,.jpg,.png',
                multiple: true,
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
</template>
