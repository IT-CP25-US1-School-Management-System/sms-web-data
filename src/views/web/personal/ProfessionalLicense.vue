<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { Button } from '@/components/ui/button'
import { getDatasetRows } from '@/stores/dataset'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const loading = ref(false)
const professionalLicenseData = ref<Record<string, any>[]>([])
async function getProfessionalLicenseData() {
  loading.value = true
  try {

    const response = await getDatasetRows({
      view: 'license_get',
      page: 1,
      per_page: 50,
    })
    professionalLicenseData.value =  response.data[0]?.professional_license || [] 
    console.log('Professional License API Response:', response)
    console.log('Professional License Data:', response.data)
    toast.success(`โหลดข้อมูลใบประกอบวิชาชีพสำเร็จ (${response.total_rows} รายการ)`, {
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
  console.log("professional license");
  getProfessionalLicenseData()
})


</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    แก้ไขได้เลย  -> ใช้ CreateForm เพราะมีการเพิ่มกลุ่มข้อมูลใหม่
    <CreateForm
      :values="professionalLicenseData"
      :fields="[
        [
          {
          content:[
              {
                name: 'license-type',
                label: 'ใบประกอบวิชาชีพ',
                type: 'select',
                required: true,
                placeholder: 'เลือกประเภทใบประกอบวิชาชีพ',
                options: [
                  { label: 'ใบอนุญาตปฏิบัติหน้าที่ครู (P-License)', value: 'P-License' },
                  { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นต้น (B-License)', value: 'B-License' },
                  { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นสูง (A-License)', value: 'A-License' },
                  { label: 'ใบอนุญาตสอน', value: 'ใบอนุญาตสอน' }
                ],
              },
              {
                name: 'license-number',
                label: 'เลขที่ใบประกอบวิชาชีพ',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'issue-date',
                label: 'วันเดือนปีที่ออกบัตร',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'expiry-date',
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
                multiple: true,
              },
           ]
          }
        ]
      ]"
    />
  </div>

</template>
