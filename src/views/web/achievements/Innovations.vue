<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const innovationData = ref<Record<string, any>[]>([])
async function getInnovationData() {
  loading.value = true
  try {
 
    const response = await getDatasetRows( {
      view: 'innovations_get',
      page: 1,
      per_page: 50,
    })
    innovationData.value =  response.data[0]?.innovations || [] 
    console.log('Address API Response:', response)
    console.log('Address Data:', response.data)
    toast.success(`โหลดข้อมูลที่อยู่สำเร็จ (${response.total_rows} รายการ)`, {
      position: 'bottom-right',
    })
  } catch (error: any) {
    console.error('Personal Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } 
  loading.value = false
}

onMounted(() => {
  console.log("PositionHistory");
  getInnovationData()
})

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
    ไม่ต้องแก้อะไร ถูกแล้ว
    <CreateForm
      :isDropdown="true"
      :readonly="!isEditMode"
      :values="innovationData"
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
