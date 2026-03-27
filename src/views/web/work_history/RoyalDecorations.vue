<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { DATASET_GET } from '@/lib/constants'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const royalDecorationData = ref<Record<string, any>[]>([])
async function getRoyalDecorationData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'decorations_get',
      page: 1,
      per_page: 50,
    })
    royalDecorationData.value =  response.data[0]?.decorations || [] 
    royalDecorationData.value = royalDecorationData.value.map((item) => ({
      ...item,
      year: item.year.toString() || '',
    }))
    console.log('royalDecorationData API Response:', response)
    console.log('royalDecorationData Data:', response.data)

  } catch (error: any) {
    console.error('royalDecorationData API Error:', error)
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

function handleSave(groupIndex: number, values?: Record<string, any>) {
  // previous value at that index (if any)
  const previous = royalDecorationData.value[groupIndex]

  // Determine if this is a new entry (no previous data at index)
  const isNew = previous == null

  // Log both previous and new values for debugging
  console.log('CreateForm save emitted:', {
    groupIndex,
    isNew,
    previous: previous ?? null,
    values: values ?? null,
  })

  // Optionally update local state to reflect the saved values (keeps UI in sync)
  if (values) {
    // if updating existing entry
    if (!isNew) royalDecorationData.value[groupIndex] = { ...previous, ...values }
    else royalDecorationData.value.push({ ...(values || {}) })
  }

  toast(`บันทึกข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}

function handleDelete(groupIndex: number) {
  // Log the delete event and show previous value for debugging
  const previous = royalDecorationData.value[groupIndex]
  console.log('CreateForm delete emitted:', { groupIndex, previous: previous ?? null })

  // Update local state so the UI reflects the deletion immediately
  if (previous != null) {
    royalDecorationData.value.splice(groupIndex, 1)
    console.log('royalDecorationData after delete:', royalDecorationData.value)
  } else {
    console.log('handleDelete: no item found at index', groupIndex)
  }

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
                name: 'gazette_publish_date',
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
                name: 'class',
                label: 'ชั้นตรา',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'gazette_book_no',
                label: 'เล่มที่',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'gazette_section',
                label: 'ตอนที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'announce_date',
                label: 'ลงวันที่',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'gazette_page',
                label: 'หน้า',
                type: 'text',
                required: true,
                placeholder: 'กรอกหน้า',
              },
              {
                name: 'gazette_order_no',
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
