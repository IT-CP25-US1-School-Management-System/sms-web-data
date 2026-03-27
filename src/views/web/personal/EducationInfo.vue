<script setup lang="ts">
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
    const response = await getDatasetRows({
      view: 'education_get',
      page: 1,
      per_page: 50,
    })
    // API returns an array in `response.data` — assign the whole array.
    // Previously this used `response.data[0]` which is a single object and
    // caused a type/assignment mismatch with `educationData: Ref<Record<string, any>[]>`.
    educationData.value = response.data[0]?.education_records || []

   
  } catch (error: any) {
  
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
          disabled: true,
        },
        {
          name: 'qualification',
          label: 'วุฒิการศึกษา',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'qualification_name',
          label: 'ชื่อวุฒิการศึกษา',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'major_group',
          label: 'สาขาวิชาเอก',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'minor_group',
          label: 'สาขาวิชาโท',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'institution',
          label: 'สถานศึกษา',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'start_date',
          label: 'วันที่เข้าศึกษา',
          type: 'date',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'graduation_date',
          label: 'วันที่สำเร็จการศึกษา',
          type: 'date',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'country',
          label: 'ประเทศ',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'honor_type',
          label: 'เกียรตินิยม',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'qualification-used',
          label: 'วุฒิที่ใช้บรรจุ /วุฒิการศึกษาสูงสุด',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
      ]"
    />
  </div>
</template>
