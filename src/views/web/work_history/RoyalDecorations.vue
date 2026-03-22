<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const royalDecorationData = ref<Record<string, any>[]>([])
async function getRoyalDecorationData() {
  loading.value = true
  try {

    const response = await getDatasetRows( {
      view: 'decorations_get',
      page: 1,
      per_page: 50,
    })
    royalDecorationData.value =  response.data[0]?.decorations || [] 
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
  getRoyalDecorationData()
})

const isEditMode = true

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
      :isDropdown="false"
      :readonly="!isEditMode"
      :values="royalDecorationData"
      :fields="[
        [
          {
            content: [
              {
                name: 'gazette-date',
                label: 'วันที่ประกาศในราชกิจจา',
                type: 'date',
                required: true,
                isShow: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'year',
                label: 'ประจำปี',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'class-rank',
                label: 'ชั้นตรา',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'volume-no',
                label: 'เล่มที่',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'section-no',
                label: 'ตอนที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'dated',
                label: 'ลงวันที่',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'page',
                label: 'หน้า',
                type: 'text',
                required: true,
                placeholder: 'กรอกหน้า',
              },
              {
                name: 'important-no',
                label: 'ลำดับที่',
                type: 'text',
                required: true,
                placeholder: 'กรอกลำดับที่',
              },
              {
                name: 'announcement-file',
                label: 'แนบประกาศ',
                type: 'file',
                required: true,
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
