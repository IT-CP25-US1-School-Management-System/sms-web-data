<script setup lang="ts">
import { toast } from 'vue-sonner'
import { onMounted, ref } from 'vue'
import NormalForm from '@/components/form/NormalForm.vue'
import { DATASET_ID, DATASET_VERSION, getDatasetRows } from '@/stores/dataset'

// TODO: เปลี่ยนเป็น false เมื่อต้องการดูอย่างเดียว (readonly)
const isEditMode = true

const loading = ref(false)
const educationData = ref<Record<string, any>[]>([])

async function getEducationRecordData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_ID, DATASET_VERSION, {
      view: 'education_get',
      page: 1,
      per_page: 50,
    })
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
  console.log('education')
  getEducationRecordData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4" v-for="item in (educationData.length ? educationData : [{}])" :key="item.id">
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
        },
      ]"
    />
  </div>
</template>
