<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { toast } from 'vue-sonner'
import { onMounted, ref } from 'vue'
import { getDatasetRows } from '@/stores/dataset'
import NormalForm from '@/components/form/NormalForm.vue'

// TODO: เปลี่ยนเป็น false เมื่อต้องการดูอย่างเดียว (readonly)
const isEditMode = true

const loading = ref(false)
const educationData = ref<Record<string, any>[]>([])
async function getEducationRecordData() {
  loading.value = true
  try {
  
    const response = await getDatasetRows( {
      view: 'education_get',
      page: 1,
      per_page: 50,
    })
  // API returns an array in `response.data` — assign the whole array.
  // Previously this used `response.data[0]` which is a single object and
  // caused a type/assignment mismatch with `educationData: Ref<Record<string, any>[]>`.
  educationData.value = response.data[0]?.education_records || []
    console.log('Education API Response:', response)
    console.log('Education Data:', educationData.value)
    toast.success(`โหลดข้อมูลการศึกษาสำเร็จ (${response.total_rows} รายการ)`, {
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
  console.log("education");
  getEducationRecordData()
})


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
  <div class="mx-6 flex flex-col gap-4"
  v-for="item in educationData" :key="item.id"
  >
    แก้ไขไม่ได้
    <NormalForm
      :isDropdown="false"
      :values="item"
      :readonly="!isEditMode"
      :fields="[
      
              {
                name: 'education_level',
                label: 'ระดับการศึกษา',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'qualification',
                label: 'วุฒิการศึกษา',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'qualification_name',
                label: 'ชื่อวุฒิการศึกษา',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'major_group',
                label: 'สาขาวิชาเอก',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'minor_group',
                label: 'สาขาวิชาโท',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'institution',
                label: 'สถานศึกษา',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'start_date',
                label: 'วันที่เข้าศึกษา',
                type: 'date',
                placeholder: '-',
              },
              {
                name: 'graduation_date',
                label: 'วันที่สำเร็จการศึกษา',
                type: 'date',
                placeholder: '-',
              },
              {
                name: 'country',
                label: 'ประเทศ',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'honor_type',
                label: 'เกียรตินิยม',
                type: 'text',
                placeholder: '-',
              },
              {
                name: 'qualification-used',
                label: 'วุฒิที่ใช้บรรจุ /วุฒิการศึกษาสูงสุด',
                type: 'text',
                placeholder: '-',
              }
]"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>
