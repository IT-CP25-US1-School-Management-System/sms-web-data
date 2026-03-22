<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { getDatasetRows } from '@/stores/dataset'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const loading = ref(false)
const familyData = ref<Record<string, any>[]>([])
async function getFamilyData() {
  loading.value = true
  try {
    const response = await getDatasetRows({
      view: 'family_get',
      page: 1,
      per_page: 50,
    })
    familyData.value = response.data[0]?.family_members || []
    familyData.value = familyData.value.map((member) => ({
      ...member,
      is_alive: member.is_alive ? 'มีชีวิต' : 'ไม่มีชีวิต',
    }))
    console.log('Family API Response:', response)
    console.log('Family Data:', familyData.value)
    toast.success(`โหลดข้อมูลครอบครัวสำเร็จ (${response.total_rows} รายการ)`, {
      position: 'bottom-right',
    })
  } catch (error: any) {
    // console.error('Family API Error:', error)
    // console.error('Error Response:', error?.response?.data)
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  }
  loading.value = false
}

onMounted(() => {
  getFamilyData()
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
    แก้ไม่ได้ ยกเว้นที่ เบอร์โทร อีเมล , ที่อยู่ update ได้
    <CreateForm
      :isDropdown="true"
      :readonly="true"
      :values="familyData"
      :fields="[
        [
          {
            topic: 'ข้อมูลส่วนตัว',
            content: [
              {
                name: 'relation_type',
                label: 'ความสัมพันธ์',
                type: 'text',
                isShow: true,
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'prefix_id',
                label: 'คำนำหน้า',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'first_name_th',
                label: 'ชื่อ',
                type: 'text',
                isShow: true,
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'last_name_th',
                label: 'นามสกุล',
                type: 'text',
                isShow: true,
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'former_last_name_th',
                label: 'นามสกุลเดิม',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'middle_name_th',
                label: 'ชื่อกลาง',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'national_id',
                label: 'เลขบัตรประชาชน',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'gender',
                label: 'เพศ',
                type: 'text',
                disabled: true,
                placeholder: '-',
              },
              {
                name: 'is_alive',
                label: 'การมีชีวิต',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'birth_date',
                label: 'วัน / เดือน / ปี เกิด',
                type: 'date',
                placeholder: '-',
                disabled: true,
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
                name: 'marital_status',
                label: 'สถานภาพ',
                type: 'text',
                required: true,
                placeholder: '',
                disabled: true,
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
                name: 'district',
                label: 'อำเภอ/เขต',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'subdistrict',
                label: 'ตำบล/แขวง',
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
