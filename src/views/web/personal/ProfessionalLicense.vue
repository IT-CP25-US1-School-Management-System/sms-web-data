<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { DATASET_GET } from '@/lib/constants'
import { getDatasetRows } from '@/stores/dataset'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const loading = ref(false)
const professionalLicenseData = ref<Record<string, any>[]>([])
async function getProfessionalLicenseData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'license_get',
      page: 1,
      per_page: 50,
    })
    professionalLicenseData.value = response.data[0]?.professional_licenses || []
    console.log('Professional License API Response:', response)
    console.log('Professional License Data:', response.data)
  } catch (error: any) {
    console.error('Personal Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  }
  loading.value = false
}

// async function updateProfessionalLicenseData() {
//   loading.value = true
//   const datasetId = 'data_update_view'
//   const version = 'v1.3.0'

//   try {
//     const response = await updateDatasetRow(
//        // assuming the API identifies the record to update by an 'id' field
//       datasetId, 
//       version,
//       personalData.value.id,
//       personalDataUpdate.value, 
//     )
//     // personalData.value = response.data[0] || {}
//     console.log('Personal Detail API Response:', response)
//     console.log('Personal Detail Data:', response.data)
//       toast.success(`อัพเดตข้อมูลส่วนตัวสำเร็จ`, {
//         position: 'bottom-right',
//       })
//   } catch (error: any) {
//     console.error('Personal Detail API Error:', error)
//     console.error('Error Response:', error?.response?.data)
//     toast.error(`อัพเดตข้อมูลส่วนตัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
//       position: 'bottom-right',
//     })
//   } 
//   loading.value = false
// }

onMounted(() => {
  console.log('professional license')
  getProfessionalLicenseData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    แก้ไขได้เลย -> ใช้ CreateForm เพราะมีการเพิ่มกลุ่มข้อมูลใหม่
    <CreateForm
      :values="professionalLicenseData"
      :fields="[
        [
          {
            content: [
              {
                name: 'license_type',
                label: 'ใบประกอบวิชาชีพ',
                type: 'select',
                required: true,
                placeholder: 'เลือกประเภทใบประกอบวิชาชีพ',
                options: [
                  { label: 'ใบอนุญาตปฏิบัติหน้าที่ครู (P-License)', value: 'P-License' },
                  { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นต้น (B-License)', value: 'B-License' },
                  { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นสูง (A-License)', value: 'A-License' },
                  { label: 'ใบอนุญาตสอน', value: 'ใบอนุญาตสอน' },
                ],
              },
              {
                name: 'license_no',
                label: 'เลขที่ใบประกอบวิชาชีพ',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'issue_date',
                label: 'วันเดือนปีที่ออกบัตร',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'expiry_date',
                label: 'วันเดือนปีบัตรหมดอายุ',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'license-file',
                label: 'แนบใบประกอบวิชาชีพ',
                type: 'file',
                accept: '.pdf,.jpg,.png',
                required: true,
                multiple: true,
              },
            ],
          },
        ],
      ]"
    />
  </div>
</template>
