<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { getDatasetRows } from '@/stores/dataset'
import { onMounted, ref } from 'vue'
import type { v } from 'vue-router/dist/router-CWoNjPRp.mjs'
import { toast } from 'vue-sonner'

const isNotError = ref(true)
const loading = ref(false)

const personalData = ref<Record<string, any>>({})
// refs to DropDownForm components so we can trigger validation from the parent save button
const generalForm = ref<any>(null)
const sensitiveForm = ref<any>(null)
const contactForm = ref<any>(null)
async function getPersonalDetailData() {
  loading.value = true
  try {

    const response = await getDatasetRows( {
      view: 'personal_get',
      page: 1,
      per_page: 50,
    })
    personalData.value = response.data[0] || {}
    console.log('Personal Detail API Response:', response)
    console.log('Personal Detail Data:', response.data)
    console.log('Personal Detail Data:', personalData.value.prefixes.prefixes_name_th)
    personalData.value.birth_date = personalData.value.birth_date ? personalData.value.birth_date.split('T')[0] : ''
    personalData.value.prefix_id = response.data[0]?.prefixes?.prefixes_name_th || ''
    personalData.value.prefix_en = response.data[0]?.prefixes?.prefixes_name_en || ''
    isNotError.value = true
  
  } catch (error: any) {
    console.error('Personal Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    isNotError.value = false
    toast.error(`โหลดข้อมูลส่วนตัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } 
  loading.value = false
}

onMounted(() => {
  console.log("family");
  getPersonalDetailData()
})

function updatePersonalDetailData() {
  // Implementation for updating personal detail data
}

async function onSaveAll() {
  // trigger submit on all child forms; they expose submitForm()
  const forms = [generalForm, sensitiveForm, contactForm]
  for (const fRef of forms) {
    try {
      if (fRef.value && typeof fRef.value.submitForm === 'function') {
        await fRef.value.submitForm()
      }
    } catch (err) {
      console.error('Error submitting form', err)
    }
  }
}

</script>

<template>
  <div class="flex flex-col gap-4 mx-6" v-if="isNotError">
    <!-- ข้อมูลทั่วไป -->
    <DropDownForm
      topic="ข้อมูลทั่วไป  แก้ไม่ได้  ยกเว้นช่องทางการติดต่อ update ไดเ"
      :values="personalData"
      ref="generalForm"
      :fields="[
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
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'middle_name_th',
          label: 'ชื่อกลาง',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'last_name_th',
          label: 'นามสกุล',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'prefix_en',
          label: 'Prefix',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'middle_name_en',
          label: 'Middlename',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'first_name_en',
          label: 'Name',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'last_name_en',
          label: 'Lastname',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'birth_date',
          label: 'วัน / เดือน / ปี เกิด',
          type: 'date',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'age',
          label: 'อายุ (ปี)',
          type: 'number',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'marital_status',
          label: 'สถานภาพการแต่งงาน',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'spouse_name',
          label: 'คู่สมรส',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'national_id',
          label: 'เลขบัตรประจำตัวประชาชน',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },

      ]"
    />

    <!-- ข้อมูล Sensitive -->
    <DropDownForm
      ref="sensitiveForm"
      topic="ข้อมูล Sensitive"
      :values="personalData"
      :fields="[
        {
          name: 'gender',
          label: 'เพศ',
          type: 'text',
          disabled: true,
          placeholder: '-',
         
        },
        {
          name: 'religion',
          label: 'ศาสนา',
          type: 'text',
          disabled: true,
          placeholder: '-',
         
        },
        {
          name: 'nationality',
          label: 'สัญชาติ',
          type: 'text',
          disabled: true,
          placeholder: '-',
         
        },
        {
          name: 'ethnicity',
          label: 'เชื้อชาติ',
          type: 'text',
          disabled: true,
          placeholder: '-',
        
        },
        {
          name: 'blood_type',
          label: 'หมู่เลือด',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'physical_status',
          label: 'สถานภาพทางร่างกาย',
          type: 'text',
          disabled: true,
          placeholder: '-',
         
        },
      ]"
    />

    <!-- ช่องทางการติดต่อ -->
    <DropDownForm
      ref="contactForm"
      topic="ช่องทางการติดต่อ"
      :values="personalData"
      :fields="[
        {
          name: 'phone',
          label: 'เบอร์โทรศัพท์',
          type: 'text',
          required: true,
          disabled: false,
          placeholder: 'กรุณาระบุเบอร์โทรศัพท์',
        },
        {
          name: 'personal_email',
          label: 'E-mail',
          type: 'email',
          required: true,
          disabled: false,
          placeholder: 'กรุณาระบุอีเมล',
        },
        {
          name: 'line-id',
          label: 'Line ID',
          type: 'text',
          required: true,
          disabled: false,
          placeholder: 'กรุณาระบุ Line ID',
        },
      ]"
    />
  </div>
 
  <div class="flex flex-col gap-4 mx-6" v-else>
    เกิดข้อผิดพลาดในการโหลดข้อมูลส่วนตัว กรุณาลองใหม่อีกครั้งภายหลัง
  </div>  
   <!-- ปุ่มบันทึก -->
    <div
      v-if="isNotError"
      class="sticky bottom-0 right-0 z-40 flex justify-end border-t border-gray-200 bg-white p-3 w-full dark:bg-black dark:border-neutral-700"
    >
      <Button
        class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
        @click="onSaveAll"
      >
        บันทึก
      </Button>
    </div>
</template>
