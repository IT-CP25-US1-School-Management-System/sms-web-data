<script setup lang="ts">
import NormalForm from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'

import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows } from '@/stores/dataset'

const loading = ref(false)
const positionData = ref<Record<string, any>[]>([])
async function getPositionData() {
  loading.value = true
  try {

    const response = await getDatasetRows( {
      view: 'position_get',
      page: 1,
      per_page: 50,
    })
    positionData.value =  response.data[0]?.governments || [] 
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
  getPositionData()
})

</script>

<template>
  <div class="flex flex-col">
    <!-- Scrollable content area -->
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4"
    v-for="item in positionData" :key="item.id"
    >
      <NormalForm
        :values="item"
        :fields="[
          {
            name: 'work-group',
            label: 'กลุ่มงาน',
            type: 'select',
            required: true,
            disabled: false,
            placeholder: '',
            options: [
              { label: 'ผู้บริหาร', value: 'ผู้บริหาร' },
              { label: 'กลุ่มบริหารวิชาการ', value: 'กลุ่มบริหารวิชาการ' },
              { label: 'กลุ่มบริหารงานบุคคล', value: 'กลุ่มบริหารงานบุคคล' },
              { label: 'กลุ่มบริหารงบประมาณและธุรการ', value: 'กลุ่มบริหารงบประมาณและธุรการ' },
              { label: 'กลุ่มบริหารทั่วไป', value: 'กลุ่มบริหารทั่วไป' },
              { label: 'สำนักผู้อำนวยการ', value: 'สำนักผู้อำนวยการ' },  
            ],
          },
          {
            name: 'subject-group',
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
          {
            name: 'position',
            label: 'ตำแหน่ง',
            type: 'text',
            required: true,
            disabled: true,
            placeholder: '',
          },
          {
            name: 'work-status',
            label: 'สถานการทำงาน',
            type: 'text',
            required: true,
            disabled: true,
            placeholder: '',
          },
          {
            name: 'direct-payment-no',
            label: 'เลขที่จ่ายตรง',
            type: 'text',
            required: true,
            disabled: true,
            placeholder: '',
          },
          {
            name: 'position-no',
            label: 'เลขที่ตำแหน่ง',
            type: 'text',
            required: true,
            disabled: true,
            placeholder: '',
          },
          {
            name: 'appointment-type',
            label: 'ประเภทการบรรจุ',
            type: 'text',
            required: true,
            disabled: true,
            placeholder: 'เลือกประเภทการบรรจุ',
          },
          {
            name: 'appointment-date',
            label: 'ว/ด/ป ที่บรรจุ',
            type: 'date',
            disabled: true,
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'service-start-date',
            label: 'ว/ด/ป ที่เริ่มปฏิบัติราชการ',
            type: 'date',
            disabled: true,
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'birth-date',
            label: 'วัน / เดือน / ปี เกษียณ',
            type: 'date',
            required: true,
            disabled: true,
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'position-held-date',
            label: 'ว/ด/ป ที่ดำรงตำแหน่ง',
            type: 'date',
            disabled: true,
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'school-service-date',
            label: 'ว/ด/ป ที่ปฏิบัติหน้าที่ในโรงเรียนคณะราษฎร์ฯ',
            type: 'date',
            disabled: true,
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'work-age-from-appointment',
            label: 'อายุงาน(นับจากวันบรรจุ)',
            type: 'text',
            disabled: true,
            placeholder: '',
          },
          {
            name: 'work-age-at-school',
            label: 'อายุงาน ณ โรงเรียนคณะราษฎร์ฯ',
            type: 'text',
            disabled: true,
            placeholder: '',
          },
        ]"
      />
    </div>

    <!-- ปุ่มบันทึก -->
    <div
      class="sticky bottom-0 right-0 z-40 flex justify-end border-t border-gray-200 bg-white p-3 w-full"
    >
      <Button
        class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
      >
        บันทึก
      </Button>
    </div>
  </div>
</template>
