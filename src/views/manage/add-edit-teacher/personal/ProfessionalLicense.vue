<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { createProfessionalLicense, useTeacherStore } from '@/stores/teachers'
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

function handleValuesUpdate(payload: { values: Record<string, any>; isDirty: boolean }) {
  formValues.value = { ...formValues.value, ...payload.values }
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

const handleBack = () => {
  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId
  router.push({ name: ROUTE_NAMES.ADD_TEACHER_EDUCATION, query: { id: personId } })
}
</script>

<template>
  <div class="mx-6 pb-24">
    <p class="mb-4 text-sm text-muted-foreground">รูปแบบฟอร์มสอดคล้องกับข้อมูลใบประกอบวิชาชีพในหน้าข้อมูลส่วนบุคคล</p>
    <DropDownForm
      topic="ข้อมูลใบอนุญาตประกอบวิชาชีพ"
      :values="formValues"
      @change="handleValuesUpdate"
      :fields="[
        {
          name: 'license_type', label: 'ใบประกอบวิชาชีพ', type: 'select', required: true, placeholder: 'เลือกประเภทใบประกอบวิชาชีพ',
          options: [
            { label: 'ใบอนุญาตปฏิบัติหน้าที่ครู (P-License)', value: 'P-License' },
            { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นต้น (B-License)', value: 'B-License' },
            { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นสูง (A-License)', value: 'A-License' },
            { label: 'ใบอนุญาตสอน', value: 'ใบอนุญาตสอน' },
          ],
        },
        { name: 'license_no', label: 'เลขที่ใบประกอบวิชาชีพ', type: 'text', required: true, placeholder: 'กรุณาระบุเลขที่ใบประกอบวิชาชีพ' },
        { name: 'issue_date', label: 'วันเดือนปีที่ออกบัตร', type: 'date', placeholder: 'วว / ดด / ปปปป' },
        { name: 'expiry_date', label: 'วันเดือนปีบัตรหมดอายุ', type: 'date', placeholder: 'วว / ดด / ปปปป' },
        { name: 'license-file', label: 'แนบใบประกอบวิชาชีพ', type: 'file', accept: '.pdf,.jpg,.png', multiple: true, placeholder: 'แนบไฟล์เอกสาร' },
      ]"
    />
  </div>

  <div class="sticky bottom-0 right-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3">
    <Button variant="outline" class="mr-2" @click="handleBack">
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
