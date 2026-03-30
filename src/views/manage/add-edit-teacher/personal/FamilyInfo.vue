<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import provincesJson from '@/assets/thai-province-data/provinces.json'
import districtsJson from '@/assets/thai-province-data/districts.json'
import subDistrictsJson from '@/assets/thai-province-data/sub_districts.json'
import {
  createFamilyMember,
  getFamilyById,
  updateFamilyMember,
  useTeacherStore,
} from '@/stores/teachers'
import type { District, Province, SubDistrict } from '@/types/address'
import type { FamilyMember, FamilyMemberCreateDTO } from '@/types/teacher'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
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

const route = useRoute()
const teacherStore = useTeacherStore()

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

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function normalizeAliveStatus(value: unknown) {
  if (value === 'มีชีวิต') return true
  if (value === 'ไม่มีชีวิต') return false
  return Boolean(value)
}

function normalizeGender(value: unknown): FamilyMember['gender'] | undefined {
  if (value === 'ชาย' || value === 'หญิง' || value === 'อื่นๆ') {
    return value
  }

  return undefined
}

function mapFamilyMemberForForm(member: Partial<FamilyMember>) {
  return {
    ...member,
    is_alive:
      member.is_alive === undefined || member.is_alive === null
        ? ''
        : member.is_alive
          ? 'มีชีวิต'
          : 'ไม่มีชีวิต',
    phone: member.phone ?? '',
    email: member.email ?? '',
    province_code: member.province_code ?? '',
    district_code: member.district_code ?? '',
    subdistrict_code: member.subdistrict_code ?? '',
    province: member.province ?? '',
    district: member.district ?? '',
    subdistrict: member.subdistrict ?? '',
    postal_code: member.postal_code ?? '',
    moo: member.moo ?? '',
    house_no: member.house_no ?? '',
    road: member.road ?? '',
    soi: member.soi ?? '',
    building: member.building ?? '',
  }
}

function getPersonId() {
  const idFromUrl = route.query.id as string | undefined
  const personId = idFromUrl || teacherStore.personId

  if (idFromUrl && teacherStore.personId !== idFromUrl) {
    teacherStore.setPersonId(idFromUrl)
  }

  return personId
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
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
          placeholder: 'เช่น บิดา / มารดา / คู่สมรส',
        },
        {
          name: 'prefix_id',
          label: 'คำนำหน้า',
          type: 'text',
          placeholder: 'เช่น นาย / นาง / นางสาว',
        },
        {
          name: 'first_name_th',
          label: 'ชื่อ',
          type: 'text',
          isShow: true,
          placeholder: 'กรุณาระบุชื่อ',
        },
        {
          name: 'last_name_th',
          label: 'นามสกุล',
          type: 'text',
          isShow: true,
          placeholder: 'กรุณาระบุนามสกุล',
        },
        {
          name: 'former_last_name_th',
          label: 'นามสกุลเดิม',
          type: 'text',
          placeholder: 'กรุณาระบุนามสกุลเดิม',
        },
        {
          name: 'middle_name_th',
          label: 'ชื่อกลาง',
          type: 'text',
          placeholder: 'กรุณาระบุชื่อกลาง',
        },
        {
          name: 'national_id',
          label: 'เลขบัตรประชาชน',
          type: 'text',
          placeholder: 'กรุณาระบุเลขบัตรประชาชน',
        },
        {
          name: 'gender',
          label: 'เพศ',
          type: 'text',
          placeholder: 'เช่น ชาย / หญิง',
        },
        {
          name: 'is_alive',
          label: 'การมีชีวิต',
          type: 'text',
          placeholder: 'เช่น มีชีวิต / ไม่มีชีวิต',
        },
        {
          name: 'birth_date',
          label: 'วัน / เดือน / ปี เกิด',
          type: 'date',
          placeholder: 'วว / ดด / ปปปป',
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
          placeholder: 'เช่น name@example.com',
        },
        {
          name: 'marital_status',
          label: 'สถานภาพ',
          type: 'text',
          placeholder: 'เช่น โสด / สมรส',
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
          placeholder: 'กรุณาระบุรหัสไปรษณีย์',
        },
        {
          name: 'road',
          label: 'ถนน',
          type: 'text',
          placeholder: 'กรุณาระบุถนน',
        },
        {
          name: 'soi',
          label: 'ตรอก/ซอย',
          type: 'text',
          placeholder: 'กรุณาระบุตรอก/ซอย',
        },
        {
          name: 'building',
          label: 'หมู่บ้าน/อาคาร',
          type: 'text',
          placeholder: 'กรุณาระบุหมู่บ้านหรืออาคาร',
        },
        {
          name: 'moo',
          label: 'หมู่ที่',
          type: 'text',
          placeholder: 'กรุณาระบุหมู่ที่',
        },
        {
          name: 'house_no',
          label: 'บ้านเลขที่',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุบ้านเลขที่',
        },
      ],
    },
  ]
}

function setFamilyFieldsAt(index: number, values: Record<string, any>) {
  const nextFields = [...familyFields.value]
  nextFields[index] = createFamilyFields(values)
  familyFields.value = nextFields
}

function syncFamilyAddress(index: number, incomingValues?: Record<string, any>) {
  const currentValues = familyData.value[index] || {}
  const values = {
    ...currentValues,
    ...incomingValues,
  }

  const previousProvinceCode = String(currentValues.province_code || '')
  const previousDistrictCode = String(currentValues.district_code || '')
  const previousSubDistrictCode = String(currentValues.subdistrict_code || '')
  const nextProvinceCode = String(values.province_code || '')
  const nextDistrictCode = String(values.district_code || '')

  const provinceChanged = nextProvinceCode !== previousProvinceCode
  const districtChanged = nextDistrictCode !== previousDistrictCode

  if (provinceChanged) {
    values.district_code = ''
    values.district = ''
    values.subdistrict_code = ''
    values.subdistrict = ''
    values.postal_code = ''
  }

  if (districtChanged) {
    values.subdistrict_code = ''
    values.subdistrict = ''
    values.postal_code = ''
  }

  const resolvedProvinceCode = String(values.province_code || '')
  const resolvedDistrictCode = String(values.district_code || '')
  const resolvedSubDistrictCode = String(values.subdistrict_code || '')

  values.province = provinceNameMap.get(resolvedProvinceCode) || ''
  values.district = districtNameMap.get(resolvedDistrictCode) || ''
  values.subdistrict = subDistrictNameMap.get(resolvedSubDistrictCode) || ''

  if (resolvedSubDistrictCode) {
    values.postal_code =
      postalCodeBySubDistrict.get(resolvedSubDistrictCode) || values.postal_code || ''
  }

  familyData.value[index] = values

  if (
    provinceChanged ||
    districtChanged ||
    resolvedSubDistrictCode !== previousSubDistrictCode ||
    !familyFields.value[index]
  ) {
    setFamilyFieldsAt(index, values)
  }
}

function normalizeFamilyPayload(
  currentMember: Record<string, any>,
  values?: Record<string, any>,
): Record<string, any> {
  const mergedValues: Record<string, any> = {
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
    postal_code:
      mergedValues.postal_code || postalCodeBySubDistrict.get(subDistrictCode) || undefined,
  }
}

async function getFamilyData() {
  loading.value = true
  try {
    const personId = getPersonId()

    if (!personId) {
      familyData.value = []
      familyFields.value = [createFamilyFields({})]
      toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
        position: 'bottom-right',
      })
      return
    }

    const response = await getFamilyById(personId)

    familyData.value = (response.data?.family_members || []).map(
      (member: FamilyMember) => mapFamilyMemberForForm(member),
    )
    familyFields.value = familyData.value.length
      ? familyData.value.map((member) => createFamilyFields(member))
      : [createFamilyFields({})]
  } catch (error: any) {
    toast.error(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } finally {
    loading.value = false
  }
}

function buildFamilyPayload(
  source: Record<string, any>,
  values?: Record<string, any>,
  mode: 'create' | 'update' = 'update',
): Partial<FamilyMember> & FamilyMemberCreateDTO {
  const normalizedValues = normalizeFamilyPayload(source, values)
  const now = new Date().toISOString()
  const id = String(normalizedValues.id || source.id || generateUuid())

  return {
    ...source,
    ...values,
    id,
    person_id: String(normalizedValues.person_id || ''),
    relation_type: String(normalizedValues.relation_type || '').trim(),
    prefix_id: normalizedValues.prefix_id,
    first_name_th: String(normalizedValues.first_name_th || '').trim(),
    middle_name_th: normalizeText(normalizedValues.middle_name_th),
    last_name_th: String(normalizedValues.last_name_th || '').trim(),
    former_last_name_th: normalizeText(normalizedValues.former_last_name_th),
    national_id: normalizeText(normalizedValues.national_id),
    gender: normalizeGender(normalizedValues.gender),
    is_alive: normalizeAliveStatus(normalizedValues.is_alive),
    birth_date: normalizeText(normalizedValues.birth_date),
    phone: normalizeText(normalizedValues.phone),
    email: normalizeText(normalizedValues.email),
    marital_status: normalizeText(normalizedValues.marital_status),
    house_no: normalizeText(normalizedValues.house_no),
    moo: normalizeText(normalizedValues.moo),
    building: normalizeText(normalizedValues.building),
    soi: normalizeText(normalizedValues.soi),
    road: normalizeText(normalizedValues.road),
    province_code: normalizeText(normalizedValues.province_code),
    district_code: normalizeText(normalizedValues.district_code),
    subdistrict_code: normalizeText(normalizedValues.subdistrict_code),
    province: normalizeText(normalizedValues.province),
    district: normalizeText(normalizedValues.district),
    subdistrict: normalizeText(normalizedValues.subdistrict),
    postal_code: normalizeText(normalizedValues.postal_code),
    created_at:
      mode === 'create'
        ? now
        : normalizeText(normalizedValues.created_at) || normalizeText(source.created_at) || now,
    updated_at: mode === 'update' ? now : undefined,
  }
}

async function updateFamilyData(groupIndex: number, values?: Record<string, any>) {
  const currentMember = familyData.value[groupIndex]
  const personId = getPersonId()

  loading.value = true

  try {
    if (!personId) {
      toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
        position: 'bottom-right',
      })
      return
    }

    const source = {
      ...(currentMember || {}),
      person_id: currentMember?.person_id || personId,
    }

    if (currentMember?.id) {
      const payload = buildFamilyPayload(source, values, 'update')
      await updateFamilyMember(currentMember.id, payload)
      familyData.value[groupIndex] = mapFamilyMemberForForm({
        ...currentMember,
        ...payload,
      })
      setFamilyFieldsAt(groupIndex, familyData.value[groupIndex])
    } else {
      const payload = buildFamilyPayload(source, values, 'create')
      await createFamilyMember(payload)
      await getFamilyData()
    }

    toast.success('บันทึกข้อมูลครอบครัวสำเร็จ', {
      position: 'bottom-right',
    })
  } catch (error: any) {
    console.error('Family API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`อัปเดตข้อมูลครอบครัวไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } finally {
    loading.value = false
  }
}

function updateData(confirmed: boolean) {
  if (confirmed && pendingGroupIndex.value !== null) {
    void updateFamilyData(pendingGroupIndex.value, pendingValues.value)
  }
  pendingGroupIndex.value = null
  pendingValues.value = {}
  confirmModal.value = false
}

function handleChange(groupIndex: number, values?: Record<string, any>) {
  syncFamilyAddress(groupIndex, values)
}

function handleSave(groupIndex: number, values?: Record<string, any>) {
  syncFamilyAddress(groupIndex, values)
  pendingGroupIndex.value = groupIndex
  pendingValues.value = values || {}
  action.value = familyData.value[groupIndex]?.id ? 'update' : 'create'
  modalValue.value =
    [familyData.value[groupIndex]?.first_name_th, familyData.value[groupIndex]?.last_name_th]
      .filter(Boolean)
      .join(' ') || familyData.value[groupIndex]?.relation_type || ''
  confirmModal.value = true
}

onMounted(() => {
  getPersonId()
  void getFamilyData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    <p v-if="loading" class="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>

    <CreateForm
      :isDropdown="true"
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
