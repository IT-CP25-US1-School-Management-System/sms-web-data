<script setup lang="ts">
import NormalForm, { type NormalFormField } from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

type PositionRow = Record<string, any>

const positionForms = ref<any[]>([])
const loading = ref(false)
const positionData = ref<PositionRow[]>([])

const hasAnyChanges = computed(() =>
  positionForms.value.some((form) => Boolean(form?.isDirty)),
)
const isSaveDisabled = computed(() => loading.value || !hasAnyChanges.value)

const positionFields: NormalFormField[] = [
  {
    name: 'executive_group',
    label: 'กลุ่มงาน',
    type: 'select',
    required: true,
    disabled: false,
    placeholder: '',
    options: [
      { label: 'ผู้บริหาร', value: 'ผู้บริหาร' },
      { label: 'กลุ่มบริหารวิชาการ', value: 'กลุ่มบริหารวิชาการ' },
      { label: 'กลุ่มบริหารงานบุคคล', value: 'กลุ่มบริหารงานบุคคล' },
      { label: 'กลุ่มบริหารงบประมาณและธุรการ', value: 'กลุ่มบริหารงบประมาณและธุการ' },
      { label: 'กลุ่มบริหารทั่วไป', value: 'กลุ่มบริหารทั่วไป' },
      { label: 'สำนักผู้อำนวยการ', value: 'สำนักผู้อำนวยการ' },
    ],
  },
  {
    name: 'subject_group',
    label: 'กลุ่มสาระ',
    type: 'select',
    required: true,
    disabled: false,
    placeholder: '',
    options: [
      { label: 'กลุ่มสาระฯภาษาไทย', value: 'กลุ่มสาระฯภาษาไทย' },
      { label: 'กลุ่มสาระฯคณิตศาสตร์', value: 'กลุ่มสาระฯคณิตศาสตร์' },
      { label: 'กลุ่มสาระฯวิทยาศาสตร์และเทคโนโลยี', value: 'กลุ่มสาระฯวิทยาศาสตร์และเทคโนโลยี' },
      { label: 'กลุ่มสาระฯสังคมศึกษา ศาสนา และวัฒนธรรม', value: 'กลุ่มสาระฯสังคมศึกษา ศาสนา และวัฒนธรรม' },
      { label: 'กลุ่มสาระฯภาษาต่างประเทศ', value: 'กลุ่มสาระฯภาษาต่างประเทศ' },
      { label: 'กลุ่มสาระฯการงานอาชีพ', value: 'กลุ่มสาระฯการงานอาชีพ' },
      { label: 'กลุ่มสาระฯสุขศึกษาและพลศึกษา', value: 'กลุ่มสาระฯสุขศึกษาและพลศึกษา' },
      { label: 'กลุ่มสาระฯศิลปะ', value: 'กลุ่มสาระฯศิลปะ' },
      { label: 'งานคอมพิวเตอร์', value: 'งานคอมพิวเตอร์' },
      { label: 'งานแนะแนว', value: 'งานแนะแนว' },
      { label: 'งานบรรณารักษ์', value: 'งานบรรณารักษ์' },
      { label: 'บุคลากรทางการศึกษา', value: 'บุคลากรทางการศึกษา' },
    ],
  },
  { name: 'position', label: 'ตำแหน่ง', type: 'text', disabled: true, placeholder: '' },
  { name: 'work_status', label: 'สถานการทำงาน', type: 'text', disabled: true, placeholder: '' },
  { name: 'direct_pay_no', label: 'เลขที่จ่ายตรง', type: 'text', disabled: true, placeholder: '' },
  { name: 'position_number', label: 'เลขที่ตำแหน่ง', type: 'text', disabled: true, placeholder: '' },
  { name: 'appointment_type', label: 'ประเภทการบรรจุ', type: 'text', disabled: true, placeholder: 'เลือกประเภทการบรรจุ' },
  { name: 'appointment_date', label: 'ว/ด/ป ที่บรรจุ', type: 'date', disabled: true, placeholder: 'วว / ดด / ปปปป' },
  { name: 'service_start_date', label: 'ว/ด/ป ที่เริ่มปฏิบัติราชการ', type: 'date', disabled: true, placeholder: 'วว / ดด / ปปปป' },
  { name: 'birth_date', label: 'วัน / เดือน / ปี เกษียณ', type: 'date', disabled: true, placeholder: 'วว / ดด / ปปปป' },
  { name: 'position_held_date', label: 'ว/ด/ป ที่ดำรงตำแหน่ง', type: 'date', disabled: true, placeholder: 'วว / ดด / ปปปป' },
  { name: 'school_entry_date', label: 'ว/ด/ป ที่ปฏิบัติหน้าที่ในโรงเรียนคณะราษฎร์ฯ', type: 'date', disabled: true, placeholder: 'วว / ดด / ปปปป' },
  { name: 'work_age_from_appointment', label: 'อายุงาน(นับจากวันบรรจุ)', type: 'text', disabled: true, placeholder: '' },
  { name: 'work_age_at_school', label: 'อายุงาน ณ โรงเรียนคณะราษฎร์ฯ', type: 'text', disabled: true, placeholder: '' },
]

async function getPositionData() {
  loading.value = true
  try {
    const response = await getDatasetRows({ view: 'position_get', page: 1, per_page: 50 })
    positionData.value = response.data?.[0]?.governments || []
    toast.success(`โหลดข้อมูลตำแหน่งสำเร็จ (${response.total_rows} รายการ)`, { position: 'bottom-right' })
  } catch (error: any) {
    console.error('Position API Error:', error)
    toast.error(`โหลดข้อมูลตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getPositionData()
})

function setPositionFormRef(index: number, instance: any | null) {
  if (instance === null) {
    positionForms.value[index] = null
    return
  }
  positionForms.value[index] = instance
}

function getRefSetter(index: number) {
  return (instance: any | null) => setPositionFormRef(index, instance)
}

async function onSave() {
  if (!hasAnyChanges.value) return

  for (const inst of positionForms.value) {
    if (!inst) continue
    if (typeof inst.submitForm === 'function') {
      const ok = await inst.submitForm()
      if (!ok) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก', { position: 'bottom-right' })
        return
      }
    }
  }
  toast.success('บันทึกข้อมูลเรียบร้อย (mock)', { position: 'bottom-right' })
}

function handleSave(data: Record<string, any>) {
  console.log('Saved position item', data)
}

</script>

<template>
  <div class="flex flex-col">
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4">
      <div v-for="(item, index) in (positionData.length ? positionData : [{}])" :key="item.id || index">
        <NormalForm
          :ref="getRefSetter(index)"
          :values="item"
          @save="handleSave"
          :fields="positionFields"
        />
      </div>
    </div>

    <div class="cursor-pointer sticky bottom-0 right-0 z-40 flex justify-end border-t border-gray-200 bg-white p-3 w-full">
      <Button :disabled="isSaveDisabled" @click="onSave" class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm">
        บันทึก
      </Button>
    </div>
  </div>
</template>
