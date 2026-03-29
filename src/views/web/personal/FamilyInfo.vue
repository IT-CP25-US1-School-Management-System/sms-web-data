<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import type { FamilyMember } from '@/types/teacher'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { DATASET_GET, DATASET_EDIT } from '@/lib/constants'
const loading = ref(false)
const familyData = ref<Record<string, any>[]>([])

const action = ref('update')
const modalTopic = ref('ข้อมูลครอบครัว')
const modalValue = ref('')
const confirmModal = ref(false)
const pendingGroupIndex = ref<number | null>(null)
const pendingValues = ref<Record<string, any>>({})

function mapFamilyMemberForForm(member: Partial<FamilyMember>) {
  return {
    ...member,
    is_alive: member.is_alive ? 'มีชีวิต' : 'ไม่มีชีวิต',
    road: member.road ?? '',
    soi: member.soi ?? '',
    building: member.building ?? '',
  }
}

async function getFamilyData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'family_get',
      page: 1,
      per_page: 50,
    })

    familyData.value = (response.data[0]?.family_members || []).map(
      (member: FamilyMember) => mapFamilyMemberForForm(member),
    )
  } catch (error: any) {
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  }
  loading.value = false
}

async function updateFamilyData(groupIndex: number, values?: Record<string, any>) {
  const currentMember = familyData.value[groupIndex]

  if (!currentMember?.id) {
    toast.error('ไม่พบข้อมูลสมาชิกครอบครัวที่ต้องการบันทึก', {
      position: 'bottom-right',
    })
    return
  }

  loading.value = true

  try {
    const payload: Partial<FamilyMember> = {
      ...currentMember,
      ...values,
      is_alive: currentMember.is_alive === 'มีชีวิต',
      road: values?.road ?? currentMember.road ?? '',
      soi: values?.soi ?? currentMember.soi ?? '',
      building: values?.building ?? currentMember.building ?? '',
      updated_at: new Date().toISOString(),
    }

    const response = await updateDatasetRow(DATASET_EDIT.DATASET_ID, DATASET_EDIT.DATASET_VERSION_FAMILY, currentMember.id, payload)
    console.log('Family Update API Response:', response)
    familyData.value[groupIndex] = mapFamilyMemberForForm({
      ...currentMember,
      ...payload,
    })

    if ((response as { message?: string }).message === 'success') {
      toast.success(`บันทึกข้อมูลข้อมูลครอบครัวสำเร็จ`, {
        position: 'bottom-right',
      })
    }else {
      toast.error(`อัพเดตข้อมูลครอบครัวไม่สำเร็จ`, {
        position: 'bottom-right',
      })
    }
  } catch (error: any) {
    console.error('Family API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`อัปเดตข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  }

  loading.value = false
}

function updateData(confirmed: boolean) {
  if (confirmed && pendingGroupIndex.value !== null) {
    void updateFamilyData(pendingGroupIndex.value, pendingValues.value)
  }
  pendingGroupIndex.value = null
  pendingValues.value = {}
  confirmModal.value = false
}

onMounted(() => {
  void getFamilyData()
})

function handleSave(groupIndex: number, values?: Record<string, any>) {
  console.log('CreateForm save emitted:', { groupIndex, values })
  familyData.value[groupIndex] = {
    ...familyData.value[groupIndex],
    ...values,
  }
  pendingGroupIndex.value = groupIndex
  pendingValues.value = values || {}
  confirmModal.value = true
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    แก้ไขไม่ได้ ยกเว้นที่ เบอร์โทร อีเมล , ที่อยู่ update ได้
    <CreateForm
      :isDropdown="true"
      :readonly="true"
      :deferCommitOnSave="true"
      :values="familyData"
      :canDelete="false"
      :fields="[
        [
          {
            topic: 'ข้อมูลส่วนตัว',
            content: [
              {
                name: 'relation_type',
                label: 'ความสัมพันธ์',
                type: 'text',
                isShow: true,
                placeholder: '-',
                disabled: true,
              },
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
                isShow: true,
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'last_name_th',
                label: 'นามสกุล',
                type: 'text',
                isShow: true,
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'former_last_name_th',
                label: 'นามสกุลเดิม',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'middle_name_th',
                label: 'ชื่อกลาง',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'national_id',
                label: 'เลขบัตรประชาชน',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'gender',
                label: 'เพศ',
                type: 'text',
                disabled: true,
                placeholder: '-',
              },
              {
                name: 'is_alive',
                label: 'การมีชีวิต',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'birth_date',
                label: 'วัน / เดือน / ปี เกิด',
                type: 'date',
                placeholder: '-',
                disabled: true,
              },
              {
                name: 'phone',
                label: 'โทรศัพท์',
                type: 'text',
                required: true,
                placeholder: '0xxxxxxxxx',
              },
              {
                name: 'email',
                label: 'อีเมล',
                type: 'email',
                required: true,
                placeholder: 'example@email.com',
              },
              {
                name: 'marital_status',
                label: 'สถานภาพ',
                type: 'text',
                placeholder: '-',
                disabled: true,
              },
            ],
          },
          {
            topic: 'ที่อยู่ตามทะเบียนบ้าน',
            content: [
              {
                name: 'province',
                label: 'จังหวัด',
                type: 'text',
                required: true,
                placeholder: '',
              },

              {
                name: 'district',
                label: 'อำเภอ/เขต',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'subdistrict',
                label: 'ตำบล/แขวง',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'postal_code',
                label: 'รหัสไปรษณีย์',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'road',
                label: 'ถนน',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'soi',
                label: 'ตรอก/ซอย',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'building',
                label: 'หมู่บ้าน/อาคาร',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'moo',
                label: 'หมู่ที่',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'house_no',
                label: 'บ้านเลขที่',
                type: 'text',
                required: true,
                placeholder: '',
              },
            ],
          },
        ],
      ]"
      @save="handleSave"
    />
  </div>

  <ConfirmModal
    v-if="confirmModal"
    :action="action"
    :topic="modalTopic"
    :value="modalValue"
    @confirm="updateData"
  />
</template>
