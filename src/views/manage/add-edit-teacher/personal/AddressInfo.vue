<script setup lang="ts">
import NormalForm, {
  type NormalFormField,
  type NormalFormChangePayload,
  type NormalFormOption,
} from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
import {
  createPersonAddress,
  getAddressById,
  updatePersonAddress,
  useTeacherStore,
} from '@/stores/teachers'
import type { PersonAddress, Province, District, SubDistrict } from '@/types/address'
import type { PersonAddressCreateDTO } from '@/types/teacher'
import provincesJson from '@/assets/thai-province-data/provinces.json'
import districtsJson from '@/assets/thai-province-data/districts.json'
import subDistrictsJson from '@/assets/thai-province-data/sub_districts.json'
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type NormalFormInstance = InstanceType<typeof NormalForm>

type AddressFormState = {
  id: string
  recordId: string | null
  createdAt?: string
  updatedAt?: string
  fields: NormalFormField[]
  initialValues: Record<string, any>
  currentValues: Record<string, any>
  formRef: NormalFormInstance | null
  hasChanges: boolean
  lastProvince?: string
  lastDistrict?: string
}
const route = useRoute()
const teacherStore = useTeacherStore()
const isSubmitting = ref(false)

onMounted(() => {
  const idFromUrl = route.query.id as string
  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }
  getAddressData()
})
const loading = ref(false)
const addressForms = ref<AddressFormState[]>([])

const provinceData = provincesJson as Province[]
const districtData = districtsJson as District[]
const subDistrictData = subDistrictsJson as SubDistrict[]

const provinceOptions: NormalFormOption[] = provinceData.map((province) => ({
  label: province.name_th,
  value: String(province.id),
}))

const provinceNameMap = new Map(provinceOptions.map((opt) => [opt.value, opt.label]))

const districtOptionsByProvince = new Map<string, NormalFormOption[]>()
const districtNameMap = new Map<string, string>()
districtData.forEach((district) => {
  const option: NormalFormOption = { label: district.name_th, value: String(district.id) }
  const provinceId = String(district.province_id)
  if (!districtOptionsByProvince.has(provinceId)) {
    districtOptionsByProvince.set(provinceId, [])
  }
  districtOptionsByProvince.get(provinceId)!.push(option)
  districtNameMap.set(option.value, option.label)
})

const subDistrictOptionsByDistrict = new Map<string, NormalFormOption[]>()
const subDistrictNameMap = new Map<string, string>()
const postalCodeBySubDistrict = new Map<string, string>()

subDistrictData.forEach((subDistrict) => {
  const option: NormalFormOption = { label: subDistrict.name_th, value: String(subDistrict.id) }
  const districtId = String(subDistrict.district_id)
  if (!subDistrictOptionsByDistrict.has(districtId)) {
    subDistrictOptionsByDistrict.set(districtId, [])
  }
  subDistrictOptionsByDistrict.get(districtId)!.push(option)
  subDistrictNameMap.set(option.value, option.label)
  if (subDistrict.zip_code) {
    postalCodeBySubDistrict.set(option.value, String(subDistrict.zip_code))
  }
})

const addressTypeOptions: NormalFormOption[] = [
  { label: 'ที่อยู่ตามทะเบียนบ้าน', value: 'is_house_registered' },
  { label: 'ที่อยู่ปัจจุบัน', value: 'is_current' },
  { label: 'ที่อยู่หลังเกษียณอายุราชการ', value: 'is_retired_residence' },
]

const pendingPayloads = new Map<string, Record<string, any>>()

function cloneFormValues(values: Record<string, any>) {
  return JSON.parse(JSON.stringify(values))
}

function buildAddressValues(source?: PersonAddress) {
  return {
    address_types: [
      ...(source?.is_house_registered ? ['is_house_registered'] : []),
      ...(source?.is_current ? ['is_current'] : []),
      ...(source?.is_retired_residence ? ['is_retired_residence'] : []),
    ],
    province_code: source?.province_code || '',
    district_code: source?.district_code || '',
    subdistrict_code: source?.subdistrict_code || '',
    postal_code: source?.postal_code || '',
    house_no: source?.house_no || '',
    house_registry_no: source?.house_registry_no || '',
    moo: source?.moo || '',
    soi: source?.soi || '',
    road: source?.road || '',
    building: source?.building || '',
  }
}

function cloneOptions(options?: NormalFormOption[]) {
  return (options || []).map((opt) => ({ ...opt }))
}

function getDistrictOptions(provinceCode?: string) {
  return cloneOptions(districtOptionsByProvince.get(String(provinceCode)) || [])
}

function getSubDistrictOptions(districtCode?: string) {
  return cloneOptions(subDistrictOptionsByDistrict.get(String(districtCode)) || [])
}

function createAddressFields(values: Record<string, any>) {
  return reactive<NormalFormField[]>([
    {
      name: 'address_types',
      label: 'ประเภทที่อยู่',
      type: 'checkbox-group',
      required: true,
      options: cloneOptions(addressTypeOptions),
    },
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
  ])
}

function createAddressFormState(source?: PersonAddress, index = 0) {
  const initialValues = buildAddressValues(source)
  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `address-${Date.now()}-${index}`
  const state = reactive<AddressFormState>({
    id: source?.id || generatedId,
    recordId: source?.id || null,
    createdAt: source?.created_at || undefined,
    updatedAt: source?.updated_at || undefined,
    fields: createAddressFields(initialValues),
    initialValues: cloneFormValues(initialValues),
    currentValues: cloneFormValues(initialValues),
    formRef: null,
    hasChanges: false,
    lastProvince: initialValues.province_code,
    lastDistrict: initialValues.district_code,
  })
  syncCascade(state, initialValues, true)
  return state
}

function syncCascade(form: AddressFormState, values: Record<string, any>, isInitial = false) {
  const districtField = form.fields.find((field) => field.name === 'district_code')
  if (districtField) {
    districtField.options = getDistrictOptions(values.province_code)
    districtField.disabled = !values.province_code
  }

  const subDistrictField = form.fields.find((field) => field.name === 'subdistrict_code')
  if (subDistrictField) {
    subDistrictField.options = getSubDistrictOptions(values.district_code)
    subDistrictField.disabled = !values.district_code
  }

  if (!isInitial && form.formRef) {
    if (form.lastProvince !== values.province_code) {
      form.lastProvince = values.province_code
      form.formRef.setFieldValue?.('district_code', '')
      form.formRef.setFieldValue?.('subdistrict_code', '')
    }
    if (form.lastDistrict !== values.district_code) {
      form.lastDistrict = values.district_code
      form.formRef.setFieldValue?.('subdistrict_code', '')
    }
  } else {
    form.lastProvince = values.province_code
    form.lastDistrict = values.district_code
  }

  const subdistrictCode = values.subdistrict_code
  const autoPostal = subdistrictCode
    ? postalCodeBySubDistrict.get(String(subdistrictCode))
    : undefined

  if (autoPostal) {
    if (isInitial) {
      form.initialValues.postal_code = autoPostal
    } else {
      form.formRef?.setFieldValue?.('postal_code', autoPostal)
    }
  }
}

async function getAddressData() {
  loading.value = true
  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId

  if (!personId) {
    addressForms.value = [createAddressFormState(undefined, 0)]
    loading.value = false
    return
  }

  try {
    const response = await getAddressById(personId)
    const records = response.data?.person_addresses || []
    addressForms.value = (records.length ? records : [undefined]).map((address, index) =>
      createAddressFormState(address, index),
    )
  } catch (error: any) {
    console.error('Address API Error:', error)
    toast.error(`โหลดข้อมูลที่อยู่ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
    addressForms.value = [createAddressFormState(undefined, 0)]
  } finally {
    loading.value = false
  }
}

function setFormRef(formId: string, instance: NormalFormInstance | null) {
  const target = addressForms.value.find((entry) => entry.id === formId)
  if (target) {
    target.formRef = instance
  }
}

function handleFormChange(formId: string, payload: NormalFormChangePayload) {
  const target = addressForms.value.find((entry) => entry.id === formId)
  if (!target) return
  target.currentValues = cloneFormValues(payload.values)
  target.hasChanges = JSON.stringify(target.currentValues) !== JSON.stringify(target.initialValues)
  syncCascade(target, payload.values)
}

function normalizeAddressPayload(values: Record<string, any>) {
  const selectedTypes = new Set<string>(values.address_types || [])
  const provinceName = provinceNameMap.get(String(values.province_code)) || ''
  const districtName = districtNameMap.get(String(values.district_code)) || ''
  const subDistrictName = subDistrictNameMap.get(String(values.subdistrict_code)) || ''
  const postal =
    values.postal_code || postalCodeBySubDistrict.get(String(values.subdistrict_code)) || ''
  return {
    ...values,
    province: provinceName,
    district: districtName,
    subdistrict: subDistrictName,
    postal_code: postal,
    is_house_registered: selectedTypes.has('is_house_registered'),
    is_current: selectedTypes.has('is_current'),
    is_retired_residence: selectedTypes.has('is_retired_residence'),
  }
}

function handleFormSave(formId: string, values: Record<string, any>) {
  const payload = normalizeAddressPayload(values)
  pendingPayloads.set(formId, payload)
}

function buildAddressRequestPayload(
  normalizedValues: Record<string, any>,
  metadata: {
    addressId: string
    personId: string
    createdAt: string
    updatedAt: string
  },
): PersonAddressCreateDTO {
  const normalizeString = (value: unknown) => {
    const text = String(value ?? '').trim()
    return text || undefined
  }

  return {
    id: metadata.addressId,
    person_id: metadata.personId,
    house_registry_no: normalizeString(normalizedValues.house_registry_no),
    house_no: normalizeString(normalizedValues.house_no),
    moo: normalizeString(normalizedValues.moo),
    building: normalizeString(normalizedValues.building),
    soi: normalizeString(normalizedValues.soi),
    road: normalizeString(normalizedValues.road),
    subdistrict_code: normalizeString(normalizedValues.subdistrict_code),
    subdistrict: normalizeString(normalizedValues.subdistrict),
    district_code: normalizeString(normalizedValues.district_code),
    district: normalizeString(normalizedValues.district),
    province_code: normalizeString(normalizedValues.province_code),
    province: normalizeString(normalizedValues.province),
    postal_code: normalizeString(normalizedValues.postal_code),
    is_house_registered: Boolean(normalizedValues.is_house_registered),
    is_current: Boolean(normalizedValues.is_current),
    is_retired_residence: Boolean(normalizedValues.is_retired_residence),
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt,
  }
}

const hasAnyChanges = computed(() =>
  addressForms.value.some(
    (entry) => JSON.stringify(entry.currentValues) !== JSON.stringify(entry.initialValues),
  ),
)
const hasAnyInvalidRequired = computed(() =>
  addressForms.value.some((entry) => Boolean(entry.formRef?.hasMissingRequiredFields)),
)
const isSaveDisabled = computed(
  () => loading.value || isSubmitting.value || !hasAnyChanges.value || hasAnyInvalidRequired.value,
)

async function onSaveAll() {
  if (isSubmitting.value) return

  const idFromUrl = route.query.id as string
  const personId = idFromUrl || teacherStore.personId
  if (!personId) {
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน')
    return
  }

  pendingPayloads.clear()
  for (const form of addressForms.value) {
    if (form.formRef?.submitForm) {
      const valid = await form.formRef.submitForm()
      if (!valid) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก')
        return
      }
    }
  }

  const changedForms = addressForms.value.filter((form) => form.hasChanges)
  if (!changedForms.length) return

  try {
    isSubmitting.value = true

    for (const form of changedForms) {
      const normalizedPayload = pendingPayloads.get(form.id)
      if (!normalizedPayload) continue

      const now = new Date().toISOString()
      const requestPayload = buildAddressRequestPayload(normalizedPayload, {
        addressId: form.recordId || form.id,
        personId,
        createdAt: form.createdAt || now,
        updatedAt: now,
      })

      if (form.recordId) {
        await updatePersonAddress(form.recordId, requestPayload)
        form.createdAt = requestPayload.created_at
        form.updatedAt = requestPayload.updated_at
      } else {
        const response = await createPersonAddress(requestPayload)
        const createdRecordId =
          typeof (response.data as { id?: unknown } | undefined)?.id === 'string'
            ? ((response.data as { id?: string }).id ?? null)
            : (requestPayload.id ?? null)
        if (createdRecordId) {
          form.recordId = createdRecordId
        }
        form.createdAt = requestPayload.created_at
        form.updatedAt = requestPayload.updated_at
      }
    }

    await getAddressData()
    toast.success('บันทึกข้อมูลที่อยู่เรียบร้อย')
  } catch (error: any) {
    console.error('Address save error:', error)
    toast.error(`บันทึกข้อมูลที่อยู่ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-for="form in addressForms" :key="form.id" class="px-4 sm:px-6">
      <NormalForm
        :topic="`ข้อมูลที่อยู่`"
        :fields="form.fields"
        :values="form.initialValues"
        :ref="(instance) => setFormRef(form.id, instance as NormalFormInstance | null)"
        @change="(payload) => handleFormChange(form.id, payload)"
        @save="(values) => handleFormSave(form.id, values)"
      />
    </div>

    <div
      class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-black"
    >
      <Button
        class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
        :disabled="isSaveDisabled"
        @click="onSaveAll"
      >
        {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
      </Button>
    </div>
  </div>
</template>
