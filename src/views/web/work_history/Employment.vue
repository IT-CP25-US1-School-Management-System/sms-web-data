<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { DATASET_GET } from '@/lib/constants'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const employmentData = ref<Record<string, any>[]>([])
const personalPosition = ref('')
const formRenderKey = ref(0)
const displayEmploymentData = computed(() =>
  employmentData.value.length
    ? employmentData.value
    : [
        {
          id: 'empty-employment',
          position: personalPosition.value,
        },
      ],
)

async function getEmploymentData() {
  loading.value = true
  try {
    const [employmentResponse, personalResponse] = await Promise.all([
      getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
        view: 'employment_get',
        page: 1,
        per_page: 50,
      }),
      getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
        view: 'personal_get',
        page: 1,
        per_page: 50,
      }),
    ])

    const positionName = personalResponse.data?.[0]?.roles?.roles_name || ''
    personalPosition.value = positionName
    console.log('Position from Personal API:', positionName)
    const records = employmentResponse.data?.[0]?.employment_contracts || []
    console.log('Employment API Response:', records)
    console.log('Personal API Response:', personalResponse.data)
    employmentData.value = records.map((record: Record<string, any>) => ({
      ...record,
      position: positionName || record.position || '',
    }))
    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Personal Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getEmploymentData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div
    v-else
    v-for="item in displayEmploymentData"
    :key="`${formRenderKey}-${item.id}`"
    class="mx-6 flex flex-col gap-4"
  >
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

    <DropDownForm
      topic="ข้อมูลค่าตอบแทนและสิทธิประโยชน์"
      :values="item"
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

    <DropDownForm
      topic="ข้อมูลสัญญาจ้างและเอกสารจ้างจริง"
      :values="item"
      :fields="[
        {
          name: 'order_no',
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

    <DropDownForm
      topic="ข้อมูลระยะเวลาในการจ้างงาน"
      :values="item"
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

    <DropDownForm
      topic="ข้อมูลแหล่งงบประมาณที่ใช้จ้าง"
      :values="item"
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
            { label: 'เงินอุดหนุนค่าใช้จ่ายรายหัว', value: 'เงินอุดหนุนค่าใช้จ่ายรายหัว' },
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
