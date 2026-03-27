<script setup lang="ts">
import { Button } from '@/components/ui/button'
import CreateForm from '@/components/form/CreateForm.vue'
import { DATASET_GET } from '@/lib/constants'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const contractPositionData = ref<Record<string, any>[]>([])
async function getContractPositionData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'contract_get',
      page: 1,
      per_page: 50,
    })
    contractPositionData.value =  response.data[0]?.person_addresses || [] 
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
  console.log("ContractPosition");
  getContractPositionData()
})
// Mock data — readonly
const mockData = [
  {
    date: '2568-01-15',
    position: 'ครูผู้ช่วย',
    salary: '15,050',
    contract_number: 'คส.001/2568',
    file_name: 'สัญญาจ้าง_2568.pdf',
  },
  {
    date: '2567-05-01',
    position: 'ครูอัตราจ้าง',
    salary: '12,000',
    contract_number: 'คส.045/2567',
    file_name: 'สัญญาจ้าง_2567.pdf',
  },
]


</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    แก้ไขได้เลย  ทำเป็น CreateForm
    <div>
      <CreateForm
        :values="mockData"
        :fields="
        [
         [
          {
            content:[
              {
                name: 'date',
                label: 'วันเดือนปี',
                type: 'date',
                required: true,
                placeholder: '',
                disabled: false,
              },
              {
                name: 'position',
                label: 'ตำแหน่ง',
                type: 'text',
                required: true,
                placeholder: '',
                disabled: false,
              },
              {
                name: 'salary',
                label: 'เงินเดือน',
                type: 'number',
                required: true,
                placeholder: '',
                disabled: false,
              },
              {
                name: 'contract_number',
                label: 'เลขที่คำสั่ง/สัญญาจ้าง',
                type: 'text',
                required: true,
                placeholder: '',
                disabled: false,
              },
              {
                name: 'file',
                label: 'ดาวน์โหลดไฟล์',
                type: 'file',
                accept: '.pdf,.jpg,.png',
                multiple: true,
              },
            ]
           }
         ]
        ]
          "
       
      />
      <!-- <div class="mt-2 flex items-center gap-2">
        <Button type="button" class="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
          ดาวน์โหลดไฟล์
        </Button>
  <span class="text-sm text-muted-foreground">{{ item.file_name }}</span>
      </div> -->

    </div>
  </div>
      <div
      class="sticky bottom-0 right-0 z-40 flex justify-end border-t border-gray-200 bg-white p-3 w-full"
    >
      <Button
        class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
      >
        บันทึก
      </Button>
    </div>
</template>
