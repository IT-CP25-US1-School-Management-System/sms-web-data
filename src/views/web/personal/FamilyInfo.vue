<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

// TODO: เปลี่ยนเป็น false เมื่อต้องการดูอย่างเดียว (readonly)
const isEditMode = true
const familyData = ref<Record<string, any>[]>([])

/*async function fetchFamilyData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_ID, DATASET_VERSION, {
      view: 'personal_view',
      page: 1,
      per_page: 50,
    })
    familyData.value = response.data[0]?.family_members || []
    console.log('📦 Family API Response:', response)
    console.log('📋 Family Data:', response.data)
    toast.success(`โหลดข้อมูลครอบครัวสำเร็จ (${response.total_rows} รายการ)`, {
      position: 'bottom-right',
    })
  } catch (error: any) {
    console.error('❌ Family API Error:', error)
    console.error('❌ Error Response:', error?.response?.data)
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } finally {
    loading.value = false
  }
}*/

onMounted(() => {
  console.log('family')
  // fetchFamilyData()
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
  <div class="mx-6 flex flex-col gap-4">
    <CreateForm
      :isDropdown="true"
      :readonly="!isEditMode"
      :values="familyData"
      :fields="[
        [
          {
            topic: 'ข้อมูลส่วนตัว',
            content: [
              {
                name: 'relation_type',
                label: 'ความสัมพันธ์',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกความสัมพันธ์',
                options: [
                  { label: 'บิดา', value: 'father' },
                  { label: 'มารดา', value: 'mother' },
                  { label: 'คู่สมรส', value: 'spouse' },
                  { label: 'บุตร', value: 'child' },
                  { label: 'อื่นๆ', value: 'other' },
                ],
              },
              {
                name: 'prefix_id',
                label: 'คำนำหน้า',
                type: 'select',
                required: true,
                placeholder: '',
                options: [
                  { label: 'นาย', value: 'mr' },
                  { label: 'นาง', value: 'mrs' },
                  { label: 'นางสาว', value: 'miss' },
                ],
              },
              {
                name: 'first_name_th',
                label: 'ชื่อ',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'last_name_th',
                label: 'นามสกุล',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'former_last_name_th',
                label: 'นามสกุลเดิม',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'middle_name_th',
                label: 'ชื่อกลาง',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'national_id',
                label: 'เลขบัตรประชาชน',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'gender',
                label: 'เพศ',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'is_alive',
                label: 'การมีชีวิต',
                type: 'select',
                required: true,
                placeholder: '',
                options: [
                  { label: 'มีชีวิต', value: true },
                  { label: 'เสียชีวิต', value: false },
                ],
              },
              {
                name: 'birth_date',
                label: 'วัน / เดือน / ปี เกิด',
                type: 'date',
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'phone',
                label: 'โทรศัพท์',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'email',
                label: 'อีเมล',
                type: 'email',
                placeholder: '',
              },
              {
                name: 'marital-status',
                label: 'สถานภาพ',
                type: 'select',
                required: true,
                placeholder: '',
                options: [
                  { label: 'โสด', value: 'single' },
                  { label: 'สมรส', value: 'married' },
                  { label: 'หย่า', value: 'divorced' },
                  { label: 'หม้าย', value: 'widowed' },
                ],
              },
            ],
          },
          {
            topic: 'ที่อยู่ตามทะเบียนบ้าน',
            content: [
              {
                name: 'province',
                label: 'จังหวัด',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'postal_code',
                label: 'รหัสไปรษณีย์',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'district',
                label: 'อำเภอ/เขต',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'subdistrict',
                label: 'ตำบล/แขวง',
                type: 'select',
                required: true,
                placeholder: '',
                options: [],
              },
              {
                name: 'road',
                label: 'ถนน',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'soi',
                label: 'ตรอก/ซอย',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'building',
                label: 'หมู่บ้าน/อาคาร',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'moo',
                label: 'หมู่ที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'house_no',
                label: 'บ้านเลขที่',
                type: 'text',
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
