<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { Button } from '@/components/ui/button'
import { getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import { onMounted, ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { PersonData } from '@/types/teacher'
import { calAge, formatDateInput } from '@/lib/helpers.ts'
import { DATASET_EDIT, DATASET_GET } from '@/lib/constants'

const loading = ref(false)
const loadData = ref(false)
const personalData = ref<Record<string, any>>({})
const personalDataUpdate = ref<PersonData>({
  id: '',
  prefix_id: 0,
  role_id: '',
  is_government: false,
  first_name_th: '',
  last_name_th: '',
  created_at: '',
})

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ข้อมูลส่วนตัว')
const modalValue = ref('')

// refs to DropDownForm components so we can trigger validation from the parent save button
const generalForm = ref<any>(null)
const sensitiveForm = ref<any>(null)
const contactForm = ref<any>(null)

async function getPersonalDetailData() {
  loadData.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'personal_get',
      page: 1,
      per_page: 50,
    })
    personalData.value = response.data[0] || {}
    personalData.value.birth_date = formatDateInput(personalData.value.birth_date)
    personalDataUpdate.value = { ...personalData.value } as PersonData
    personalData.value.prefix_id = response.data[0]?.prefixes?.prefixes_name_th || ''
    personalData.value.prefix_en = response.data[0]?.prefixes?.prefixes_name_en || ''
    personalData.value.age = calAge(personalData.value.birth_date)
  } catch (error: any) {
    toast.error(`โหลดข้อมูลส่วนตัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } finally {
    loadData.value = false
  }
}

async function updateDataPersonalDetail() {
  loading.value = true
  const datasetId = DATASET_EDIT.DATASET_ID
  const version = DATASET_EDIT.DATASET_VERSION_PERSONAL_DETAIL //'v1.0.0'

  try {
    const response = await updateDatasetRow(
      datasetId,
      version,
      personalData.value.id,
      personalDataUpdate.value,
    )
    if ((response as { message?: string }).message === 'success') {
      toast.success(`อัพเดตข้อมูลส่วนตัวสำเร็จ`, {
        position: 'bottom-right',
      })
    } else {
      toast.error(`อัพเดตข้อมูลส่วนตัวไม่สำเร็จ`, {
        position: 'bottom-right',
      })
    }
  } catch (error: any) {
    toast.error(
      `อัพเดตข้อมูลส่วนตัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  }
  loading.value = false
}

onMounted(() => {
  getPersonalDetailData()
})

function updateData(action: boolean) {
  // Implementation for updating personal detail data
  if (action) {
    contactForm.value?.submitForm?.()
    const now = new Date().toISOString()
    personalDataUpdate.value = {
      ...personalDataUpdate.value,
      department_id: +personalData.value.department_id?.toString() || null,
      updated_at: now,
    }
    updateDataPersonalDetail()
  }
  confirmModal.value = false
}

async function onSaveAll() {
  const forms = [generalForm, sensitiveForm, contactForm]
  let isAllValid = []

  for (const fRef of forms) {
    if (fRef.value?.validateForm) {
      const isValid = await fRef.value.validateForm()
      if (!isValid) {
        isAllValid.push(false)
      }
    }
  }
  // If any form is false, do not proceed and close the modal if it was open
  if (isAllValid.some((valid) => valid === false)) {
    confirmModal.value = false
    return
  }

  confirmModal.value = true
}

//value จาก emit
async function handleSave(data: Record<string, any>, formType: string) {
  if (formType === 'contactForm') {
    personalDataUpdate.value = {
      ...personalDataUpdate.value,
      ...data,
    }
  }
}

const hasAnyChanges = computed(() =>
  [generalForm.value, sensitiveForm.value, contactForm.value].some((form) =>
    Boolean(form?.isDirty),
  ),
)
const isSaveDisabled = computed(() => loading.value || !hasAnyChanges.value)
</script>

<template>
  <div v-show="loadData" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div v-show="!loadData" class="mx-6 flex flex-col gap-4">
    <!-- ข้อมูลทั่วไป -->
    <DropDownForm
      topic="ข้อมูลทั่วไป"
      :values="personalData"
      ref="generalForm"
      @save="(data) => handleSave(data, 'generalForm')"
      :fields="[
        {
          name: 'prefix_id',
          label: 'คำนำหน้า',
          type: 'text',
          placeholder: '-',
          disabled: true,
        },
        {
          name: 'first_name_th',
          label: 'ชื่อ',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'middle_name_th',
          label: 'ชื่อกลาง',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'last_name_th',
          label: 'นามสกุล',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'prefix_en',
          label: 'Prefix',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'first_name_en',
          label: 'Name',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'middle_name_en',
          label: 'Middlename',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'last_name_en',
          label: 'Lastname',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'birth_date',
          label: 'วัน / เดือน / ปี เกิด',
          type: 'date',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'age',
          label: 'อายุ (ปี)',
          type: 'number',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'marital_status',
          label: 'สถานภาพการแต่งงาน',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'spouse_name',
          label: 'คู่สมรส',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'national_id',
          label: 'เลขบัตรประจำตัวประชาชน',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
      ]"
    />

    <!-- ข้อมูล Sensitive -->
    <DropDownForm
      ref="sensitiveForm"
      topic="ข้อมูล Sensitive"
      :values="personalData"
      @save="(data) => handleSave(data, 'sensitive')"
      :fields="[
        {
          name: 'gender',
          label: 'เพศ',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'religion',
          label: 'ศาสนา',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'nationality',
          label: 'สัญชาติ',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'ethnicity',
          label: 'เชื้อชาติ',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'blood_type',
          label: 'หมู่เลือด',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
        {
          name: 'physical_status',
          label: 'สถานภาพทางร่างกาย',
          type: 'text',
          disabled: true,
          placeholder: '-',
        },
      ]"
    />

    <!-- ช่องทางการติดต่อ -->
    <DropDownForm
      ref="contactForm"
      topic="ช่องทางการติดต่อ"
      :values="personalData"
      @save="(data) => handleSave(data, 'contactForm')"
      :fields="[
        {
          name: 'phone',
          label: 'เบอร์โทรศัพท์',
          type: 'text',
          required: true,
          disabled: false,
          placeholder: '0xxxxxxxxx',
        },
        {
          name: 'personal_email',
          label: 'E-mail',
          type: 'email',
          required: true,
          disabled: false,
          placeholder: 'example@email.com',
        },
        {
          name: 'line_id',
          label: 'Line ID',
          type: 'text',
          required: true,
          disabled: false,
          placeholder: 'กรุณาระบุ Line ID',
        },
      ]"
    />
  </div>

  <!-- ปุ่มบันทึก -->
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-black"
  >
    <Button
      class="cursor-pointer rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      :disabled="isSaveDisabled"
      @click="onSaveAll()"
    >
      บันทึก
    </Button>
  </div>

  <!-- modal -->
  <ConfirmModal
    v-if="confirmModal"
    :action="action"
    :topic="modalTopic"
    :value="modalValue"
    :disabled="isSaveDisabled"
    @confirm="updateData"
  />
</template>
