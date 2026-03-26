<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { createPersonAddress } from '@/stores/teachers'
import { useTeacherStore } from '@/stores/teachers'
import type { PersonAddressCreateDTO } from '@/types/teacher'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { showError, showSuccess } = useToast()
const teacherStore = useTeacherStore()

const isSubmitting = ref(false)
const formValues = ref<Record<string, any>>({})
// Load personId from URL query on mount
onMounted(() => {
  const idFromUrl = route.query.id as string
  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }
})

const addressTypes = ref<string[]>([])

const handleValuesUpdate = (payload: { values: Record<string, any>; isDirty: boolean }) => {
  formValues.value = { ...formValues.value, ...payload.values }
}

const handleSave = async () => {
  if (isSubmitting.value) return

  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId

  if (!personId) {
    showError('ไม่พบข้อมูลครู', { description: 'กรุณากรอกข้อมูลส่วนบุคคลก่อน' })
    await router.push({ name: ROUTE_NAMES.ADD_TEACHER_PERSONAL })
    return
  }

  try {
    isSubmitting.value = true

    const payload: PersonAddressCreateDTO = {
      person_id: personId,
      house_registry_no: formValues.value.house_registry_no || undefined,
      house_no: formValues.value.house_no || undefined,
      moo: formValues.value.moo || undefined,
      building: formValues.value.building || undefined,
      soi: formValues.value.soi || undefined,
      road: formValues.value.road || undefined,
      subdistrict: formValues.value.subdistrict || undefined,
      district: formValues.value.district || undefined,
      province: formValues.value.province || undefined,
      postal_code: formValues.value.postal_code || undefined,
      is_house_registered: addressTypes.value.includes('is_house_registered'),
      is_current: addressTypes.value.includes('is_current'),
      is_retired_residence: addressTypes.value.includes('is_retired_residence'),
    }

    await createPersonAddress(payload)

    showSuccess('บันทึกข้อมูลที่อยู่สำเร็จ', { description: 'กรุณากรอกข้อมูลครอบครัวต่อไป' })
    await router.push({ name: ROUTE_NAMES.ADD_TEACHER_FAMILY, query: { id: personId } })
  } catch (error: any) {
    showError('ไม่สามารถบันทึกข้อมูลที่อยู่ได้', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4">
      <!-- ประเภทที่อยู่ -->
      <div class="flex flex-wrap gap-4 pb-2 pl-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="addressTypes" value="is_house_registered" class="rounded border-gray-300" />
          <span class="text-sm">ที่อยู่ตามทะเบียนบ้าน</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="addressTypes" value="is_current" class="rounded border-gray-300" />
          <span class="text-sm">ที่อยู่ปัจจุบัน</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="addressTypes" value="is_retired_residence" class="rounded border-gray-300" />
          <span class="text-sm">ที่อยู่หลังเกษียณอายุราชการ</span>
        </label>
      </div>

      <DropDownForm
        topic="ข้อมูลที่อยู่"
        :values="formValues"
        @change="handleValuesUpdate"
        :fields="[
          { name: 'province', label: 'จังหวัด', type: 'text', required: true, placeholder: 'กรุณาระบุจังหวัด' },
          { name: 'postal_code', label: 'รหัสไปรษณีย์', type: 'text', required: true, placeholder: 'กรุณาระบุรหัสไปรษณีย์' },
          { name: 'district', label: 'อำเภอ/เขต', type: 'text', required: true, placeholder: 'กรุณาระบุอำเภอ/เขต' },
          { name: 'subdistrict', label: 'ตำบล/แขวง', type: 'text', required: true, placeholder: 'กรุณาระบุตำบล/แขวง' },
          { name: 'road', label: 'ถนน', type: 'text', placeholder: 'กรุณาระบุถนน' },
          { name: 'soi', label: 'ตรอก/ซอย', type: 'text', placeholder: 'กรุณาระบุตรอก/ซอย' },
          { name: 'building', label: 'หมู่บ้าน/อาคาร', type: 'text', placeholder: 'กรุณาระบุหมู่บ้าน/อาคาร' },
          { name: 'moo', label: 'หมู่ที่', type: 'text', placeholder: 'กรุณาระบุหมู่ที่' },
          { name: 'house_no', label: 'บ้านเลขที่', type: 'text', placeholder: 'กรุณาระบุบ้านเลขที่' },
          { name: 'house_registry_no', label: 'รหัสทะเบียนบ้าน', type: 'text', placeholder: 'กรุณาระบุรหัสทะเบียนบ้าน' },
        ]"
      />
    </div>

    <div class="sticky bottom-0 right-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3">
      <Button
        class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
        :disabled="isSubmitting"
        @click="handleSave"
      >
        {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
      </Button>
    </div>
  </div>
</template>
