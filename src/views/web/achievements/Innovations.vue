<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
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
  <div class="mx-6 flex flex-col gap-4">
    <CreateForm
      :isDropdown="true"
      :readonly="!isEditMode"
      :fields="[
        [
          {
            topic: 'ข้อมูลพื้นฐาน',
            content: [
              {
                name: 'academic-year',
                label: 'ปีการศึกษา',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'course-title',
                label: 'หลักสูตร / เรื่อง / หัวข้อ',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'date-range',
                label: 'ระหว่างวันที่',
                type: 'date-range',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
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
                placeholder: '',
              },
            ],
          },
          {
            topic: 'ข้อมูลผลงาน',
            content: [
              {
                name: 'award',
                label: 'รางวัล',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'achievement-level',
                label: 'ผลงานระดับ',
                type: 'text',
                required: true,
                placeholder: '',
              },
            ],
          },
          {
            topic: 'ข้อมูลนักเรียนผู้เข้าร่วม',
            content: [],
            subFields: [
              {
                name: 'student-name',
                label: 'ชื่อนักเรียน',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'class-level',
                label: 'ชั้น',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'room',
                label: 'ห้อง',
                type: 'text',
                required: true,
                placeholder: '',
              },
            ],
          },
          {
            topic: 'ข้อมูลผู้ครูที่ดูแล',
            content: [
              {
                name: 'teacher-name',
                label: 'ครูผู้ดูแล',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'learning-group',
                label: 'กลุ่มสาระการเรียนรู้',
                type: 'text',
                required: true,
                placeholder: '',
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
</template>
