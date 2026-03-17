<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { createProfessionalLicense } from '@/stores/teachers'
import { useTeacherStore } from '@/stores/teachers'
import type { ProfessionalLicenseCreateDTO } from '@/types/teacher'
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

const formValues = ref<Record<string, any>>({})
const isSaving = ref(false)

function handleValuesUpdate(values: Record<string, any>) {
  formValues.value = { ...formValues.value, ...values }
}

async function handleSave() {
  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId
  if (!personId) {
    showError('ไม่พบข้อมูลครู', { description: 'กรุณากรอกข้อมูลส่วนบุคคลก่อน' })
    router.push({ name: ROUTE_NAMES.ADD_TEACHER_PERSONAL })
    return
  }

  const v = formValues.value
  if (!v.license_type || !v.license_no?.trim()) {
    showError('กรุณากรอกประเภทใบอนุญาตและเลขที่ใบอนุญาต')
    return
  }

  try {
    isSaving.value = true
    const payload: ProfessionalLicenseCreateDTO = {
      person_id: personId,
      license_type: v.license_type,
      license_no: v.license_no.trim(),
      issue_date: v.issue_date || undefined,
      expiry_date: v.expiry_date || undefined,
    }
    await createProfessionalLicense(payload)
    showSuccess('บันทึกข้อมูลใบอนุญาตสำเร็จ')
    router.push({ name: ROUTE_NAMES.MANAGE_TEACHERS })
  } catch (error: any) {
    showError('ไม่สามารถบันทึกข้อมูลได้', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="mx-6 pb-24">
    <DropDownForm
      topic="ข้อมูลใบอนุญาตประกอบวิชาชีพ"
      :values="formValues"
      @update:values="handleValuesUpdate"
      :fields="[
        {
          name: 'license_type', label: 'ประเภทใบอนุญาต', type: 'select', required: true, placeholder: 'เลือกประเภทใบอนุญาต',
          options: [
            { label: 'ใบอนุญาตประกอบวิชาชีพครู', value: 'teacher_license' },
            { label: 'ใบอนุญาตปฏิบัติการสอน', value: 'teaching_permit' },
            { label: 'หนังสือรับรองความรู้', value: 'knowledge_cert' },
            { label: 'อื่นๆ', value: 'other' },
          ],
        },
        { name: 'license_no', label: 'เลขที่ใบอนุญาต', type: 'text', required: true, placeholder: 'กรุณาระบุเลขที่ใบอนุญาต' },
        { name: 'issue_date', label: 'วันที่ออกใบอนุญาต', type: 'date', placeholder: 'วว / ดด / ปปปป' },
        { name: 'expiry_date', label: 'วันที่หมดอายุ', type: 'date', placeholder: 'วว / ดด / ปปปป' },
      ]"
    />
  </div>

  <div class="sticky bottom-0 right-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3">
    <Button variant="outline" class="mr-2" @click="() => {
      const idFromUrl = route.query.id as string
      const personId = idFromUrl || teacherStore.personId
      router.push({ name: ROUTE_NAMES.ADD_TEACHER_EDUCATION, query: { id: personId } })
    }">
      ย้อนกลับ
    </Button>
    <Button
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      :disabled="isSaving"
      @click="handleSave"
    >
      {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกและเสร็จสิ้น' }}
    </Button>
  </div>
</template>
