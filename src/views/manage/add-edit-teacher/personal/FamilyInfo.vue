<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/lib/constants'
import { createFamilyMember } from '@/stores/teachers'
import { useTeacherStore } from '@/stores/teachers'
import type { FamilyMemberCreateDTO } from '@/types/teacher'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { showError, showSuccess } = useToast()
const teacherStore = useTeacherStore()

// Load personId from URL query on mount
onMounted(() => {
  const idFromUrl = route.query.id as string
  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }
})

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

const prefixMap: Record<string, number> = { นาย: 1, นาง: 2, นางสาว: 3 }

async function saveEntry(index: number) {
  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId
  if (!personId) {
    showError('ไม่พบข้อมูลครู', { description: 'กรุณากรอกข้อมูลส่วนบุคคลก่อน' })
    return
  }

  const v = entries.value[index]!
  if (!v.first_name_th?.trim() || !v.last_name_th?.trim() || !v.relation_type) {
    showError('กรุณากรอกความสัมพันธ์ ชื่อ และนามสกุล')
    return
  }

  try {
    savingIndex.value = index
    const payload: FamilyMemberCreateDTO = {
      person_id: personId,
      relation_type: v.relation_type,
      prefix_id: prefixMap[v.prefix_id] ?? undefined,
      first_name_th: v.first_name_th.trim(),
      middle_name_th: v.middle_name_th || undefined,
      last_name_th: v.last_name_th.trim(),
      former_last_name_th: v.former_last_name_th || undefined,
      national_id: v.national_id || undefined,
      gender: v.gender || undefined,
      is_alive: v.is_alive !== undefined ? v.is_alive === 'true' || v.is_alive === true : undefined,
      birth_date: v.birth_date || undefined,
      phone: v.phone || undefined,
      email: v.email || undefined,
      marital_status: v.marital_status || undefined,
      is_emergency_contact: v.is_emergency_contact === 'true' || v.is_emergency_contact === true,
    }
    await createFamilyMember(payload)
    showSuccess(`บันทึกสมาชิกครอบครัวคนที่ ${index + 1} สำเร็จ`)
  } catch (error: any) {
    showError('ไม่สามารถบันทึกข้อมูลได้', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    savingIndex.value = null
  }
}

const handleNext = () => {
  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId
  router.push({ name: ROUTE_NAMES.ADD_TEACHER_EDUCATION, query: { id: personId } })
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-24">
    <div v-for="(entry, index) in entries" :key="index" class="relative">
      <DropDownForm
        :topic="`สมาชิกครอบครัวคนที่ ${index + 1}`"
        :values="entry"
        @change="(payload) => handleEntryUpdate(index, payload.values)"
        :fields="[
          {
            name: 'relation_type', label: 'ความสัมพันธ์', type: 'select', required: true,
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
            name: 'prefix_id', label: 'คำนำหน้า', type: 'select', placeholder: 'เลือกคำนำหน้า',
            options: [
              { label: 'นาย', value: 'นาย' },
              { label: 'นาง', value: 'นาง' },
              { label: 'นางสาว', value: 'นางสาว' },
            ],
          },
          { name: 'first_name_th', label: 'ชื่อ', type: 'text', required: true, placeholder: 'กรุณาระบุชื่อ' },
          { name: 'last_name_th', label: 'นามสกุล', type: 'text', required: true, placeholder: 'กรุณาระบุนามสกุล' },
          { name: 'middle_name_th', label: 'ชื่อกลาง', type: 'text', placeholder: 'กรุณาระบุชื่อกลาง' },
          { name: 'former_last_name_th', label: 'นามสกุลเดิม', type: 'text', placeholder: 'กรุณาระบุนามสกุลเดิม' },
          { name: 'national_id', label: 'เลขบัตรประชาชน', type: 'text', placeholder: 'กรุณาระบุเลขบัตรประชาชน' },
          {
            name: 'gender', label: 'เพศ', type: 'select', placeholder: 'เลือกเพศ',
            options: [{ label: 'ชาย', value: 'male' }, { label: 'หญิง', value: 'female' }],
          },
          {
            name: 'is_alive', label: 'การมีชีวิต', type: 'select', placeholder: 'เลือก',
            options: [{ label: 'มีชีวิต', value: 'true' }, { label: 'เสียชีวิต', value: 'false' }],
          },
          { name: 'birth_date', label: 'วันเกิด', type: 'date', placeholder: 'วว / ดด / ปปปป' },
          { name: 'phone', label: 'โทรศัพท์', type: 'text', placeholder: 'กรุณาระบุเบอร์โทร' },
          { name: 'email', label: 'อีเมล', type: 'email', placeholder: 'กรุณาระบุอีเมล' },
          {
            name: 'marital_status', label: 'สถานภาพ', type: 'select', placeholder: 'เลือก',
            options: [
              { label: 'โสด', value: 'โสด' },
              { label: 'สมรส', value: 'สมรส' },
              { label: 'หย่า', value: 'หย่า' },
              { label: 'หม้าย', value: 'หม้าย' },
            ],
          },
        ]"
      />
      <div class="mt-2 flex justify-end gap-2">
        <Button
          v-if="entries.length > 1"
          variant="outline"
          size="sm"
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
      <Plus class="mr-2 h-4 w-4" /> เพิ่มสมาชิกครอบครัว
    </Button>
  </div>

  <div class="sticky bottom-0 right-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3">
    <Button variant="outline" class="mr-2" @click="() => {
      const idFromUrl = route.query.id as string
      const personId = idFromUrl || teacherStore.personId
      router.push({ name: ROUTE_NAMES.ADD_TEACHER_ADDRESS, query: { id: personId } })
    }">
      ย้อนกลับ
    </Button>
    <Button class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]" @click="handleNext">
      ถัดไป
    </Button>
  </div>
</template>
