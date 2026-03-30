<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
// toast unused in this component
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RangeCalendar } from '@/components/ui/range-calendar'

import { ChevronUp, CirclePlus, CalendarIcon, Trash2, X  , ArrowDownToLine} from 'lucide-vue-next'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { type DateValue, CalendarDate } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { computed, ref, watch } from 'vue'

// (removed example global form - using per-entry VeeForm instead)

type FieldItem = {
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
  accept?: string // e.g. '.pdf,.jpg,.png' or 'image/*'
  multiple?: boolean
}

type FieldSection = {
  topic?: string
  content: FieldItem[]
  subFields?: FieldItem[] // nested dynamic form within section
}

type ExistingFileItem = {
  name: string
  size: number
  type?: string
  resource_id?: string
  url?: string
  existing?: boolean
}

type UploadedFileItem = File | ExistingFileItem

const props = defineProps<{
  isDropdown?: boolean
  readonly?: boolean
  canDelete?: boolean
  deferCommitOnSave?: boolean
  deferDeleteOnConfirm?: boolean
  busyEntries?: Record<number, 'save' | 'delete'>
  fields?: FieldSection[][]
  values?: Record<string, any>[]
}>()

// Per-entry zod schemas (toTypedSchema) for vee-validate
const schemas = ref<any[]>([])

function buildSchemas() {
  schemas.value = localEntries.value.map((entry) => {
    const shape: Record<string, any> = {}
    entry.forEach((section) => {
      section.content.forEach((f) => {
        // Include fields in the schema when either:
        // - they are disabled (legacy behavior), OR
        // - they are required (we need to validate required address fields)
        // If a field is neither disabled nor required, skip it to avoid
        // validating editable non-required fields.
        if (!f.disabled && !f.required) return

        const label = f.label || f.name
        const requiredMsg = `กรุณากรอก ${label}`

  // Special-case email fields so we provide a specific Thai message
  if (f.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (f.required) {
            // Required email: coerce null/undefined -> '' so min(1) triggers when empty.
            // Use refine to validate format only when the string is non-empty so we
            // don't produce both "required" and "invalid format" errors at once.
            shape[f.name] = z.preprocess(
              (v) => (v == null ? '' : v),
              z
                .string()
                .min(1, { message: requiredMsg })
                .refine((val) => val === '' || emailRegex.test(val), { message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
            )
          } else {
            // Optional email: treat null/empty as not-present, otherwise validate format.
            shape[f.name] = z.preprocess(
              (v) => (v == null || v === '' ? undefined : v),
              z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }).optional(),
            )
          }
          return
        }
        // Special-case file fields: validate presence. Files are stored in
        // `fileMap[entryIndex][name]` and VeeField will receive either a File
        // or an array of File depending on `multiple`.
        if (f.type === 'file') {
          const requiredMsg = `กรุณาอัปโหลดเอกสาร`
      
          // Build file validation with size check (15 MB)
          if (f.required) {
            if (f.multiple) {
              // required multiple files: array with at least one item and each file <= MAX
              shape[f.name] = z
                .preprocess((v) => (v == null ? [] : v), z.array(z.any()).min(1, { message: requiredMsg }))
                .refine((arr: any[]) => arr.every((file) => !file || (file.size && file.size <= MAX_FILE_SIZE)), {
                  message: `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`,
                })
            } else {
              // required single file: non-null and size <= MAX
              shape[f.name] = z
                .any()
                .refine((val) => val != null, { message: requiredMsg })
                .refine((val) => val == null || (val.size && val.size <= MAX_FILE_SIZE), {
                  message: `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`,
                })
            }
          } else {
            // optional file: allow undefined or file/array, but when present enforce size
            if (f.multiple)
              shape[f.name] = z
                .array(z.any())
                .optional()
                .refine((arr: any[] | undefined) => !arr || arr.every((file) => !file || (file.size && file.size <= MAX_FILE_SIZE)), {
                  message: `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`,
                })
            else
              shape[f.name] = z
                .any()
                .nullable()
                .optional()
                .refine((val) => !val || (val.size && val.size <= MAX_FILE_SIZE), {
                  message: `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`,
                })
          }
          return
        }

        // Default: treat as string. For required fields enforce non-empty with a Thai message.
        // Use preprocess to convert null/undefined to empty string so Zod returns our
        // custom message (rather than the generic "Expected string, received null").
        if (f.required) {
          shape[f.name] = z.preprocess((v) => (v == null ? '' : v), z.string().min(1, { message: requiredMsg }))
        } else {
          // non-required: accept null/undefined without error
          shape[f.name] = z.string().nullable().optional()
        }
      })
    })
    return toTypedSchema(z.object(shape))
  })
}

const emit = defineEmits<{
  (e: 'save', index: number, values: Record<string, any>): void
  (e: 'delete', index: number, id?: string): void
  (e: 'change', index: number, values: Record<string, any>): void
}>()

// localEntries: FieldSection[][] — แต่ละ entry คือ 1 การ์ด ที่มีหลาย section
const localEntries = ref<FieldSection[][]>([])
// localValues: เก็บค่าของแต่ละ entry (แยก object)
const localValues = ref<Record<string, any>[]>([])
const initialEntryValues = ref<Record<string, any>[]>([])
const entryTouchedStates = ref<boolean[]>([])
// per-entry version to force VeeForm re-render when initial values change
const localValuesVersions = ref<number[]>([])

// Refs to individual VeeForm component instances so we can programmatically
// call submitForm() which runs validation and triggers the @submit handler.
const formRefs = ref<Array<any>>([])
function setFormRef(index: number, el: any) {
  formRefs.value[index] = el
}

// File upload state (declared early because the watch below runs immediately):
// one record per entry: fileMap[entryIndex][fieldName] = selected files or existing files from API
const fileMap = ref<Array<Record<string, UploadedFileItem[]>>>([])
const fileInputRefs = ref<Array<Record<string, HTMLInputElement | null>>>([])
// Per-entry file size errors: fileSizeErrors[entryIndex][fieldName] = string | undefined
const fileSizeErrors = ref<Array<Record<string, string | undefined>>>([])
const fileTypeErrors = ref<Array<Record<string, string | undefined>>>([])
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

function getAcceptRules(accept?: string) {
  return (
    accept
      ?.split(',')
      .map((rule) => rule.trim().toLowerCase())
      .filter(Boolean) || []
  )
}

function isFileAcceptedByRule(file: File, rule: string) {
  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()

  if (rule.startsWith('.')) return fileName.endsWith(rule)
  if (rule.endsWith('/*')) return fileType.startsWith(rule.slice(0, -1))
  return fileType === rule
}

function isFileAcceptedByAccept(file: File, accept?: string) {
  const rules = getAcceptRules(accept)
  if (!rules.length) return true
  return rules.some((rule) => isFileAcceptedByRule(file, rule))
}

function getFileAcceptErrorMessage(accept?: string) {
  const rules = getAcceptRules(accept)
  if (!rules.length) return undefined
  return `รองรับเฉพาะไฟล์ ${rules.join(', ')}`
}

function normalizeInitialFiles(value: unknown): UploadedFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is UploadedFileItem =>
        Boolean(item) && typeof item === 'object' && 'name' in item && 'size' in item,
    )
  }
  if (typeof value === 'object' && 'name' in value && 'size' in value) {
    return [value as UploadedFileItem]
  }
  return []
}

function syncFileMapFromValues() {
  fileMap.value = localEntries.value.map((entry, entryIndex) => {
    const currentMap = fileMap.value[entryIndex] || {}
    const nextMap: Record<string, UploadedFileItem[]> = {}

    entry
      .flatMap((section) => section.content || [])
      .filter((field) => field.type === 'file')
      .forEach((field) => {
        nextMap[field.name] = normalizeInitialFiles(localValues.value[entryIndex]?.[field.name])
      })

    return { ...currentMap, ...nextMap }
  })
}

// Sync localEntries & localValues with props.fields/values
// ซิงก์ค่า `props.fields` และ `props.values` เข้ากับ state ภายใน (localEntries/localValues)
// เป้าหมาย:
// - ให้มี template (localEntries) สำหรับแต่ละ value ที่รับมา
// - ให้ localValues เก็บสำเนาของค่าที่ parent ส่งมา
// - บังคับให้ VeeForm รีมอนต์เมื่อค่าเริ่มต้นเปลี่ยน (ด้วย localValuesVersions)
watch(
  [() => props.fields, () => props.values],
  ([fields, values]) => {
    // 1) sync field templates from parent every time so dynamic options/disabled states stay fresh
    if (fields?.length) {
      localEntries.value = JSON.parse(JSON.stringify(fields))
    }

    // 2) หาก parent ส่ง values มาเป็นอาเรย์ ให้ใช้ค่านั้นเป็น localValues
    if (Array.isArray(values) && values.length > 0) {
      // เก็บสำเนา (ไม่ผูก reference ตรง ๆ)
      localValues.value = values.map((v) => ({ ...v }))
      initialEntryValues.value = values.map((v) => ({ ...v }))
      entryTouchedStates.value = values.map(() => false)

      // bump เวอร์ชันของแต่ละ entry เพื่อบังคับให้ VeeForm remount ถ้าจำเป็น
      localValuesVersions.value = values.map((_, i) => (localValuesVersions.value[i] || 0) + 1)

      // ถ้า template มีแค่ชุดเดียว แต่มีค่า values หลายรายการ ให้ clone template
      // เพื่อให้มีการ์ด/ฟอร์มแยกกันสำหรับแต่ละค่า
      const template = (fields && fields[0]) || localEntries.value[0]
      if (template) {
        while (localEntries.value.length < localValues.value.length) {
          localEntries.value.push(JSON.parse(JSON.stringify(template)))
        }
      }

      // (ถ้ามีค่ามา เราใช้ค่าที่ parent ให้มาเป็นหลัก จึงไม่ตั้งค่าเริ่มต้นอื่น)
    } else if (localValues.value.length === 0) {
      // กรณีไม่มี values จาก parent: สร้าง localValues ให้ตรงกับจำนวน localEntries
      localValues.value = localEntries.value.map(() => ({}))
      initialEntryValues.value = localEntries.value.map(() => ({}))
      entryTouchedStates.value = localEntries.value.map(() => false)
      localValuesVersions.value = localEntries.value.map(() => 0)
    }

    // 3) ให้ความยาวของ localValues / localValuesVersions เท่ากับ localEntries เสมอ
    const entriesCount = localEntries.value.length
    while (localValues.value.length < entriesCount) localValues.value.push({})
    while (localValues.value.length > entriesCount) localValues.value.pop()
    while (initialEntryValues.value.length < entriesCount) initialEntryValues.value.push({})
    while (initialEntryValues.value.length > entriesCount) initialEntryValues.value.pop()
    while (entryTouchedStates.value.length < entriesCount) entryTouchedStates.value.push(false)
    while (entryTouchedStates.value.length > entriesCount) entryTouchedStates.value.pop()

    while (localValuesVersions.value.length < entriesCount) localValuesVersions.value.push(0)
    while (localValuesVersions.value.length > entriesCount) localValuesVersions.value.pop()

  // keep formRefs in sync with entries so indices remain stable
  while (formRefs.value.length < entriesCount) formRefs.value.push(null)
  while (formRefs.value.length > entriesCount) formRefs.value.pop()
    while (fileMap.value.length < entriesCount) fileMap.value.push({})
    while (fileMap.value.length > entriesCount) fileMap.value.pop()
    while (fileInputRefs.value.length < entriesCount) fileInputRefs.value.push({})
    while (fileInputRefs.value.length > entriesCount) fileInputRefs.value.pop()
    while (fileSizeErrors.value.length < entriesCount) fileSizeErrors.value.push({})
    while (fileSizeErrors.value.length > entriesCount) fileSizeErrors.value.pop()
    while (fileTypeErrors.value.length < entriesCount) fileTypeErrors.value.push({})
    while (fileTypeErrors.value.length > entriesCount) fileTypeErrors.value.pop()
    syncFileMapFromValues()

    // 4) สร้าง/อัปเดต Zod schema สำหรับแต่ละ entry
    buildSchemas()
  },
  { immediate: true },
)

watch(
  () => props.values,
  () => {
  },
)
function addEntry() {
  if (!props.fields?.length) return
  // Clone template จาก entry แรก
  const template = props.fields[0]
  const cloned: FieldSection[] = JSON.parse(JSON.stringify(template))
  localEntries.value.push(cloned)
  localValues.value.push({})
  initialEntryValues.value.push({})
  entryTouchedStates.value.push(false)
  localValuesVersions.value.push(0)
  // keep formRefs aligned with new entry
  formRefs.value.push(null)
  // keep file structures aligned
  fileMap.value.push({})
  fileInputRefs.value.push({})
  fileSizeErrors.value.push({})
  fileTypeErrors.value.push({})
  // rebuild schemas so the new entry gets validation
  buildSchemas()
}

function deleteEntry(entryIndex: number) {
  if (props.busyEntries?.[entryIndex]) return
  const entryId = localValues.value[entryIndex]?.id || initialEntryValues.value[entryIndex]?.id
  if (props.deferDeleteOnConfirm) {
    emit('delete', entryIndex, entryId)
    return
  }
  localEntries.value.splice(entryIndex, 1)
  localValues.value.splice(entryIndex, 1)
  initialEntryValues.value.splice(entryIndex, 1)
  entryTouchedStates.value.splice(entryIndex, 1)
  localValuesVersions.value.splice(entryIndex, 1)
  formRefs.value.splice(entryIndex, 1)
  // remove per-entry file structures
  fileMap.value.splice(entryIndex, 1)
  fileInputRefs.value.splice(entryIndex, 1)
  fileSizeErrors.value.splice(entryIndex, 1)
  fileTypeErrors.value.splice(entryIndex, 1)
  emit('delete', entryIndex, entryId)
  // rebuild schemas to keep schemas in sync
  buildSchemas()
}

async function saveEntry(entryIndex: number) {
  if (props.busyEntries?.[entryIndex]) return
  if (savingEntries.value[entryIndex]) return
  savingEntries.value[entryIndex] = true

  // programmatically submit the whole-entry form for this entry

  // Prefer calling the VeeForm component instance directly (more reliable
  // than querying the DOM). The Form component exposes submitForm()/submit()
  // depending on vee-validate version; try both.
  try {
    const formInstance = formRefs.value[entryIndex]
    if (formInstance) {
      // If validate API exists, use it to see validation result and values
      try {
        if (typeof formInstance.validate === 'function') {
          const res = await formInstance.validate()
          if (res.valid) {
            // If validate returned values, call onSubmitEntry directly to keep behavior consistent
            onSubmitEntry(entryIndex, res.values)
            return
          } else {
            return
          }
        }

        // Next try submitForm/submit methods if available
        if (
          typeof formInstance.submitForm === 'function' ||
          typeof formInstance.submit === 'function'
        ) {
          if (typeof formInstance.submitForm === 'function') {
            formInstance.submitForm()
          } else {
            formInstance.submit()
          }
          return
        }
      } catch (err) {
        console.warn('error while using formInstance APIs', err)
      }
    }

    // If we have a component instance but it doesn't expose submit methods,
    // try to find the submit button inside its root element and click it.
    if (formInstance) {
      try {
        const rootEl = (formInstance as any).$el || null
        if (rootEl) {
          const innerSubmit = rootEl.querySelector && rootEl.querySelector('button[type="submit"]')
          if (innerSubmit) {
            ;(innerSubmit as HTMLButtonElement).click()
            return
          }
        }
      } catch (err) {
      }
    }

    // Fallback 1: try to click the hidden submit button inside the form so the
    // native submit occurs within the correct form element (this should trigger
    // vee-validate's @submit handler).
    const submitBtn = document.getElementById('form-submit-' + entryIndex) as HTMLButtonElement | null
    if (submitBtn) {
      submitBtn.click()
      return
    }

    // Fallback 2: try to submit the native HTML form if present (older fallback)
    const el = document.getElementById('form-' + entryIndex) as HTMLFormElement | null
    if (el) {
      try {
        el.requestSubmit()
      } catch (e) {
        console.warn('requestSubmit failed, dispatching submit event instead', e)
        el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      }
      return
    }

    // Final fallback: emit current localValues (may be empty if form never submitted)
    emit('save', entryIndex, localValues.value[entryIndex] || {})
  } finally {
    savingEntries.value[entryIndex] = false
  }
}

function onSubmitEntry(entryIndex: number, values: Record<string, any>) {
  // update local values and emit save with validated data
  // include files from fileMap for this entry into emitted values
  const filesForEntry = fileMap.value[entryIndex] || {}
  // Convert per-field file arrays to either arrays or single File depending on field definition
  const normalizedFiles: Record<string, any> = {}
  const entryTemplate = localEntries.value[entryIndex] || []
  const allFields: FieldItem[] = entryTemplate.flatMap((sec) => sec.content || [])
  for (const k of Object.keys(filesForEntry)) {
    const arr: UploadedFileItem[] = filesForEntry[k] || []
    const def = allFields.find((f) => f.name === k)
    if (def && def.multiple) normalizedFiles[k] = arr
    else normalizedFiles[k] = arr[0] ?? undefined
  }

  // Preserve current local entry values because vee-validate result may omit
  // editable optional fields that are not part of the generated schema.
  const mergedValues = { ...(localValues.value[entryIndex] || {}), ...(values || {}), ...normalizedFiles }
  localValues.value[entryIndex] = { ...mergedValues }
  if (!props.deferCommitOnSave) {
    initialEntryValues.value[entryIndex] = { ...mergedValues }
    entryTouchedStates.value[entryIndex] = false
    // bump version so VeeForm will reinitialize with new values if needed
    localValuesVersions.value[entryIndex] = (localValuesVersions.value[entryIndex] || 0) + 1
  }
  emit('save', entryIndex, { ...mergedValues })
}

// Toggle state: key = entryIndex
const openState = ref<Record<number, boolean>>({})

function isEntryOpen(entryIdx: number): boolean {
  return openState.value[entryIdx] !== false
}

function toggleEntry(entryIdx: number) {
  openState.value[entryIdx] = !isEntryOpen(entryIdx)
}

// File upload state: one record per entry: fileMap[entryIndex][fieldName] = File[]

function ensureFileStructuresForIndex(entryIndex: number) {
  while (fileMap.value.length <= entryIndex) fileMap.value.push({})
  while (fileInputRefs.value.length <= entryIndex) fileInputRefs.value.push({})
  while (fileSizeErrors.value.length <= entryIndex) fileSizeErrors.value.push({})
  while (fileTypeErrors.value.length <= entryIndex) fileTypeErrors.value.push({})
}

function getFiles(entryIndex: number, fieldName: string): UploadedFileItem[] {
  return (fileMap.value[entryIndex] && fileMap.value[entryIndex][fieldName]) || []
}

function setFileInputRef(entryIndex: number, fieldName: string, el: HTMLInputElement | null) {
  ensureFileStructuresForIndex(entryIndex)
  const refs = fileInputRefs.value[entryIndex] as Record<string, HTMLInputElement | null>
  refs[fieldName] = el
}

function updateEntryValue(entryIndex: number, fieldName: string, value: any) {
  while (localValues.value.length <= entryIndex) localValues.value.push({})
  while (entryTouchedStates.value.length <= entryIndex) entryTouchedStates.value.push(false)
  const current = localValues.value[entryIndex] || {}
  const nextValues = {
    ...current,
    [fieldName]: value,
  }
  localValues.value[entryIndex] = nextValues
  entryTouchedStates.value[entryIndex] = true
  emit('change', entryIndex, { ...nextValues })
}

function getAllFields(entryIndex: number): FieldItem[] {
  return (localEntries.value[entryIndex] || []).flatMap((section) => section.content || [])
}

const comboboxOpen = ref<Record<string, boolean>>({})
const comboboxQuery = ref<Record<string, string>>({})

function getComboboxKey(entryIndex: number, fieldName: string) {
  return `${entryIndex}-${fieldName}`
}

function getComboboxOptions(entryIndex: number, field: FieldItem) {
  const key = getComboboxKey(entryIndex, field.name)
  const query = (comboboxQuery.value[key] || '').trim().toLowerCase()
  const options = field.options || []
  if (!query) return options

  return options.filter((opt) => {
    const label = String(opt.label).toLowerCase()
    const value = String(opt.value).toLowerCase()
    return label.includes(query) || value.includes(query)
  })
}

function getOptionLabel(field: FieldItem, value: unknown) {
  if (!field.options?.length || value === undefined || value === null) return ''
  const match = field.options.find((opt) => String(opt.value) === String(value))
  return match?.label || ''
}

function normalizeComparableValue(value: any): any {
  if (value instanceof File) {
    return {
      name: value.name,
      size: value.size,
      type: value.type,
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = normalizeComparableValue(value[key])
          return acc
        },
        {} as Record<string, any>,
      )
  }

  return value ?? ''
}

function isEmptyRequiredValue(value: any) {
  if (Array.isArray(value)) return value.length === 0
  return value == null || value === ''
}

function hasEntryChanges(entryIndex: number) {
  const current = normalizeComparableValue(localValues.value[entryIndex] || {})
  const initial = normalizeComparableValue(initialEntryValues.value[entryIndex] || {})
  return JSON.stringify(current) !== JSON.stringify(initial)
}

function hasEntryMissingRequired(entryIndex: number) {
  return getAllFields(entryIndex).some((field) => {
    if (!field.required || field.disabled) return false

    if (field.type === 'file') {
      const files = getFiles(entryIndex, field.name)
      if (fileSizeErrors.value[entryIndex]?.[field.name]) return true
      if (fileTypeErrors.value[entryIndex]?.[field.name]) return true
      return field.multiple ? files.length === 0 : !files[0]
    }

    return isEmptyRequiredValue(localValues.value[entryIndex]?.[field.name])
  })
}

const disabledSaveByEntry = computed(() =>
  localEntries.value.map(
    (_, entryIndex) =>
      Boolean(props.busyEntries?.[entryIndex]) ||
      Boolean(savingEntries.value[entryIndex]) ||
      (!entryTouchedStates.value[entryIndex] && !hasEntryChanges(entryIndex)) ||
      hasEntryMissingRequired(entryIndex),
  ),
)

const savingEntries = ref<Record<number, boolean>>({})

function handleFileSelect(event: Event, entryIndex: number, fieldItem: FieldItem) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  addFiles(entryIndex, fieldItem, files)
  input.value = '' // reset เพื่อให้เลือกไฟล์ซ้ำได้
}

function addFiles(entryIndex: number, fieldItem: FieldItem, files: File[]) {
  ensureFileStructuresForIndex(entryIndex)
  const acceptedByType = files.filter((file) => isFileAcceptedByAccept(file, fieldItem.accept))
  const rejectedByType = files.filter((file) => !isFileAcceptedByAccept(file, fieldItem.accept))
  // split by size limit
  const acceptedBySize = acceptedByType.filter((f) => f.size <= MAX_FILE_SIZE)
  const rejectedBySize = acceptedByType.filter((f) => f.size > MAX_FILE_SIZE)

  const map = fileMap.value[entryIndex] as Record<string, UploadedFileItem[]>
  let arr = map[fieldItem.name]
  if (!arr) {
    arr = []
    map[fieldItem.name] = arr
  }

  if (fieldItem.multiple) {
    arr.push(...acceptedBySize)
  } else {
    map[fieldItem.name] = acceptedBySize.slice(0, 1)
  }

  updateEntryValue(
    entryIndex,
    fieldItem.name,
    fieldItem.multiple ? [...(map[fieldItem.name] || [])] : map[fieldItem.name]?.[0] ?? undefined,
  )

  // set per-field file size error message for this entry
  const sizeMsg = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`
  const errs = fileSizeErrors.value[entryIndex] || (fileSizeErrors.value[entryIndex] = {})
  if (rejectedBySize.length > 0) errs[fieldItem.name] = sizeMsg
  else errs[fieldItem.name] = undefined
  const typeErrs = fileTypeErrors.value[entryIndex] || (fileTypeErrors.value[entryIndex] = {})
  if (rejectedByType.length > 0) typeErrs[fieldItem.name] = getFileAcceptErrorMessage(fieldItem.accept)
  else typeErrs[fieldItem.name] = undefined
}

function removeFile(entryIndex: number, fieldName: string, index: number) {
  const map = fileMap.value[entryIndex]
  if (map && map[fieldName]) map[fieldName].splice(index, 1)
  // update size error state after removal
  const remaining = getFiles(entryIndex, fieldName)
  const fieldDef = getAllFields(entryIndex).find((field) => field.name === fieldName)
  updateEntryValue(
    entryIndex,
    fieldName,
    fieldDef?.multiple ? [...remaining] : remaining[0] ?? undefined,
  )
  const errs = fileSizeErrors.value[entryIndex] || (fileSizeErrors.value[entryIndex] = {})
  if (remaining.some((f) => f.size > MAX_FILE_SIZE)) errs[fieldName] = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`
  else errs[fieldName] = undefined
  const typeErrs = fileTypeErrors.value[entryIndex] || (fileTypeErrors.value[entryIndex] = {})
  typeErrs[fieldName] = undefined
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function hasDownloadUrl(
  file: UploadedFileItem,
): file is ExistingFileItem & { url: string } {
  return typeof file === 'object' && 'url' in file && typeof file.url === 'string' && Boolean(file.url)
}

async function downloadFile(file: UploadedFileItem) {
  if (!hasDownloadUrl(file)) return

  const response = await fetch(file.url)
  if (!response.ok) {
    throw new Error('ดาวน์โหลดไฟล์ไม่สำเร็จ')
  }

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

// Sub-form state: key = `${entryIndex}-${sectionIndex}`, value = array of sub-entries
const subEntries = ref<Record<string, Record<string, string>[]>>({})

function getSubEntries(entryIdx: number, sectionIdx: number): Record<string, string>[] {
  const key = `${entryIdx}-${sectionIdx}`
  if (!subEntries.value[key]) {
    subEntries.value[key] = []
  }
  return subEntries.value[key]
}

function addSubEntry(entryIdx: number, sectionIdx: number) {
  const key = `${entryIdx}-${sectionIdx}`
  if (!subEntries.value[key]) {
    subEntries.value[key] = []
  }
  subEntries.value[key].push({})
}

function deleteSubEntry(entryIdx: number, sectionIdx: number, subIdx: number) {
  const key = `${entryIdx}-${sectionIdx}`
  subEntries.value[key]?.splice(subIdx, 1)
}

// Date picker helpers
const datePopoverOpen = ref<Record<string, boolean>>({})

function stringToDateValue(str: string | undefined): DateValue | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new CalendarDate(y, m, d)
}

function dateValueToString(dv: DateValue): string {
  const y = String(dv.year).padStart(4, '0')
  const m = String(dv.month).padStart(2, '0')
  const d = String(dv.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(str: string | undefined): string {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

// Date-range helpers  (stored as "YYYY-MM-DD~YYYY-MM-DD")
function stringToDateRange(str: string | undefined): DateRange | undefined {
  if (!str) return undefined
  const [startStr = '', endStr = ''] = str.split('~')
  const start = stringToDateValue(startStr)
  const end = stringToDateValue(endStr)
  if (!start) return undefined
  return { start, end: end ?? start }
}

function dateRangeToString(range: DateRange): string {
  const s = range.start ? dateValueToString(range.start) : ''
  const e = range.end ? dateValueToString(range.end) : s
  return `${s}~${e}`
}

function formatDisplayDateRange(str: string | undefined): string {
  if (!str) return ''
  const [startStr = '', endStr = ''] = str.split('~')
  const s = formatDisplayDate(startStr)
  const e = formatDisplayDate(endStr)
  if (!s) return ''
  if (!e || s === e) return s
  return `${s} — ${e}`
}
</script>

<template>
  <Card class="w-full gap-3">
    <!-- ปุ่มเพิ่มข้อมูล (ซ่อนเมื่อ readonly) -->
    <div
      v-if="!readonly"
      class="hover:bg-muted/40 mx-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-4 py-2 transition-colors duration-200 sm:mx-6 sm:py-6"
      @click="addEntry()"
    >
      <button
        type="button"
        class="flex cursor-pointer items-center justify-center rounded-full sm:h-14 sm:w-14"
        aria-label="เพิ่มข้อมูล"
      >
        <CirclePlus class="h-5 w-5 sm:h-10 sm:w-10" stroke-width="3" />
      </button>
      <div><p class="text-sm font-semibold">เพิ่มข้อมูล</p></div>
    </div>

    <div class="grid overflow-hidden transition-all duration-300 ease-in-out">
      <div class="overflow-hidden">
        <CardContent class="flex flex-col gap-4">
          <!-- แต่ละ entry = 1 การ์ด -->
          <Card
            v-for="(entry, entryIndex) in localEntries"
            :key="entryIndex"
            class="gab-3 w-full pt-2"
            :class="{ 'pb-0': !isEntryOpen(entryIndex) }"
          >
            <!-- แต่ละ section ภายใน entry -->
            <VeeForm
              :key="'form-' + entryIndex + '-' + (localValuesVersions[entryIndex] ?? 0)"
              :id="'form-' + entryIndex"
              :initial-values="localValues[entryIndex]"
              :validation-schema="schemas[entryIndex]"
              @submit="(values) => onSubmitEntry(entryIndex, values)"
              :ref="(el) => setFormRef(entryIndex, el)"
            >
              <!-- hidden submit button inside the form so we can trigger native submit reliably -->
              <button
                :id="'form-submit-' + entryIndex"
                type="submit"
                class="hidden"
                aria-hidden="true"
              />
              <div
                v-for="(section, sectionIndex) in entry"
                :key="sectionIndex"
                :class="{ hidden: sectionIndex > 0 && !isEntryOpen(entryIndex) }"
              >
                <CardHeader :class="{ 'pb-0': !isEntryOpen(entryIndex) }">
                  <div
                    class="flex flex-row items-center justify-between py-2"
                    :class="
                      isEntryOpen(entryIndex) && section.topic
                        ? 'mb-2 border-b-2'
                        : 'hidden border-b-0'
                    "
                  >
                    <slot name="header">
                      <CardTitle
                        v-if="section.topic && isEntryOpen(entryIndex)"
                        class="text-base font-semibold"
                      >
                        {{ section.topic }}
                      </CardTitle>
                    </slot>
                    <!-- ปุ่ม toggle แสดงเฉพาะ section แรก -->
                    <button
                      v-if="sectionIndex === 0 && isDropdown === true"
                      type="button"
                      class="hover:bg-muted rounded-md p-1 transition-colors duration-150 cursor-pointer"
                      @click="toggleEntry(entryIndex)"
                    >
                      <ChevronUp
                        class="text-muted-foreground h-5 w-5 transition-transform duration-300"
                        :class="isEntryOpen(entryIndex) ? 'rotate-0' : 'hidden'"
                      />
                    </button>
                  </div>
                </CardHeader>

                <!-- Collapsed: แสดงสรุปข้อมูล -->
                <div
                  class="grid overflow-hidden transition-all duration-300 ease-in-out"
                  :class="
                    !isEntryOpen(entryIndex) && isDropdown === true
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'hidden grid-rows-[0fr]'
                  "
                >
                  <div class="overflow-hidden">
                    <CardContent class="pt-3">
                      <div class="flex flex-col gap-1 pb-4">
                        <!-- รวมสรุปจากทุก section ใน entry -->
                        <template v-for="(sec, secIdx) in entry" :key="secIdx">
                          <template v-for="value in sec.content" :key="value.name">
                            <p v-if="value.isShow" class="text-muted-foreground text-sm">
                              <span class="text-foreground font-medium">{{ value.label }}</span> :
                              {{
                                value.type === 'date'
                                  ? formatDisplayDate(localValues[entryIndex]?.[value.name])
                                  : value.type === 'date-range'
                                  ? formatDisplayDateRange(localValues[entryIndex]?.[value.name])
                                  : value.type === 'select' && value.options
                                  ? ((value.options.find((o) => o.value === localValues[entryIndex]?.[value.name]) || {}).label || (localValues[entryIndex]?.[value.name] ?? '-'))
                                  : (localValues[entryIndex]?.[value.name] ?? '-')
                              }}
                            </p>
                          </template>
                        </template>
                        <button
                          v-if="sectionIndex === 0 && isDropdown === true"
                          type="button"
                          class="hover:bg-muted self-end rounded-md p-1 transition-colors duration-150"
                          @click="toggleEntry(entryIndex)"
                        >
                          <ChevronUp
                            class="text-muted-foreground h-5 w-5 transition-transform duration-300"
                            :class="isEntryOpen(entryIndex) ? 'hidden' : 'rotate-180'"
                          />
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </div>

                <!-- Expanded: แสดงฟอร์ม -->
                <div
                  class="grid overflow-hidden transition-all duration-300 ease-in-out"
                  :class="
                    isEntryOpen(entryIndex)
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  "
                >
                  <div class="overflow-hidden">
                    <CardContent class="pt-0">
                      <!-- non-file fields -->
                      <div
                        class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      >
                        <VeeField
                          v-for="fieldItem in section.content.filter((f) => f.type !== 'file')"
                          :key="fieldItem.name"
                          v-slot="{ field: veeField, errors }"
                          :name="fieldItem.name"
                          v-model="localValues[entryIndex]![fieldItem.name]"
                        >
                          <Field :data-invalid="!!errors.length">
                            <FieldLabel :for="`form-field-${fieldItem.name}`" class="mb-1 block">
                              {{ fieldItem.label || fieldItem.name }}
                              <span v-if="fieldItem.required" class="text-red-500">*</span>
                            </FieldLabel>

                            <!-- text / number / email -->
                            <Input
                              v-if="['text', 'number', 'email'].includes(fieldItem.type)"
                              :id="`form-field-${fieldItem.name}`"
                              :model-value="veeField.value"
                              @update:model-value="
                                (val: any) => {
                                  veeField['onUpdate:modelValue']?.(val)
                                  updateEntryValue(entryIndex, fieldItem.name, val)
                                }
                              "
                              :type="fieldItem.type"
                              :placeholder="
                                fieldItem.placeholder 
                              "
                              autocomplete="off"
                              :aria-invalid="!!errors.length"
                              :disabled="fieldItem.disabled"
                              class="w-full disabled:opacity-50"
                            />

                            <!-- date (Popover + Calendar) -->
                            <Popover
                              v-else-if="fieldItem.type === 'date'"
                              v-model:open="
                                datePopoverOpen[
                                  `main-${entryIndex}-${sectionIndex}-${fieldItem.name}`
                                ]
                              "
                            >
                              <PopoverTrigger as-child>
                                <Button
                                  :id="`form-field-${fieldItem.name}`"
                                  variant="outline"
                                  :disabled="fieldItem.disabled"
                                  :class="[
                                    'w-full justify-start text-left font-normal',
                                    !veeField.value && 'text-muted-foreground',
                                    fieldItem.disabled && 'opacity-50',
                                    errors.length && 'border-red-500 ',
                                  ]"
                                >
                                  <CalendarIcon class="mr-2 h-4 w-4" />
                                  {{
                                    veeField.value
                                      ? formatDisplayDate(veeField.value as string)
                                      : fieldItem.placeholder || 'วว / ดด / ปปปป'
                                  }}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent class="w-auto p-0" align="start">
                                <Calendar
                                  :model-value="stringToDateValue(veeField.value as string)"
                                  layout="month-and-year"
                                  @update:model-value="
                                    (val: DateValue | undefined) => {
                                      if (val) {
                                        const nextValue = dateValueToString(val)
                                        veeField['onUpdate:modelValue']?.(nextValue)
                                        updateEntryValue(entryIndex, fieldItem.name, nextValue)
                                        datePopoverOpen[
                                          `main-${entryIndex}-${sectionIndex}-${fieldItem.name}`
                                        ] = false
                                      }
                                    }
                                  "
                                />
                              </PopoverContent>
                            </Popover>

                            <!-- date-range (Popover + RangeCalendar) -->
                            <Popover
                              v-else-if="fieldItem.type === 'date-range'"
                              v-model:open="
                                datePopoverOpen[
                                  `range-${entryIndex}-${sectionIndex}-${fieldItem.name}`
                                ]
                              "
                            >
                              <PopoverTrigger as-child>
                                <Button
                                  :id="`form-field-${fieldItem.name}`"
                                  variant="outline"
                                  :disabled="fieldItem.disabled"
                                  :class="[
                                    'w-full justify-start text-left font-normal',
                                    !veeField.value && 'text-muted-foreground',
                                    fieldItem.disabled && 'opacity-50',
                                    errors.length && 'border-red-500',
                                  ]"
                                >
                                  <CalendarIcon class="mr-2 h-4 w-4" />
                                  {{
                                    veeField.value
                                      ? formatDisplayDateRange(veeField.value as string)
                                      : fieldItem.placeholder || 'วว / ดด / ปปปป'
                                  }}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent class="w-auto p-0" align="start">
                                <RangeCalendar
                                  :model-value="stringToDateRange(veeField.value as string)"
                                  @update:model-value="
                                    (val: DateRange) => {
                                      if (val.start) {
                                        const nextValue = dateRangeToString(val)
                                        veeField['onUpdate:modelValue']?.(nextValue)
                                        updateEntryValue(entryIndex, fieldItem.name, nextValue)
                                        if (val.end) {
                                          datePopoverOpen[
                                            `range-${entryIndex}-${sectionIndex}-${fieldItem.name}`
                                          ] = false
                                        }
                                      }
                                    }
                                  "
                                />
                              </PopoverContent>
                            </Popover>

                            <!-- select -->
                            <Select
                              v-else-if="fieldItem.type === 'select'"
                              :model-value="(veeField.value as string) || ''"
                              :disabled="fieldItem.disabled"
                              @update:model-value="
                                (val: any) => {
                                  veeField['onUpdate:modelValue']?.(val)
                                  updateEntryValue(entryIndex, fieldItem.name, val)
                                }
                              "
                            >
                              <SelectTrigger
                                :id="`form-field-${fieldItem.name}`"
                                class="w-full"
                                :aria-invalid="!!errors.length"
                              >
                                <SelectValue :placeholder="fieldItem.placeholder || 'เลือก...'" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  v-for="opt in fieldItem.options"
                                  :key="opt.value"
                                  :value="opt.value"
                                >
                                  {{ opt.label }}
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Popover
                              v-else-if="fieldItem.type === 'combobox'"
                              v-model:open="
                                comboboxOpen[getComboboxKey(entryIndex, fieldItem.name)]
                              "
                            >
                              <PopoverTrigger as-child>
                                <Button
                                  :id="`form-field-${fieldItem.name}`"
                                  variant="outline"
                                  :disabled="fieldItem.disabled"
                                  :class="[
                                    'w-full justify-between text-left font-normal',
                                    !veeField.value && 'text-muted-foreground',
                                    fieldItem.disabled && 'opacity-50',
                                  ]"
                                >
                                  <span class="truncate">
                                    {{
                                      getOptionLabel(fieldItem, veeField.value) ||
                                      fieldItem.placeholder ||
                                      'ค้นหา/เลือก'
                                    }}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent class="w-65 p-0" align="start">
                                <div class="p-2">
                                  <Input
                                    :placeholder="fieldItem.placeholder || 'พิมพ์เพื่อค้นหา...'"
                                    v-model="
                                      comboboxQuery[getComboboxKey(entryIndex, fieldItem.name)]
                                    "
                                    autocomplete="off"
                                  />
                                </div>
                                <div class="max-h-60 overflow-y-auto py-1">
                                  <button
                                    v-for="opt in getComboboxOptions(entryIndex, fieldItem)"
                                    :key="opt.value"
                                    type="button"
                                    class="hover:bg-muted flex w-full items-center justify-between px-3 py-2 text-sm"
                                    @click="
                                      () => {
                                        veeField['onUpdate:modelValue']?.(opt.value)
                                        updateEntryValue(entryIndex, fieldItem.name, opt.value)
                                        comboboxOpen[getComboboxKey(entryIndex, fieldItem.name)] = false
                                        comboboxQuery[getComboboxKey(entryIndex, fieldItem.name)] = ''
                                      }
                                    "
                                  >
                                    <span class="truncate">{{ opt.label }}</span>
                                  </button>
                                  <p
                                    v-if="!getComboboxOptions(entryIndex, fieldItem).length"
                                    class="text-muted-foreground px-3 py-2 text-sm"
                                  >
                                    ไม่พบข้อมูล
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <!-- textarea -->
                            <Textarea
                              v-else-if="fieldItem.type === 'textarea'"
                              :id="`form-field-${fieldItem.name}`"
                              :model-value="veeField.value"
                              @update:model-value="
                                (val: any) => {
                                  veeField['onUpdate:modelValue']?.(val)
                                  updateEntryValue(entryIndex, fieldItem.name, val)
                                }
                              "
                              :placeholder="
                                fieldItem.placeholder || fieldItem.label || fieldItem.name
                              "
                              :disabled="fieldItem.disabled"
                              class="min-h-20 w-full resize-none disabled:opacity-50"
                              :aria-invalid="!!errors.length"
                            />

                            <div class="min-h-6">
                              <FieldError v-if="errors.length" :errors="errors" class="mt-1 ml-0" />
                            </div>
                          </Field>
                        </VeeField>
                      </div>

                      <!-- file fields -->
                      <div
                        v-if="section.content.some((f) => f.type === 'file')"
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
                      >
                        <div
                          v-for="fieldItem in section.content.filter((f) => f.type === 'file')"
                          :key="fieldItem.name"
                        >
                          <FieldLabel
                            v-if="fieldItem.label"
                            :for="`form-field-${fieldItem.name}`"
                            class="mb-2 block text-sm font-medium"
                          >
                            {{ fieldItem.label }}
                            <span v-if="fieldItem.required" class="text-red-500">*</span>
                          </FieldLabel>
                          <p
                            v-if="fieldItem.placeholder"
                            class="text-muted-foreground mb-2 text-xs"
                          >
                            {{ fieldItem.placeholder }}
                          </p>
                          <VeeField
                            :name="fieldItem.name"
                            v-slot="{ field, errors }"
                            v-model="localValues[entryIndex]![fieldItem.name]"
                          >
                            <Field
                              :data-invalid="
                                !!fileTypeErrors[entryIndex]?.[fieldItem.name] ||
                                !!fileSizeErrors[entryIndex]?.[fieldItem.name] ||
                                !!errors.length
                              "
                              class="gap-0"
                            >

                              <input
                                :ref="(el: any) => setFileInputRef(entryIndex, fieldItem.name, el)"
                                type="file"
                                class="hidden"
                                :accept="fieldItem.accept"
                                :multiple="fieldItem.multiple"
                                :disabled="fieldItem.disabled"
                                @change="(e) => { handleFileSelect(e, entryIndex, fieldItem); const files = getFiles(entryIndex, fieldItem.name); if (fieldItem.multiple) field['onUpdate:modelValue']?.(files); else field['onUpdate:modelValue']?.(files[0] ?? undefined) }"
                              />
                              <div class="w-28">
                                <Button
                                  type="button"
                                  class="cursor-pointer rounded-lg px-6 py-2 text-sm font-semibold bg-[#0b63b8] hover:bg-[#0a58a6] text-white w-fit"
                                  :disabled="fieldItem.disabled"
                                  @click="fileInputRefs[entryIndex]?.[fieldItem.name]?.click()"
                                >
                                  อัปโหลดไฟล์
                                </Button>
                              </div>
                              <div class="min-h-6" v-if="fileTypeErrors[entryIndex]?.[fieldItem.name] || fileSizeErrors[entryIndex]?.[fieldItem.name] || errors.length">
                                <div
                                  v-if="fileTypeErrors[entryIndex]?.[fieldItem.name]"
                                  class="mt-2 text-sm text-red-600"
                                >
                                  {{ fileTypeErrors[entryIndex][fieldItem.name] }}
                                </div>
                                <div
                                  v-else-if="fileSizeErrors[entryIndex]?.[fieldItem.name]"
                                  class="mt-2 text-sm text-red-600"
                                >
                                  {{ fileSizeErrors[entryIndex][fieldItem.name] }}
                                </div>
                                <FieldError
                                  v-else-if="errors.length"
                                  :errors="errors"
                                  class="mt-2 text-sm text-red-600"
                                />
                              </div>

                               <!-- รายการไฟล์ที่เลือก -->
                              <div
                                v-if="getFiles(entryIndex, fieldItem.name).length"
                                class="mt-2 flex flex-col gap-2"
                              >
                                <div
                                  v-for="(file, fileIdx) in getFiles(entryIndex, fieldItem.name)"
                                  :key="fileIdx"
                                  class="border-muted bg-muted/40 flex min-h-11 w-fit max-w-xl items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                                >
                                  <span class="text-black truncate">{{ file.name }}</span>
                                  <span class="text-muted-foreground shrink-0 text-xs">
                                    {{ formatFileSize(file.size) }} 
                                  </span>
                                  <button
                                    v-if="hasDownloadUrl(file)"
                                    type="button"
                                    class="cursor-pointer rounded border-2 border-gray-100 bg-white p-1 transition-colors hover:bg-gray-50"
                                    @click.stop="downloadFile(file)"
                                  >
                                    <ArrowDownToLine class="h-4 w-4" />
                                  </button>
                                  <button
                                    v-if="!fieldItem.disabled"
                                    type="button"
                                    class="hover:text-destructive text-muted-foreground rounded p-0.5 transition-colors  cursor-pointer "
                                    @click.stop="() => { removeFile(entryIndex, fieldItem.name, fileIdx); const files = getFiles(entryIndex, fieldItem.name); if (fieldItem.multiple) field['onUpdate:modelValue']?.(files); else field['onUpdate:modelValue']?.(files[0] ?? undefined) }"
                                  >
                                    <X class="h-3.5 w-3.5 cursor-pointer" />
                                  </button>
                                </div>
                              </div>
                          
                            </Field>
                          </VeeField>
                        </div>
                      </div>

                      <!-- sub-form (nested dynamic entries within section) -->
                      <div v-if="section.subFields?.length" class="mt-4">
                        <!-- ปุ่มเพิ่มข้อมูล sub-entry -->
                        <div
                          v-if="!readonly"
                          class="hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 py-2 transition-colors duration-200"
                          @click="addSubEntry(entryIndex, sectionIndex)"
                        >
                          <button
                            type="button"
                            class="flex items-center justify-center rounded-full"
                            aria-label="เพิ่มข้อมูล"
                          >
                            <CirclePlus class="h-5 w-5 sm:h-8 sm:w-8" stroke-width="3" />
                          </button>
                          <p class="text-xs font-semibold">เพิ่มข้อมูล</p>
                        </div>

                        <!-- sub-entries list -->
                        <div
                          v-for="(subEntry, subIdx) in getSubEntries(entryIndex, sectionIndex)"
                          :key="subIdx"
                          class="mt-3 flex items-end gap-4"
                        >
                          <div
                            class="grid flex-1 grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                          >
                            <Field v-for="subField in section.subFields" :key="subField.name">
                              <FieldLabel>
                                {{ subField.label || subField.name }}
                                <span v-if="subField.required" class="text-red-500">*</span>
                              </FieldLabel>
                              <Input
                                v-if="['text', 'number', 'email'].includes(subField.type)"
                                :model-value="subEntry[subField.name] || ''"
                                :type="subField.type"
                                :placeholder="
                                  subField.placeholder || subField.label || subField.name
                                "
                                :disabled="subField.disabled"
                                class="disabled:opacity-50"
                                @input="
                                  (e: Event) =>
                                    (subEntry[subField.name] = (e.target as HTMLInputElement).value)
                                "
                              />
                              <Popover
                                v-else-if="subField.type === 'date'"
                                v-model:open="
                                  datePopoverOpen[
                                    `sub-${entryIndex}-${sectionIndex}-${subIdx}-${subField.name}`
                                  ]
                                "
                              >
                                <PopoverTrigger as-child>
                                  <Button
                                    variant="outline"
                                    :disabled="subField.disabled"
                                    :class="[
                                      'w-full justify-start text-left font-normal',
                                      !subEntry[subField.name] && 'text-muted-foreground',
                                      subField.disabled && 'opacity-50',
                                    ]"
                                  >
                                    <CalendarIcon class="mr-2 h-4 w-4" />
                                    {{
                                      subEntry[subField.name]
                                        ? formatDisplayDate(subEntry[subField.name])
                                        : subField.placeholder || 'วว / ดด / ปปปป'
                                    }}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent class="w-auto p-0" align="start">
                                  <Calendar
                                    :model-value="stringToDateValue(subEntry[subField.name])"
                                    layout="month-and-year"
                                    @update:model-value="
                                      (val: DateValue | undefined) => {
                                        if (val) {
                                          subEntry[subField.name] = dateValueToString(val)
                                          datePopoverOpen[
                                            `sub-${entryIndex}-${sectionIndex}-${subIdx}-${subField.name}`
                                          ] = false
                                        }
                                      }
                                    "
                                  />
                                </PopoverContent>
                              </Popover>
                              <!-- sub-form date-range -->
                              <Popover
                                v-else-if="subField.type === 'date-range'"
                                v-model:open="
                                  datePopoverOpen[
                                    `sub-range-${entryIndex}-${sectionIndex}-${subIdx}-${subField.name}`
                                  ]
                                "
                              >
                                <PopoverTrigger as-child>
                                  <Button
                                    variant="outline"
                                    :disabled="subField.disabled"
                                    :class="[
                                      'w-full justify-start text-left font-normal',
                                      !subEntry[subField.name] && 'text-muted-foreground',
                                      subField.disabled && 'opacity-50',
                                    ]"
                                  >
                                    <CalendarIcon class="mr-2 h-4 w-4" />
                                    {{
                                      subEntry[subField.name]
                                        ? formatDisplayDateRange(subEntry[subField.name])
                                        : subField.placeholder || 'วว / ดด / ปปปป'
                                    }}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent class="w-auto p-0" align="start">
                                  <RangeCalendar
                                    :model-value="stringToDateRange(subEntry[subField.name])"
                                    @update:model-value="
                                      (val: DateRange) => {
                                        if (val.start) {
                                          subEntry[subField.name] = dateRangeToString(val)
                                          if (val.end) {
                                            datePopoverOpen[
                                              `sub-range-${entryIndex}-${sectionIndex}-${subIdx}-${subField.name}`
                                            ] = false
                                          }
                                        }
                                      }
                                    "
                                  />
                                </PopoverContent>
                              </Popover>
                              <Select
                                v-else-if="subField.type === 'select'"
                                :model-value="subEntry[subField.name] || ''"
                                :disabled="subField.disabled"
                                @update:model-value="
                                  (val: any) => {
                                    subEntry[subField.name] = val as string
                                  }
                                "
                              >
                                <SelectTrigger class="w-full">
                                  <SelectValue :placeholder="subField.placeholder || 'เลือก...'" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    v-for="opt in subField.options"
                                    :key="opt.value"
                                    :value="opt.value"
                                  >
                                    {{ opt.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                          <Button
                            v-if="!readonly"
                            type="button"
                            variant="destructive"
                            size="icon"
                            class="mb-0.5 shrink-0"
                            @click="deleteSubEntry(entryIndex, sectionIndex, subIdx)"
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </div>
              
            </VeeForm>

            <!-- ปุ่มบันทึก / ลบ -->
            <CardFooter
              class="gap-2 px-6 pt-0"
              :class="!isEntryOpen(entryIndex) ? 'hidden' : 'flex justify-end'"
            >
              <Button
                v-if="canDelete"
                type="button"
                variant="destructive"
                class="rounded-lg px-6 py-2 font-semibold shadow-sm cursor-pointer"
                :disabled="Boolean(props.busyEntries?.[entryIndex])"
                @click="deleteEntry(entryIndex)"
              >
                <Trash2 class="mr-1 h-4 w-4" />
                ลบ
              </Button>
              <Button
                type="button"
                class="rounded-lg cursor-pointer bg-[#16A34A] px-6 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
                :disabled="disabledSaveByEntry[entryIndex]"
                @click="saveEntry(entryIndex)"
              >
                <Spinner v-if="props.busyEntries?.[entryIndex] === 'save'" class="mr-2 h-4 w-4" />
                บันทึก
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </div>
    </div>
  </Card>
</template>
