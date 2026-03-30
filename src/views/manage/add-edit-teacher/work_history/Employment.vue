<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import { DATASET_GET } from '@/lib/constants'
import { useTeacherStore } from '@/stores/teachers'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const route = useRoute()
const teacherStore = useTeacherStore()
const loading = ref(false)
const employmentData = ref<Record<string, any>[]>([])

function getPersonId() {
  const idFromUrl = route.query.id as string | undefined
  const personId = idFromUrl || teacherStore.personId

  if (idFromUrl && teacherStore.personId !== idFromUrl) {
    teacherStore.setPersonId(idFromUrl)
  }

  return personId
}

async function getEmploymentData() {
  loading.value = true
  try {
    const personId = getPersonId()
    if (!personId) {
      employmentData.value = []
      toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
        position: 'bottom-right',
      })
      return
    }

    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'employment_get',
      page: 1,
      per_page: 50,
      where: [[{
        table_name: 'employment_contracts',
        field: 'person_id',
        operator: '=',
        value: personId,
      }]],
    })
    employmentData.value = response.data[0]?.employment_contracts || []
    toast.success(`โหลดข้อมูลที่อยู่สำเร็จ (${response.total_rows} รายการ)`, {
      position: 'bottom-right',
    })
  } catch (error: any) {
    console.error('Employment API Error:', error)
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  }
  loading.value = false
}

onMounted(() => {
  const idFromUrl = route.query.id as string | undefined
  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }

  getEmploymentData()
})
</script>

<template>
  <div class="flex flex-col gap-4 mx-6"
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
          name: 'latest-transfer-type',
          label: 'ประเภทการเคลื่อนไหวล่าสุด',
          type: 'text',
          placeholder: '-',
          disabled: true,

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
          name: 'social-security-contribution',
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
          name: 'first-contract-date',
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
          name: 'current-contract-start',
          label: 'วันเดือนปีที่เริ่มสัญญาจ้าง (สัญญาปัจจุบัน)',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,

        },
        {
          name: 'contract-end-date',
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
          name: 'budget-type',
          label: 'ประเภทเงินงบประมาณ',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'school-income-type',
          label: 'ประเภทเงินรายได้สถานศึกษา',
          type: 'text',
          required: true,
          placeholder: '-',
          disabled: true,

        },
      ]"
    />
  </div>

</template>
