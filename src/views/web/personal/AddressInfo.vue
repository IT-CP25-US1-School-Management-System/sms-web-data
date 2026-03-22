<script setup lang="ts">
import NormalForm from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'
import { listAddressRow } from '@/stores/address'
const isaddressOneType = ref(false)
const isaddressTwoTypes = ref(false)
const isaddressThreeTypes = ref(false)

const loading = ref(false)
const addresslData = ref<Record<string, any>[]>([])
const listAddress = ref<Record<string, any>[]>([])
async function getAddressData() {
  loading.value = true
  try {
    const response = await getDatasetRows( {
      view: 'address_get',
      page: 1,
      per_page: 50,
    })
    addresslData.value =  response.data[0]?.person_addresses || [] 
    console.log('Address API Response:', response)
    console.log('Address Data:',   addresslData.value)
     addresslData.value.forEach((item) => {
      if (item.is_house_registered) {
        isaddressOneType.value = true
      }
      if (item.is_current) {
        isaddressTwoTypes.value = true
      }
      if (item.is_retired_residence) {
        isaddressThreeTypes.value = true
      }
    })
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

// async function listAddressSelect() {
//   loading.value = true
//   try {
   
//     const response = await listAddressRow()
//     listAddress.value =  response.data[0] || []
//     console.log('listAddressSelect:', response)
//     console.log('listAddressSelect data:', response.data)
  
//   } catch (error: any) {
//     console.error('listAddressSelect:', error)
//     console.error('listAddressSelect:', error?.response?.data)
//     toast.error(`โหลดข้อมูลที่อยู่ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
//       position: 'bottom-right',
//     })
//   } 
//   loading.value = false
// }

onMounted(() => {
  console.log("address");
  getAddressData()
 // listAddressSelect()
})

</script>

<template>
  แก้ไขได้เลย
  <div class="flex flex-col">
    <!-- Checkboxes ประเภทที่อยู่ -->
      <div class="flex flex-wrap gap-4 pb-2 mb-2 pl-2 ml-4">
       
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="isaddressOneType"
              value="is_house_registered"
              class="rounded border-gray-300"
            />
            <span class="text-sm">ที่อยู่ตามทะเบียนบ้าน</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="isaddressTwoTypes"
              value="is_current"
              class="rounded border-gray-300"
            />
            <span class="text-sm">ที่อยู่ปัจจุบัน</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="isaddressThreeTypes"
              value="is_retired_residence"
              class="rounded border-gray-300"
            />
            <span class="text-sm">ที่อยู่หลังเกษียณอายุราชการ</span>
          </label>
      </div>
    <!-- Scrollable content area -->
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4" 
    v-for="item in addresslData" :key="item.id"
    >
      
      <!-- ข้อมูลที่อยู่ -->
      <NormalForm
        :values="item"
        :fields="[
          {
            name: 'province',
            label: 'จังหวัด',
            type: 'select',
            required: true,
            placeholder: 'เลือกจังหวัด',
            options: [
              { label: 'กรุงเทพมหานคร', value: 'bangkok' },
              { label: 'เชียงใหม่', value: 'chiangmai' },
              { label: 'ขอนแก่น', value: 'khonkaen' },
            ],
          },
          {
            name: 'postal_code',
            label: 'รหัสไปรษณีย์',
            type: 'text',
            required: true,
            placeholder: 'กรุณาระบุรหัสไปรษณีย์',
          },
          {
            name: 'district',
            label: 'อำเภอ/เขต',
            type: 'select',
            required: true,
            placeholder: 'เลือกอำเภอ/เขต',
            options: [],
          },
          {
            name: 'subdistrict',
            label: 'ตำบล/แขวง',
            type: 'select',
            required: true,
            placeholder: 'เลือกตำบล/แขวง',
            options: [],
          },
          {
            name: 'road',
            label: 'ถนน',
            type: 'text',
            placeholder: 'กรุณาระบุถนน',
          },
          {
            name: 'soi',
            label: 'ตรอก/ซอย',
            type: 'text',
            placeholder: 'กรุณาระบุตรอก/ซอย',
          },
          {
            name: 'building',
            label: 'หมู่บ้าน/อาคาร',
            type: 'text',
            placeholder: 'กรุณาระบุหมู่บ้าน/อาคาร',
          },
          {
            name: 'moo',
            label: 'หมู่ที่',
            type: 'text',
            placeholder: 'กรุณาระบุหมู่ที่',
          },
          {
            name: 'house_no',
            label: 'บ้านเลขที่',
            type: 'text',
            placeholder: 'กรุณาระบุบ้านเลขที่',
          },
          {
            name: 'house_registry_no',
            label: 'รหัสทะเบียนบ้าน',
            type: 'text',
            placeholder: 'กรุณาระบุรหัสทะเบียนบ้าน',
          },
        ]"
      />
    </div>

    <!-- ปุ่มบันทึก - อยู่ข้างล่างตลอด -->
      <div
      class="sticky bottom-0 right-0 z-40 flex justify-end border-t border-gray-200 bg-white p-3 w-full dark:bg-black dark:border-neutral-700"
    >
      <Button
        class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
      >
        บันทึก
      </Button>
    </div>
  </div>
</template>
