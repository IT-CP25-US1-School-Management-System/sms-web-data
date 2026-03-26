<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'

import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const trainningData = ref<Record<string, any>[]>([])

// Map API data: { start_date, end_date } => { start_date_end_date }
function mapApiToForm(data: any) {
  if (data.start_date && data.end_date) {
    return {
      ...data,
      start_date_end_date: `${data.start_date}~${data.end_date}`,
    }
  }
  return data
}

// Map form data: { start_date_end_date } => { start_date, end_date }
// NOTE: เก็บโค้ดตัวอย่างไว้ในคอมเมนต์ เผื่อใช้ในอนาคต
// function mapFormToApi(data: any) {
//   if (data.start_date_end_date) {
//     const [start, end] = data.start_date_end_date.split('~')
//     return {
//       ...data,
//       start_date: start,
//       end_date: end,
//     }
//   }
//   return data
// }

// async function getTrainingData() {
//   const response = await getDatasetRows({
//     view: 'training_get',
//     page: 1,
//     per_page: 50,
//   })
//   // Map all rows for form usage
//   trainningData.value = (response.data[0]?.trainings || []).map(mapApiToForm)
// }

onMounted(() => {
  // MOCK DATA สำหรับทดสอบ date-range
  trainningData.value = [
    {
      'work-type': 'อบรม',
      course_title: 'Vue 3 Workshop',
      start_date: '2026-03-10',
      end_date: '2026-03-19',
      hours: '18',
      academic_year: '2568',
      organizer: 'สมาคมโปรแกรมเมอร์',
      location: 'กรุงเทพ',
      outcomes: 'ความรู้ Vue 3',
      'photo-file': [],
      'certificate-file': [],
    },
  ].map(mapApiToForm)
  // getTrainingData() // ปิดไว้ชั่วคราว
})

function handleSave(groupIndex: number) {
  toast(`บันทึกข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}

function handleDelete(groupIndex: number) {
  toast(`ลบข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    ไม่ต้องแก้อะไร ถูกแล้ว
    <CreateForm
      :isDropdown="false"
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
                name: 'course_title',
                label: 'หลักสูตร/เรื่อง/หัวข้อ',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'start_date',
                label: 'วันเริ่มต้น',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'end_date',
                label: 'วันสิ้นสุด',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'hours',
                label: 'จำนวนชั่วโมง',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'academic_year',
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
                name: 'outcomes',
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
      :values="trainningData"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
  <!-- ปุ่มบันทึก - อยู่ข้างล่างตลอด -->
</template>
