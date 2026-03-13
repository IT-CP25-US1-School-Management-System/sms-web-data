<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/lib/constants'
import { createEducationRecord } from '@/stores/teachers'
import { useTeacherStore } from '@/stores/teachers'
import type { EducationRecordCreateDTO } from '@/types/teacher'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showError, showSuccess } = useToast()
const teacherStore = useTeacherStore()

type EntryValues = Record<string, any>

const entries = ref<EntryValues[]>([{}])
const savingIndex = ref<number | null>(null)

function addEntry() {
  entries.value.push({})
}

function removeEntry(index: number) {
  entries.value.splice(index, 1)
}

function handleEntryUpdate(index: number, values: Record<string, any>) {
  entries.value[index] = { ...entries.value[index], ...values }
}

async function saveEntry(index: number) {
  const personId = teacherStore.personId
  if (!personId) {
    showError('ไม่พบข้อมูลครู', { description: 'กรุณากรอกข้อมูลส่วนบุคคลก่อน' })
    return
  }
  const v = entries.value[index]!
  if (!v.education_level?.trim() || !v.qualification?.trim()) {
    showError('กรุณากรอกระดับการศึกษาและวุฒิการศึกษา')
    return
  }
  try {
    savingIndex.value = index
    const payload: EducationRecordCreateDTO = {
      person_id: personId,
      education_level: v.education_level.trim(),
      qualification: v.qualification.trim(),
      major_group: v.major_group || undefined,
      minor_group: v.minor_group || undefined,
      institution: v.institution || undefined,
      country: v.country || undefined,
      start_date: v.start_date || undefined,
      graduation_date: v.graduation_date || undefined,
      honor_type: v.honor_type || undefined,
      is_used_for_first_appointment: v.is_used_for_first_appointment === 'true' || v.is_used_for_first_appointment === true,
      is_highest_degree: v.is_highest_degree === 'true' || v.is_highest_degree === true,
      is_meets_position_standard: v.is_meets_position_standard === 'true' || v.is_meets_position_standard === true,
      is_recognized_by_kksa: v.is_recognized_by_kksa === 'true' || v.is_recognized_by_kksa === true,
      is_recognized_by_ocsc: v.is_recognized_by_ocsc === 'true' || v.is_recognized_by_ocsc === true,
    }
    await createEducationRecord(payload)
    showSuccess(`บันทึกประวัติการศึกษาลำดับที่ ${index + 1} สำเร็จ`)
  } catch (error: any) {
    showError('ไม่สามารถบันทึกข้อมูลได้', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    savingIndex.value = null
  }
}

const handleNext = () => {
  router.push({ name: ROUTE_NAMES.ADD_TEACHER_PROFESSIONAL_LICENSE })
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-24">
    <div v-for="(entry, index) in entries" :key="index">
      <DropDownForm
        :topic="`ประวัติการศึกษาลำดับที่ ${index + 1}`"
        :values="entry"
        @update:values="(v) => handleEntryUpdate(index, v)"
        :fields="[
          { name: 'education_level', label: 'ระดับการศึกษา', type: 'text', required: true, placeholder: 'เช่น ปริญญาตรี' },
          { name: 'qualification', label: 'วุฒิการศึกษา', type: 'text', required: true, placeholder: 'เช่น วท.บ.' },
          { name: 'major_group', label: 'สาขาวิชาเอก', type: 'text', placeholder: 'กรุณาระบุสาขาวิชาเอก' },
          { name: 'minor_group', label: 'สาขาวิชาโท', type: 'text', placeholder: 'กรุณาระบุสาขาวิชาโท' },
          { name: 'institution', label: 'สถานศึกษา', type: 'text', placeholder: 'กรุณาระบุชื่อสถานศึกษา' },
          { name: 'country', label: 'ประเทศ', type: 'text', placeholder: 'เช่น ไทย' },
          { name: 'start_date', label: 'วันที่เริ่มเรียน', type: 'date', placeholder: 'วว / ดด / ปปปป' },
          { name: 'graduation_date', label: 'วันสำเร็จการศึกษา', type: 'date', placeholder: 'วว / ดด / ปปปป' },
          {
            name: 'honor_type', label: 'เกียรตินิยม', type: 'select', placeholder: 'เลือก',
            options: [
              { label: 'ไม่มีเกียรตินิยม', value: 'none' },
              { label: 'เกียรตินิยมอันดับ 1', value: 'first_class' },
              { label: 'เกียรตินิยมอันดับ 2', value: 'second_class' },
            ],
          },
          {
            name: 'is_used_for_first_appointment', label: 'ใช้บรรจุครั้งแรก', type: 'select', placeholder: 'เลือก',
            options: [{ label: 'ใช่', value: 'true' }, { label: 'ไม่ใช่', value: 'false' }],
          },
          {
            name: 'is_highest_degree', label: 'วุฒิสูงสุด', type: 'select', placeholder: 'เลือก',
            options: [{ label: 'ใช่', value: 'true' }, { label: 'ไม่ใช่', value: 'false' }],
          },
          {
            name: 'is_meets_position_standard', label: 'ตรงตามมาตรฐานตำแหน่ง', type: 'select', placeholder: 'เลือก',
            options: [{ label: 'ใช่', value: 'true' }, { label: 'ไม่ใช่', value: 'false' }],
          },
          {
            name: 'is_recognized_by_kksa', label: 'รับรองโดย กคศ.', type: 'select', placeholder: 'เลือก',
            options: [{ label: 'ใช่', value: 'true' }, { label: 'ไม่ใช่', value: 'false' }],
          },
          {
            name: 'is_recognized_by_ocsc', label: 'รับรองโดย กพ.', type: 'select', placeholder: 'เลือก',
            options: [{ label: 'ใช่', value: 'true' }, { label: 'ไม่ใช่', value: 'false' }],
          },
        ]"
      />
      <div class="mt-2 flex justify-end gap-2">
        <Button
          v-if="entries.length > 1"
          variant="outline" size="sm"
          class="text-destructive border-destructive hover:bg-destructive/10"
          @click="removeEntry(index)"
        >
          <Trash2 class="mr-1 h-4 w-4" /> ลบ
        </Button>
        <Button
          size="sm"
          class="bg-[#16A34A] text-white hover:bg-[#15803D]"
          :disabled="savingIndex === index"
          @click="saveEntry(index)"
        >
          {{ savingIndex === index ? 'กำลังบันทึก...' : 'บันทึกรายการนี้' }}
        </Button>
      </div>
    </div>

    <Button variant="outline" class="w-full border-dashed" @click="addEntry">
      <Plus class="mr-2 h-4 w-4" /> เพิ่มประวัติการศึกษา
    </Button>
  </div>

  <div class="sticky bottom-0 right-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3">
    <Button variant="outline" class="mr-2" @click="router.push({ name: ROUTE_NAMES.ADD_TEACHER_FAMILY })">
      ย้อนกลับ
    </Button>
    <Button class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]" @click="handleNext">
      ถัดไป
    </Button>
  </div>
</template>
