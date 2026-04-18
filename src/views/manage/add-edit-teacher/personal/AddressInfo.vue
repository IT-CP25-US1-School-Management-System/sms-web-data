<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import provincesJson from '@/assets/thai-province-data/provinces.json'
import districtsJson from '@/assets/thai-province-data/districts.json'
import subDistrictsJson from '@/assets/thai-province-data/sub_districts.json'
import { generateUUID } from '@/lib/helpers'
import {
  createPersonAddress,
  getAddressById,
  updatePersonAddress,
  useTeacherStore,
} from '@/stores/teachers'
import type { PersonAddressCreateDTO } from '@/types/teacher'
import type { District, PersonAddress, Province, SubDistrict } from '@/types/address'
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
    | 'checkbox'
    | 'checkbox-group'
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
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const addressData = ref<Record<string, any>[]>([])
const addressFields = ref<CreateFormSection[][]>([])

const provinceData = provincesJson as Province[]
const districtData = districtsJson as District[]
const subDistrictData = subDistrictsJson as SubDistrict[]

const provinceOptions = provinceData.map((province) => ({
  label: province.name_th,
  value: String(province.id),
}))

const provinceNameMap = new Map(
  provinceOptions.map((option) => [String(option.value), option.label]),
)
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

const addressTypeOptions = [
  { label: 'ที่อยู่ตามทะเบียนบ้าน', value: 'is_house_registered' },
  { label: 'ที่อยู่ปัจจุบัน', value: 'is_current' },
  { label: 'ที่อยู่หลังเกษียณอายุราชการ', value: 'is_retired_residence' },
]

function getPersonId() {
  const idFromUrl = route.query.id as string | undefined
  const personId = idFromUrl || teacherStore.personId

  if (idFromUrl && teacherStore.personId !== idFromUrl) {
    teacherStore.setPersonId(idFromUrl)
  }

  return personId
}

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

function mapAddressForForm(address: Partial<PersonAddress>) {
  return {
    ...address,
    address_types: [
      ...(address.is_house_registered ? ['is_house_registered'] : []),
      ...(address.is_current ? ['is_current'] : []),
      ...(address.is_retired_residence ? ['is_retired_residence'] : []),
    ],
    province_code: address.province_code ? String(address.province_code) : '',
    district_code: address.district_code ? String(address.district_code) : '',
    subdistrict_code: address.subdistrict_code ? String(address.subdistrict_code) : '',
    postal_code: address.postal_code || '',
    house_no: address.house_no || '',
    house_registry_no: address.house_registry_no || '',
    moo: address.moo || '',
    soi: address.soi || '',
    road: address.road || '',
    building: address.building || '',
  }
}

function createAddressFields(values: Record<string, any>): CreateFormSection[] {
  return [
    {
      topic: 'ประเภทที่อยู่',
      content: [
        {
          name: 'address_types',
          label: 'ประเภทที่อยู่',
          type: 'checkbox-group',
          required: true,
          options: cloneOptions(addressTypeOptions),
        },
      ],
    },
    {
      topic: 'ข้อมูลที่อยู่',
      content: [
        {
          name: 'province_code',
          label: 'จังหวัด',
          type: 'combobox',
          required: true,
          options: cloneOptions(provinceOptions),
          placeholder: 'ค้นหาจังหวัด',
        },
        {
          name: 'district_code',
          label: 'อำเภอ/เขต',
          type: 'combobox',
          required: true,
          options: getDistrictOptions(values.province_code),
          placeholder: 'ค้นหาอำเภอ/เขต',
          disabled: !values.province_code,
        },
        {
          name: 'subdistrict_code',
          label: 'ตำบล/แขวง',
          type: 'combobox',
          required: true,
          options: getSubDistrictOptions(values.district_code),
          placeholder: 'ค้นหาตำบล/แขวง',
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
          name: 'house_no',
          label: 'บ้านเลขที่',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุบ้านเลขที่',
        },
        {
          name: 'house_registry_no',
          label: 'รหัสทะเบียนบ้าน',
          type: 'text',
          placeholder: 'กรุณาระบุรหัสทะเบียนบ้าน',
        },
        {
          name: 'moo',
          label: 'หมู่ที่',
          type: 'text',
          placeholder: 'กรุณาระบุหมู่ที่',
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
          placeholder: 'กรุณาระบุหมู่บ้าน/อาคาร',
        },
      ],
    },
  ]
}

function setAddressFieldsAt(index: number, values: Record<string, any>) {
  const nextFields = [...addressFields.value]
  nextFields[index] = createAddressFields(values)
  addressFields.value = nextFields
}

function handleAddressChange(index: number, values: Record<string, any>) {
  const previous = addressData.value[index] || {}
  const nextValues = {
    ...previous,
    ...values,
  }

  const provinceChanged =
    String(nextValues.province_code || '') !== String(previous.province_code || '')
  const districtChanged =
    String(nextValues.district_code || '') !== String(previous.district_code || '')
  const subDistrictChanged =
    String(nextValues.subdistrict_code || '') !== String(previous.subdistrict_code || '')

  if (!provinceChanged && !districtChanged && !subDistrictChanged && addressFields.value[index]) {
    return
  }

  if (provinceChanged) {
    nextValues.district_code = ''
    nextValues.subdistrict_code = ''
    nextValues.postal_code = ''
  } else if (districtChanged) {
    nextValues.subdistrict_code = ''
    nextValues.postal_code = ''
  }

  const subDistrictCode = String(nextValues.subdistrict_code || '')
  if (subDistrictCode) {
    nextValues.postal_code =
      postalCodeBySubDistrict.get(subDistrictCode) || nextValues.postal_code || ''
  }

  const nextAddressData = [...addressData.value]
  nextAddressData[index] = nextValues
  addressData.value = nextAddressData

  if (provinceChanged || districtChanged || !addressFields.value[index]) {
    setAddressFieldsAt(index, nextValues)
  }
}

function normalizeAddressPayload(
  currentAddress: Record<string, any>,
  values?: Record<string, any>,
): Record<string, any> {
  const mergedValues = {
    ...currentAddress,
    ...values,
  }

  const provinceCode = String(mergedValues.province_code || '')
  const districtCode = String(mergedValues.district_code || '')
  const subDistrictCode = String(mergedValues.subdistrict_code || '')
  const selectedTypes = new Set<string>(
    Array.isArray(mergedValues.address_types) ? mergedValues.address_types : [],
  )

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
    is_house_registered: selectedTypes.has('is_house_registered'),
    is_current: selectedTypes.has('is_current'),
    is_retired_residence: selectedTypes.has('is_retired_residence'),
  }
}

function buildAddressPayload(
  source: Record<string, any>,
  values?: Record<string, any>,
  mode: 'create' | 'update' = 'update',
): PersonAddressCreateDTO {
  const normalizedValues = normalizeAddressPayload(source, values)
  const now = new Date().toISOString()
  const id = String(normalizedValues.id || source.id || generateUUID())

  return {
    ...source,
    ...values,
    id,
    person_id: String(normalizedValues.person_id || ''),
    house_registry_no: normalizeText(normalizedValues.house_registry_no),
    house_no: normalizeText(normalizedValues.house_no),
    moo: normalizeText(normalizedValues.moo),
    building: normalizeText(normalizedValues.building),
    soi: normalizeText(normalizedValues.soi),
    road: normalizeText(normalizedValues.road),
    subdistrict_code: normalizeText(normalizedValues.subdistrict_code),
    subdistrict: normalizeText(normalizedValues.subdistrict),
    district_code: normalizeText(normalizedValues.district_code),
    district: normalizeText(normalizedValues.district),
    province_code: normalizeText(normalizedValues.province_code),
    province: normalizeText(normalizedValues.province),
    postal_code: normalizeText(normalizedValues.postal_code),
    is_house_registered: Boolean(normalizedValues.is_house_registered),
    is_current: Boolean(normalizedValues.is_current),
    is_retired_residence: Boolean(normalizedValues.is_retired_residence),
    created_at:
      mode === 'create'
        ? now
        : normalizeText(normalizedValues.created_at) || normalizeText(source.created_at) || now,
    updated_at: now,
  }
}

async function getAddressData() {
  loading.value = true
  try {
    const personId = getPersonId()

    if (!personId) {
      addressData.value = []
      addressFields.value = [createAddressFields({})]
      toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
        position: 'bottom-right',
      })
      return
    }

    const response = await getAddressById(personId)
    addressData.value = (response.data?.person_addresses || []).map((address: PersonAddress) =>
      mapAddressForForm(address),
    )
    addressFields.value = addressData.value.length
      ? addressData.value.map((address) => createAddressFields(address))
      : [createAddressFields({})]
  } catch (error: any) {
    console.error('Address API Error:', error)
    toast.error(`โหลดข้อมูลที่อยู่ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    addressData.value = []
    addressFields.value = [createAddressFields({})]
  } finally {
    loading.value = false
  }
}

async function updateAddressData(index: number, values?: Record<string, any>) {
  const currentAddress = addressData.value[index] || {}
  const personId = getPersonId()

  if (!personId) {
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
      position: 'bottom-right',
    })
    return
  }

  const source = {
    ...currentAddress,
    person_id: currentAddress.person_id || personId,
  }
  const mode = currentAddress.id ? 'update' : 'create'
  const payload = buildAddressPayload(source, values, mode)

  if (currentAddress.id) {
    await updatePersonAddress(currentAddress.id, payload)
  } else {
    await createPersonAddress(payload)
  }

  await getAddressData()
  toast.success('บันทึกข้อมูลที่อยู่เรียบร้อย', {
    position: 'bottom-right',
  })
}

async function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return

  busyEntries.value = {
    ...busyEntries.value,
    [index]: 'save',
  }

  try {
    await updateAddressData(index, values)
  } catch (error: any) {
    console.error('Address save error:', error)
    toast.error(
      `บันทึกข้อมูลที่อยู่ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  } finally {
    const { [index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

onMounted(() => {
  getAddressData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div v-else class="mx-6 flex flex-col gap-4 pb-6">
    <CreateForm
      :busyEntries="busyEntries"
      :values="addressData"
      :fields="addressFields"
      :deferCommitOnSave="true"
      @change="handleAddressChange"
      @save="handleSave"
    />
  </div>
</template>
