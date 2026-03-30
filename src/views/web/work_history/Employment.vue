<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { Button } from '@/components/ui/button'
import { DATASET_GET } from '@/lib/constants'

import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const employmentData = ref<Record<string, any>[]>([])
async function getEmploymentData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'employment_get',
      page: 1,
      per_page: 50,
    })
    employmentData.value =  response.data[0]?.employment_contracts || [] 
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
  console.log("Employment");
  getEmploymentData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div v-else class="flex flex-col gap-4 mx-6"
   v-for="item in employmentData" :key="item.id"
   >
    <!-- ข้อมูลการทำงาน -->
    แก้ไขไม่ได้
    <DropDownForm
      topic="ข้อมูลการทำงาน"
      :values="item"
      :fields="[
        {
          name: 'position',
          label: 'ตำแหน่ง',
          type: 'text',
          required: true,
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'work_status',
          label: 'สถานะการทำงาน',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,

        },
        {
          name: 'hiring_nature',
          label: 'ลักษณะการจ้าง',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'contract_action',
          label: 'ประเภทการเคลื่อนไหวล่าสุด',
          type: 'select',
          placeholder: '-',
          disabled: true,
          options: [
            { label: 'การต่อสัญญา', value: 'การต่อสัญญา' },
            { label: 'ทำสัญญาครั้งแรก', value: 'ทำสัญญาครั้งแรก' },
          ],
        },
      ]"
    />

    <!-- ข้อมูลค่าตอบแทนและสิทธิประโยชน์ -->
    <DropDownForm
      topic="ข้อมูลค่าตอบแทนและสิทธิประโยชน์"
      :fields="[
        {
          name: 'salary',
          label: 'เงินค่าจ้าง',
          type: 'number',
          required: true,
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'social_security',
          label: 'เงินสมทบกองทุนประกันสังคม',
          type: 'number',
          required: true,
          placeholder: '-',
          disabled: true,

        },
      ]"
    />

    <!-- ข้อมูลสัญญาจ้างและเอกสารจ้างจิง -->
    <DropDownForm
      topic="ข้อมูลสัญญาจ้างและเอกสารจ้างจิง"
      :fields="[
        {
          name: 'contract-order-no',
          label: 'เลขที่คำสั่ง / สัญญาจ้าง',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,

        },
        {
          name: 'contract-count',
          label: 'จำนวนครั้งที่ทำสัญญา',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,
        },
      ]"
    />

    <!-- ข้อมูลระยะเวลาในการจ้างงาน -->
    <DropDownForm
      topic="ข้อมูลระยะเวลาในการจ้างงาน"
      :fields="[
        {
          name: 'first_contract_start',
          label: 'ว/ด/ป เริ่มสัญญาครั้งแรก',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'total-work-years',
          label: 'จ้างมาแล้วกี่ปี (อายุงานรวม)',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,

        },
        {
          name: 'period_start',
          label: 'วันเดือนปีที่เริ่มสัญญาจ้าง (สัญญาปัจจุบัน)',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,

        },
        {
          name: 'period_end',
          label: 'วันเดือนปีสิ้นสุดสัญญาจ้าง',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,
        },
      ]"
    />

    <!-- ข้อมูลแหล่งงบประมาณที่ใช้จ้าง -->
    <DropDownForm
      topic="ข้อมูลแหล่งงบประมาณที่ใช้จ้าง"
      :fields="[
        {
          name: 'budget_type',
          label: 'ประเภทเงินงบประมาณ',
          type: 'select',
          required: true,
          placeholder: '-',
          disabled: true,
          options: [
            { label: 'เงินงบประมาณ', value: 'เงินงบประมาณ' },
            { label: 'เงินนอกงบประมาณ', value: 'เงินนอกงบประมาณ' },
            { label: 'เงินรายได้สถานศึกษา', value: 'เงินรายได้สถานศึกษา' },
            { label: 'เงินอุดหนุนค่าใช่จ่ายรายหัว', value: 'เงินอุดหนุนค่าใช่จ่ายรายหัว' },
          ],
        },
        {
          name: 'school_revenue_type',
          label: 'ประเภทเงินรายได้สถานศึกษา',
          type: 'select',
          required: true,
          placeholder: '-',
          disabled: true,
          options: [
            { label: 'ลูกจ้างชั่วคราว (มีประกันสังคม)', value: 'ลูกจ้างชั่วคราว (มีประกันสังคม)' },
            { label: 'เหมาบริการ (ไม่มีประกันสังคม)', value: 'เหมาบริการ(ไม่มีประกันสังคม)' },
            { label: 'เหมาบริการ (ประกันตนเอง)', value: 'เหมาบริการ (ประกันตนเอง)' },
          ],
        },
      ]"
    />
  </div>

</template>
