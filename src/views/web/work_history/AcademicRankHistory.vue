<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { DATASET_GET } from '@/lib/constants'

const isEditMode = true
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const acadamicHistoryData = ref<Record<string, any>[]>([])
async function getAcadamicHistoryData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'academic_get',
      page: 1,
      per_page: 50,
    })
    acadamicHistoryData.value =  response.data[0]?.academic_rank || [] 
    console.log('Academic API Response:', response)
    console.log('Academic Data:', response.data)
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
  console.log("AcadamicHistory");
  getAcadamicHistoryData()
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
    แก้ไขได้เลย
    <CreateForm
      :isDropdown="true"
      :readonly="!isEditMode"
      :values="acadamicHistoryData"
      :fields="[
        [
          {
            topic: 'ประวัติการมีวิทยฐานะ',
            content: [
              {
                name: 'order-no',
                label: 'คำสั่ง',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'position_rank',
                label: 'ตำแหน่งที่ได้รับวิทยฐานะ',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกตำแหน่ง',
                options: [{
                  label: 'ครู',
                  value: 'ครู',
                }, {
                  label: 'ผู้บริหาร',
                  value: 'ผู้บริหาร',
                }],
              },
              {
                name: 'academic-rank',
                label: 'วิทยฐานะ',
                type: 'select',
                required: true,
                placeholder: 'เลือกวิทยฐานะ',
                options: [
                  {
                    label: 'ครูชำนาญการ',
                    value: 'ครูชำนาญการ',
                  }, 
                  {
                    label: 'ครูชำนาญการพิเศษ',
                    value: 'ครูชำนาญการพิเศษ',
                  }, 
                  {
                    label: 'ครูเชี่ยวชาญ',
                    value: 'ครูเชี่ยวชาญ',
                  }, 
                  {
                    label: 'ครูเชี่ยวชาญพิเศษ',
                    value: 'ครูเชี่ยวชาญพิเศษ',
                  },
                   {
                    label: 'รองผู้อำนวยชำนาญการพิเศษ',
                    value: 'รองผู้อำนวยชำนาญการพิเศษ',
                  },
                  {
                    label: 'รองผู้อำนวยเชี่ยวชาญ',
                    value: 'รองผู้อำนวยเชี่ยวชาญ',
                  },
                  {
                    label: 'ผู้อำนวยชำนาญการ',
                    value: 'ผู้อำนวยชำนาญการ',
                  },
                  {
                    label: 'ผู้อำนวยชำนาญการพิเศษ',
                    value: 'ผู้อำนวยชำนาญการพิเศษ',
                  },
                  {
                    label: 'ผู้อำนวยเชี่ยวชาญ',
                    value: 'ผู้อำนวยเชี่ยวชาญ',
                  },
               ],
              },
              {
                name: 'awarded_date',
                label: 'วันที่ได้รับวิทยฐานะ',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'order-file',
                label: 'แนบคำสั่ง',
                type: 'file',
                accept: '.pdf,.jpg,.png',
                multiple: true,
              },
            ],
          },
          {
            topic: 'เงินเดือน',
            content: [
              {
                name: 'reward',
                label: 'เงินค่าตอบแทน',
                type: 'number',
                required: true,
                placeholder: '',
              },
              {
                name: 'special_reward',
                label: 'เงินค่าตอบแทนพิเศษรายเดือนรับ',
                type: 'number',
                required: true,
                placeholder: '',
              },
              {
                name: 'position_reward',
                label: 'เงินประจำตำแหน่ง',
                type: 'number',
                required: true,
                placeholder: '',
              },
              {
                name: 'special-compensation',
                label: 'เงินค่าตอบแทนพิเศษ',
                type: 'number',
                required: true,
                placeholder: '',
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
