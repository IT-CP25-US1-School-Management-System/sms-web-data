<script setup lang="ts">
import { Button } from '@/components/ui/button'
import DropDownForm from '@/components/form/DropDownForm.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { MANAGE_DATASETS, MANAGE_DROPDOWN_DATASETS } from '@/lib/constants'
import {
  calAge,
  formatDateInput,
  generateUUID,
  sortDropdownOptionsByThaiLabel,
} from '@/lib/helpers'
import { createDatasetRow, getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import { updateTeacher, useTeacherStore } from '@/stores/teachers'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type RoleRow = {
  id?: number | string
  role_id?: number | string
  roles_id?: number | string
  role_name_th?: string
  roles_name_th?: string
  name_th?: string
  name?: string
}

const route = useRoute()
const teacherStore = useTeacherStore()

const EMPLOYMENT_DATASET_CONFIG = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_EMPLOYMENT,
  VIEW_NAME: MANAGE_DATASETS.VIEW_EMPLOYMENT,
} as const

const loading = ref(false)
const employmentData = ref<Record<string, any>[]>([])
const initialEmploymentData = ref<Record<string, any>[]>([])
const formRenderKey = ref(0)
const workFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])
const compensationFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])
const contractFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])
const durationFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])
const budgetFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])
const roleLabelById = new Map<string, string>()
const positionOptions = ref<{ label: string; value: string }[]>([])

function getPersonId() {
  const routeId = route.query.id
  if (typeof routeId === 'string' && routeId.trim()) return routeId
  if (teacherStore.personId) return teacherStore.personId
  return undefined
}

function resolvePositionLabel(roleId?: string | number | null, fallback?: string) {
  const normalizedRoleId = roleId !== undefined && roleId !== null ? String(roleId).trim() : ''
  if (normalizedRoleId && roleLabelById.has(normalizedRoleId)) {
    return roleLabelById.get(normalizedRoleId) || ''
  }
  return fallback || ''
}

function resolveRoleId(value?: string | number | null) {
  const normalizedValue = value !== undefined && value !== null ? String(value).trim() : ''
  if (!normalizedValue) return ''

  if (roleLabelById.has(normalizedValue)) return normalizedValue

  const matchedOption = positionOptions.value.find(
    (option) => option.value === normalizedValue || option.label === normalizedValue,
  )

  return matchedOption?.value || ''
}

const displayEmploymentData = computed(() => {
  if (employmentData.value.length) return employmentData.value

  const teacherData =
    teacherStore.currentTeacher && typeof teacherStore.currentTeacher === 'object'
      ? teacherStore.currentTeacher
      : undefined

  return [
    withCalculatedEmploymentAges({
      id: 'empty-employment',
      person_id: getPersonId() || teacherData?.id || '',
      position:
        teacherData?.role_id !== undefined && teacherData?.role_id !== null
          ? String(teacherData.role_id)
          : '',
      created_at: new Date().toISOString(),
    }),
  ]
})

const hasChanges = computed(
  () => JSON.stringify(employmentData.value) !== JSON.stringify(initialEmploymentData.value),
)

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function mapRoleOptions(rows: RoleRow[]) {
  const options = rows
    .map((row) => {
      const roleId = [row.id, row.role_id, row.roles_id].find(
        (candidate) => candidate !== undefined,
      )
      const label = [row.role_name_th, row.roles_name_th, row.name_th, row.name].find((candidate) =>
        Boolean(candidate),
      )

      if (roleId === undefined || !label) return null

      return {
        id: String(roleId),
        label: String(label),
      }
    })
    .filter((item): item is { id: string; label: string } => Boolean(item))

  return sortDropdownOptionsByThaiLabel(options)
}

function normalizeDateForPayload(value?: string | Date | null) {
  return formatDateInput(value) || null
}

function calculateYearsFromDate(value?: string | Date | null) {
  const date = formatDateInput(value)
  return date ? String(calAge(date)) : ''
}

function withCalculatedEmploymentAges(values: Record<string, any>): Record<string, any> {
  return {
    ...values,
    'total-work-years': calculateYearsFromDate(values.first_contract_start),
  }
}

function hasEmploymentContent(values: Record<string, any>) {
  return Object.entries(values).some(([key, value]) => {
    if (['id', 'person_id', 'created_at', 'updated_at', 'total-work-years'].includes(key)) {
      return false
    }
    if (value === undefined || value === null) return false
    return String(value).trim() !== ''
  })
}

function buildEmploymentPayload(values: Record<string, any>, personId: string) {
  const payloadValues = { ...values }
  delete payloadValues['total-work-years']

  return {
    ...payloadValues,
    id: values.id && values.id !== 'empty-employment' ? values.id : generateUUID(),
    person_id: values.person_id || personId,
    position: resolvePositionLabel(values.position, values.position),
    social_security:
      values.social_security !== undefined &&
      values.social_security !== null &&
      String(values.social_security).trim() !== ''
        ? String(values.social_security).trim()
        : undefined,
    first_contract_start: normalizeDateForPayload(values.first_contract_start),
    period_start: normalizeDateForPayload(values.period_start),
    period_end: normalizeDateForPayload(values.period_end),
    created_at: values.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function buildPersonDataPayload(source: Record<string, any> | undefined, payload: Record<string, any>) {
  const storePersonData =
    teacherStore.currentTeacher && typeof teacherStore.currentTeacher === 'object'
      ? teacherStore.currentTeacher
      : {}
  const sourcePersonData =
    source?.person_data && typeof source.person_data === 'object' ? source.person_data : {}
  const personData = {
    ...storePersonData,
    ...sourcePersonData,
  }
  const resolvedPersonId =
    personData.id ?? source?.person_id ?? payload.person_id ?? getPersonId() ?? undefined
  const resolvedCreatedAt =
    personData.created_at ?? payload.created_at ?? source?.created_at ?? new Date().toISOString()

  return {
    ...personData,
    id: resolvedPersonId,
    created_at: resolvedCreatedAt,
    updated_at: new Date().toISOString(),
    role_id: resolveRoleId(payload.position) || undefined,
  }
}

function handleSectionChange(
  index: number,
  payload: { values: Record<string, any>; isDirty: boolean },
) {
  const current = employmentData.value[index] || {}
  const nextValues = withCalculatedEmploymentAges({
    ...current,
    ...payload.values,
  })

  if (
    'first_contract_start' in payload.values &&
    current['total-work-years'] !== nextValues['total-work-years']
  ) {
    durationFormRefs.value[index]?.setFieldValue?.(
      'total-work-years',
      nextValues['total-work-years'],
    )
  }

  employmentData.value[index] = nextValues
}

function formatEmploymentRecord(record: Record<string, any>) {
  const personData =
    record.person_data && typeof record.person_data === 'object' ? record.person_data : undefined
  const resolvedPosition = resolvePositionLabel(
    personData?.role_id,
    personData?.roles?.roles_name || personData?.roles?.roles_name_th || record.position || '',
  )

  return withCalculatedEmploymentAges({
    ...record,
    position: resolveRoleId(personData?.role_id || record.position),
    position_label: resolvedPosition,
    first_contract_start: formatDateInput(record.first_contract_start),
    period_start: formatDateInput(record.period_start),
    period_end: formatDateInput(record.period_end),
  })
}

async function fetchRoleLabels() {
  try {
    for (const viewName of ['roles', 'role']) {
      const response = await getDatasetRows<RoleRow>(
        MANAGE_DROPDOWN_DATASETS.DATASET_ID,
        MANAGE_DROPDOWN_DATASETS.DATASET_VERSION_ROLES,
        {
          view: viewName,
          page: 1,
          per_page: 100,
        },
      )

      const mappedRoles = mapRoleOptions(response.data || [])
      if (mappedRoles.length > 0) {
        roleLabelById.clear()
        mappedRoles.forEach((role) => {
          roleLabelById.set(role.id, role.label)
        })
        positionOptions.value = mappedRoles.map((role) => ({
          label: role.label,
          value: role.id,
        }))
        formRenderKey.value += 1
        return
      }
    }
  } catch (error) {
    console.error('Failed to load employment role labels:', error)
  }
}

async function getEmploymentData() {
  loading.value = true
  try {
    const personId = getPersonId()
    if (!personId) {
      employmentData.value = []
      formRenderKey.value += 1
      return
    }

    const response = await getDatasetRows<Record<string, any>>(
      EMPLOYMENT_DATASET_CONFIG.DATASET_ID,
      EMPLOYMENT_DATASET_CONFIG.DATASET_VERSION,
      {
        view: EMPLOYMENT_DATASET_CONFIG.VIEW_NAME,
        page: 1,
        per_page: 50,
        where: [
          [
            {
              table_name: 'employment_contracts',
              field: 'person_id',
              operator: '=',
              value: personId,
            },
          ],
        ],
      },
    )

    employmentData.value = (response.data || []).map((record) => formatEmploymentRecord(record))
    initialEmploymentData.value = cloneData(employmentData.value)
    workFormRefs.value = employmentData.value.map(() => null)
    compensationFormRefs.value = employmentData.value.map(() => null)
    contractFormRefs.value = employmentData.value.map(() => null)
    durationFormRefs.value = employmentData.value.map(() => null)
    budgetFormRefs.value = employmentData.value.map(() => null)
    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Employment API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(
      `โหลดข้อมูลการจ้างงานไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  } finally {
    loading.value = false
  }
}

async function persistEmploymentData() {
  const personId = getPersonId()
  if (!personId) {
    toast.error('ไม่พบ ID ของบุคลากร', {
      position: 'bottom-right',
    })
    return
  }

  const recordsToPersist = displayEmploymentData.value.filter(
    (record) => hasEmploymentContent(record) || (record.id && record.id !== 'empty-employment'),
  )

  for (const record of recordsToPersist) {
    const payload = buildEmploymentPayload(record, personId)
    const personPayload = buildPersonDataPayload(record, payload)

    if (record.id && record.id !== 'empty-employment') {
      await updateDatasetRow(
        EMPLOYMENT_DATASET_CONFIG.DATASET_ID,
        EMPLOYMENT_DATASET_CONFIG.DATASET_VERSION,
        String(record.id),
        payload,
        EMPLOYMENT_DATASET_CONFIG.VIEW_NAME,
      )
      await updateTeacher(personId, personPayload)
      teacherStore.setCurrentTeacher({
        ...(teacherStore.currentTeacher || {}),
        ...personPayload,
        id: personId,
      })
      continue
    }

    await createDatasetRow(
      EMPLOYMENT_DATASET_CONFIG.DATASET_ID,
      EMPLOYMENT_DATASET_CONFIG.DATASET_VERSION,
      payload,
      EMPLOYMENT_DATASET_CONFIG.VIEW_NAME,
    )
    await updateTeacher(personId, personPayload)
    teacherStore.setCurrentTeacher({
      ...(teacherStore.currentTeacher || {}),
      ...personPayload,
      id: personId,
    })
  }
}

async function onSaveAll() {
  const validations = await Promise.all([
    ...workFormRefs.value.map((form) => form?.validateForm?.() ?? true),
    ...compensationFormRefs.value.map((form) => form?.validateForm?.() ?? true),
    ...contractFormRefs.value.map((form) => form?.validateForm?.() ?? true),
    ...durationFormRefs.value.map((form) => form?.validateForm?.() ?? true),
    ...budgetFormRefs.value.map((form) => form?.validateForm?.() ?? true),
  ])

  if (validations.some((result) => result === false)) return

  loading.value = true
  try {
    await persistEmploymentData()
    toast.success('บันทึกข้อมูลการจ้างงานสำเร็จ', {
      position: 'bottom-right',
    })
    await getEmploymentData()
  } catch (error: any) {
    console.error('Employment Save Error:', error)
    toast.error(
      `บันทึกข้อมูลการจ้างงานไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchRoleLabels()
  getEmploymentData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div
    v-else
    v-for="(item, index) in displayEmploymentData"
    :key="`${formRenderKey}-${item.id}`"
    class="mx-6 flex flex-col gap-4"
  >
    <DropDownForm
      :ref="
        (instance) => (workFormRefs[index] = instance as InstanceType<typeof DropDownForm> | null)
      "
      topic="ข้อมูลการทำงาน"
      :values="item"
      @change="(payload) => handleSectionChange(index, payload)"
      :fields="[
        {
          name: 'position',
          label: 'ตำแหน่ง',
          type: 'select',
          required: true,
          placeholder: 'ระบบกำหนดจากข้อมูลบุคลากร',
          disabled: false,
          options: positionOptions,
        },
        {
          name: 'work_status',
          label: 'สถานะการทำงาน',
          type: 'select',
          required: true,
          placeholder: 'เลือกสถานะการทำงาน',
          options: [
            { label: 'ทำงาน', value: 'ทำงาน' },
            { label: 'ย้าย', value: 'ย้าย' },
            { label: 'เกษียณอายุราชการ', value: 'เกษียณอายุราชการ' },
            { label: 'ช่วยราชการ', value: 'ช่วยราชการ' },
            { label: 'ลาออก', value: 'ลาออก' },
            { label: 'เสียชีวิต', value: 'เสียชีวิต' },
          ],
        },
        {
          name: 'hiring_nature',
          label: 'ลักษณะการจ้าง',
          type: 'select',
          required: true,
          placeholder: 'เช่น จ้างชั่วคราว',
          options: [
            { label: 'จ้างใหม่', value: 'จ้างใหม่' },
            { label: 'ต่อเนื่อง', value: 'ต่อเนื่อง' },
          ],
        },
        {
          name: 'contract_action',
          label: 'ประเภทการเคลื่อนไหวล่าสุด',
          type: 'select',
          placeholder: 'เลือกประเภทการเคลื่อนไหว',

          options: [
            { label: 'การต่อสัญญา', value: 'การต่อสัญญา' },
            { label: 'ทำสัญญาครั้งแรก', value: 'ทำสัญญาครั้งแรก' },
          ],
        },
      ]"
    />

    <DropDownForm
      :ref="
        (instance) =>
          (compensationFormRefs[index] = instance as InstanceType<typeof DropDownForm> | null)
      "
      topic="ข้อมูลค่าตอบแทนและสิทธิประโยชน์"
      :values="item"
      @change="(payload) => handleSectionChange(index, payload)"
      :fields="[
        {
          name: 'salary',
          label: 'เงินค่าจ้าง',
          type: 'number',
          required: false,
          placeholder: 'เช่น 15000',
        },
        {
          name: 'social_security',
          label: 'เงินสมทบกองทุนประกันสังคม',
          type: 'select',
          required: true,
          placeholder: 'เลือกมาตราประกันสังคม',
          options: [
            { label: 'มาตรา 33', value: 'มาตรา 33' },
            { label: 'มาตรา 39', value: 'มาตรา 39' },
            { label: 'มาตรา 40', value: 'มาตรา 40' },
            { label: 'อื่นๆ', value: 'อื่นๆ' },
          ],
        },
      ]"
    />

    <DropDownForm
      :ref="
        (instance) =>
          (contractFormRefs[index] = instance as InstanceType<typeof DropDownForm> | null)
      "
      topic="ข้อมูลสัญญาจ้างและเอกสารจ้างจริง"
      :values="item"
      @change="(payload) => handleSectionChange(index, payload)"
      :fields="[
        {
          name: 'order_no',
          label: 'เลขที่คำสั่ง / สัญญาจ้าง',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเลขที่คำสั่งหรือสัญญาจ้าง',
        },
        {
          name: 'contract-count',
          label: 'จำนวนครั้งที่ทำสัญญา',
          type: 'text',
          required: true,
          placeholder: 'เช่น 1',
        },
      ]"
    />

    <DropDownForm
      :ref="
        (instance) =>
          (durationFormRefs[index] = instance as InstanceType<typeof DropDownForm> | null)
      "
      topic="ข้อมูลระยะเวลาในการจ้างงาน"
      :values="item"
      @change="(payload) => handleSectionChange(index, payload)"
      :fields="[
        {
          name: 'first_contract_start',
          label: 'ว/ด/ป เริ่มสัญญาครั้งแรก',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'total-work-years',
          label: 'จ้างมาแล้วกี่ปี (อายุงานรวม)',
          type: 'text',
          disabled: true,
          placeholder: 'เช่น 3 ปี',
        },
        {
          name: 'period_start',
          label: 'วันเดือนปีที่เริ่มสัญญาจ้าง (สัญญาปัจจุบัน)',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'period_end',
          label: 'วันเดือนปีสิ้นสุดสัญญาจ้าง',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
      ]"
    />

    <DropDownForm
      :ref="
        (instance) => (budgetFormRefs[index] = instance as InstanceType<typeof DropDownForm> | null)
      "
      topic="ข้อมูลแหล่งงบประมาณที่ใช้จ้าง"
      :values="item"
      @change="(payload) => handleSectionChange(index, payload)"
      :fields="[
        {
          name: 'budget_type',
          label: 'ประเภทเงินงบประมาณ',
          type: 'select',
          required: true,
          placeholder: 'เลือกประเภทเงินงบประมาณ',

          options: [
            { label: 'เงินงบประมาณ', value: 'เงินงบประมาณ' },
            { label: 'เงินนอกงบประมาณ', value: 'เงินนอกงบประมาณ' },
            { label: 'เงินรายได้สถานศึกษา', value: 'เงินรายได้สถานศึกษา' },
            { label: 'เงินอุดหนุนค่าใช้จ่ายรายหัว', value: 'เงินอุดหนุนค่าใช้จ่ายรายหัว' },
          ],
        },
        {
          name: 'school_revenue_type',
          label: 'ประเภทเงินรายได้สถานศึกษา',
          type: 'select',
          required: true,
          placeholder: 'เลือกประเภทเงินรายได้สถานศึกษา',

          options: [
            {
              label: 'ลูกจ้างชั่วคราว (มีประกันสังคม)',
              value: 'ลูกจ้างชั่วคราว (มีประกันสังคม)',
            },
            {
              label: 'เหมาบริการ (ไม่มีประกันสังคม)',
              value: 'เหมาบริการ(ไม่มีประกันสังคม)',
            },
            {
              label: 'เหมาบริการ (ประกันตนเอง)',
              value: 'เหมาบริการ (ประกันตนเอง)',
            },
          ],
        },
      ]"
    />
  </div>

  <div
    v-if="!loading"
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      :disabled="!hasChanges"
      @click="onSaveAll"
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
    >
      บันทึก
    </Button>
  </div>
</template>
