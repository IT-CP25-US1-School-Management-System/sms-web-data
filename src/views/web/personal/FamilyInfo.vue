<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import provincesJson from '@/assets/thai-province-data/provinces.json'
import districtsJson from '@/assets/thai-province-data/districts.json'
import subDistrictsJson from '@/assets/thai-province-data/sub_districts.json'
import { DATASET_GET, DATASET_EDIT } from '@/lib/constants'
import { getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import type { District, Province, SubDistrict } from '@/types/address'
import type { FamilyMember } from '@/types/teacher'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

type CreateFormField = {
  name: string
  label?: string
  type:
    | 'text'
    | 'date'
    | 'date-range'
    | 'select'
    | 'combobox'
    | 'number'
    | 'email'
    | 'textarea'
    | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  isShow?: boolean
  options?: { label: string; value: any }[]
  accept?: string
  multiple?: boolean
}

type CreateFormSection = {
  topic?: string
  content: CreateFormField[]
}

const loading = ref(false)
const familyData = ref<Record<string, any>[]>([])
const familyFields = ref<CreateFormSection[][]>([])

const action = ref('update')
const modalTopic = ref('ข้อมูลครอบครัว')
const modalValue = ref('')
const confirmModal = ref(false)
const pendingGroupIndex = ref<number | null>(null)
const pendingValues = ref<Record<string, any>>({})

const provinceData = provincesJson as Province[]
const districtData = districtsJson as District[]
const subDistrictData = subDistrictsJson as SubDistrict[]

const provinceOptions = provinceData.map((province) => ({
  label: province.name_th,
  value: String(province.id),
}))

const provinceNameMap = new Map(provinceOptions.map((option) => [String(option.value), option.label]))
const districtOptionsByProvince = new Map<string, { label: string; value: string }[]>()
const districtNameMap = new Map<string, string>()
const subDistrictOptionsByDistrict = new Map<string, { label: string; value: string }[]>()
const subDistrictNameMap = new Map<string, string>()
const postalCodeBySubDistrict = new Map<string, string>()

districtData.forEach((district) => {
  const provinceId = String(district.province_id)
  const option = {
    label: district.name_th,
    value: String(district.id),
  }

  if (!districtOptionsByProvince.has(provinceId)) {
    districtOptionsByProvince.set(provinceId, [])
  }

  districtOptionsByProvince.get(provinceId)!.push(option)
  districtNameMap.set(option.value, option.label)
})

subDistrictData.forEach((subDistrict) => {
  const districtId = String(subDistrict.district_id)
  const option = {
    label: subDistrict.name_th,
    value: String(subDistrict.id),
  }

  if (!subDistrictOptionsByDistrict.has(districtId)) {
    subDistrictOptionsByDistrict.set(districtId, [])
  }

  subDistrictOptionsByDistrict.get(districtId)!.push(option)
  subDistrictNameMap.set(option.value, option.label)

  if (subDistrict.zip_code) {
    postalCodeBySubDistrict.set(option.value, String(subDistrict.zip_code))
  }
})

function cloneOptions(options?: { label: string; value: string }[]) {
  return (options || []).map((option) => ({ ...option }))
}

function getDistrictOptions(provinceCode?: string) {
  return cloneOptions(districtOptionsByProvince.get(String(provinceCode || '')) || [])
}

function getSubDistrictOptions(districtCode?: string) {
  return cloneOptions(subDistrictOptionsByDistrict.get(String(districtCode || '')) || [])
}

function mapFamilyMemberForForm(
  member: Partial<FamilyMember> & {
    prefixes?: {
      prefixes_name_th?: string
      prefixes_name_en?: string
    }
  },
) {
  return {
    ...member,
    
    prefix_name: (member as Record<string, any>)?.prefixes?.prefixes_name_th || '',
    is_alive: member.is_alive ? 'มีชีวิต' : 'ไม่มีชีวิต',
    province_code: member.province_code ?? '',
    district_code: member.district_code ?? '',
    subdistrict_code: member.subdistrict_code ?? '',
    province: member.province ?? '',
    district: member.district ?? '',
    subdistrict: member.subdistrict ?? '',
    postal_code: member.postal_code ?? '',
    road: member.road ?? '',
    soi: member.soi ?? '',
    building: member.building ?? '',
    moo: member.moo ?? '',
    house_no: member.house_no ?? '',
  }
}

function createFamilyFields(values: Record<string, any>): CreateFormSection[] {
  return [
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
          name: 'prefix_name',
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
          label: 'เบอร์โทรศัพท์',
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
          name: 'province_code',
          label: 'จังหวัด',
          type: 'combobox',
          required: true,
          placeholder: 'ค้นหาจังหวัด',
          options: cloneOptions(provinceOptions),
        },
        {
          name: 'district_code',
          label: 'อำเภอ/เขต',
          type: 'combobox',
          required: true,
          placeholder: 'ค้นหาอำเภอ/เขต',
          options: getDistrictOptions(values.province_code),
          disabled: !values.province_code,
        },
        {
          name: 'subdistrict_code',
          label: 'ตำบล/แขวง',
          type: 'combobox',
          required: true,
          placeholder: 'ค้นหาตำบล/แขวง',
          options: getSubDistrictOptions(values.district_code),
          disabled: !values.district_code,
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
  ]
}

function syncFamilyAddress(index: number, incomingValues?: Record<string, any>) {
  const currentValues = familyData.value[index] || {}
  const values = {
    ...currentValues,
    ...incomingValues,
  }

  const previousProvinceCode = String(currentValues.province_code || '')
  const previousDistrictCode = String(currentValues.district_code || '')
  const nextProvinceCode = String(values.province_code || '')
  let shouldRefreshFields = false

  if (nextProvinceCode !== previousProvinceCode) {
    values.district_code = ''
    values.district = ''
    values.subdistrict_code = ''
    values.subdistrict = ''
    values.postal_code = ''
    shouldRefreshFields = true
  }

  if (String(values.district_code || '') !== previousDistrictCode) {
    values.subdistrict_code = ''
    values.subdistrict = ''
    values.postal_code = ''
    shouldRefreshFields = true
  }

  const resolvedProvinceCode = String(values.province_code || '')
  const resolvedDistrictCode = String(values.district_code || '')
  const resolvedSubDistrictCode = String(values.subdistrict_code || '')

  values.province = provinceNameMap.get(resolvedProvinceCode) || ''
  values.district = districtNameMap.get(resolvedDistrictCode) || ''
  values.subdistrict = subDistrictNameMap.get(resolvedSubDistrictCode) || ''

  if (resolvedSubDistrictCode) {
    values.postal_code = postalCodeBySubDistrict.get(resolvedSubDistrictCode) || values.postal_code || ''
  }

  const nextFamilyData = [...familyData.value]
  nextFamilyData[index] = values
  familyData.value = nextFamilyData

  if (shouldRefreshFields) {
    const nextFamilyFields = [...familyFields.value]
    nextFamilyFields[index] = createFamilyFields(values)
    familyFields.value = nextFamilyFields
  }
}

function normalizeFamilyPayload(currentMember: Record<string, any>, values?: Record<string, any>) {
  const mergedValues = {
    ...currentMember,
    ...values,
  }

  const provinceCode = String(mergedValues.province_code || '')
  const districtCode = String(mergedValues.district_code || '')
  const subDistrictCode = String(mergedValues.subdistrict_code || '')

  return {
    ...mergedValues,
    province_code: provinceCode || undefined,
    district_code: districtCode || undefined,
    subdistrict_code: subDistrictCode || undefined,
    province: provinceNameMap.get(provinceCode) || mergedValues.province || undefined,
    district: districtNameMap.get(districtCode) || mergedValues.district || undefined,
    subdistrict: subDistrictNameMap.get(subDistrictCode) || mergedValues.subdistrict || undefined,
    postal_code: mergedValues.postal_code || postalCodeBySubDistrict.get(subDistrictCode) || undefined,
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
    console.log('Family API Response:', response)
    const rootPrefixName =
      (response.data[0] as Record<string, any> | undefined)?.prefixes?.prefixes_name_th || ''
    familyData.value = (response.data[0]?.family_members || []).map((member: FamilyMember) =>
      mapFamilyMemberForForm({
        ...member,
        prefixes:
          (member as Record<string, any>)?.prefixes ||
          (rootPrefixName ? { prefixes_name_th: rootPrefixName } : undefined),
      }),
    )
    familyFields.value = familyData.value.map((member) => createFamilyFields(member))
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
    const normalizedValues = normalizeFamilyPayload(currentMember, values) as Partial<FamilyMember> &
      Record<string, any>
    const payload: Partial<FamilyMember> = {
      ...currentMember,
      ...normalizedValues,
      is_alive: currentMember.is_alive === 'มีชีวิต',
      road: normalizedValues.road ?? currentMember.road ?? '',
      soi: normalizedValues.soi ?? currentMember.soi ?? '',
      building: normalizedValues.building ?? currentMember.building ?? '',
      updated_at: new Date().toISOString(),
    }

    const response = await updateDatasetRow(
      DATASET_EDIT.DATASET_ID,
      DATASET_EDIT.DATASET_VERSION_FAMILY,
      currentMember.id,
      payload,
    )

    const nextFamilyData = [...familyData.value]
    nextFamilyData[groupIndex] = mapFamilyMemberForForm({
      ...currentMember,
      ...payload,
    })
    familyData.value = nextFamilyData

    const nextFamilyFields = [...familyFields.value]
    nextFamilyFields[groupIndex] = createFamilyFields(nextFamilyData[groupIndex] || {})
    familyFields.value = nextFamilyFields

    if ((response as { message?: string }).message === 'success') {
      toast.success('บันทึกข้อมูลข้อมูลครอบครัวสำเร็จ', {
        position: 'bottom-right',
      })
    } else {
      toast.error('อัปเดตข้อมูลครอบครัวไม่สำเร็จ', {
        position: 'bottom-right',
      })
    }
  } catch (error: any) {

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

function shouldSyncFamilyAddress(
  groupIndex: number,
  values?: Record<string, any>,
) {
  if (!values) return false

  const currentMember = familyData.value[groupIndex] || {}
  return (
    String(values.province_code || '') !== String(currentMember.province_code || '') ||
    String(values.district_code || '') !== String(currentMember.district_code || '') ||
    String(values.subdistrict_code || '') !== String(currentMember.subdistrict_code || '') ||
    String(values.postal_code || '') !== String(currentMember.postal_code || '')
  )
}

function handleChange(groupIndex: number, values?: Record<string, any>) {
  if (!shouldSyncFamilyAddress(groupIndex, values)) return
  syncFamilyAddress(groupIndex, values)
}

function handleSave(groupIndex: number, values?: Record<string, any>) {
  pendingGroupIndex.value = groupIndex
  pendingValues.value = values || {}
  confirmModal.value = true
}

onMounted(() => {
  void getFamilyData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div v-else class="mx-6 flex flex-col gap-4">
    <CreateForm
      :isDropdown="true"
      :readonly="true"
      :deferCommitOnSave="true"
      :values="familyData"
      :canDelete="false"
      :fields="familyFields"
      @change="handleChange"
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
