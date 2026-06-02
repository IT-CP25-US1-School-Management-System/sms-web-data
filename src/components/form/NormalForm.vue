<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ThaiBuddhistCalendar from '@/components/form/ThaiBuddhistCalendar.vue'

import { CalendarIcon, X } from 'lucide-vue-next'

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
import { Checkbox } from '@/components/ui/checkbox'
import { type DateValue, CalendarDate } from '@internationalized/date'
import { formatThaiBuddhistDate, parseGregorianDateParts } from '@/lib/helpers'
import { computed, ref, watch } from 'vue'

export type NormalFormOption = {
  label: string
  value: string
  description?: string
}

export type NormalFormField = {
  name: string
  label?: string
  type:
    | 'text'
    | 'date'
    | 'select'
    | 'number'
    | 'email'
    | 'textarea'
    | 'file'
    | 'checkbox'
    | 'checkbox-group'
    | 'combobox'
  placeholder?: string
  description?: string
  disabled?: boolean
  required?: boolean
  options?: NormalFormOption[]
  accept?: string
  multiple?: boolean
  defaultValue?: unknown
  maxYearOffset?: number
}

export type NormalFormChangePayload = {
  values: Record<string, any>
  isDirty: boolean
}

const props = defineProps<{
  topic?: string
  fields?: NormalFormField[]
  values?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'save', value: Record<string, any>): void
  (e: 'change', value: NormalFormChangePayload): void
}>()

const DEFAULT_DATE_MAX_YEAR_OFFSET = 80

function getDefaultValue(field: NormalFormField) {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'checkbox') return false
  if (field.type === 'checkbox-group') return []
  return ''
}

function buildNumberValidator(label: string, required?: boolean) {
  const requiredMessage = `${label} จำเป็นต้องกรอก`
  const invalidMessage = `${label} ต้องเป็นตัวเลข`
  const normalizeNumberValue = (value: unknown) => {
    if (value == null) return undefined
    if (typeof value === 'number') return Number.isFinite(value) ? value : value
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const normalized = trimmed.replace(/,/g, '')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : value
    }
    return value
  }

  if (required) {
    return z.preprocess(
      normalizeNumberValue,
      z.number({
        required_error: requiredMessage,
        invalid_type_error: invalidMessage,
      }),
    )
  }

  return z.preprocess(
    normalizeNumberValue,
    z
      .number({
        invalid_type_error: invalidMessage,
      })
      .optional(),
  )
}

function buildInitialValues() {
  const vals: Record<string, any> = {}
  ;(props.fields || []).forEach((field) => {
    const incoming = props.values?.[field.name]
    if (incoming === undefined || incoming === null) {
      vals[field.name] = getDefaultValue(field)
      return
    }
    if (field.type === 'checkbox') {
      vals[field.name] = Boolean(incoming)
      return
    }
    if (field.type === 'checkbox-group') {
      vals[field.name] = Array.isArray(incoming) ? incoming : []
      return
    }
    vals[field.name] = incoming
  })
  return vals
}

const initialValues = ref<Record<string, any>>({})
const localValues = ref<Record<string, any>>({})
const formRef = ref<any>(null)
const MAX_FILE_SIZE = 15 * 1024 * 1024
const FILE_SIZE_ERROR_MESSAGE = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`

const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const fileErrors = ref<Record<string, string | undefined>>({})
const fileSizeErrors = ref<Record<string, string | undefined>>({})

function cloneValues(values: Record<string, any> = {}) {
  return JSON.parse(JSON.stringify(values))
}

function syncFormState() {
  const next = buildInitialValues()
  initialValues.value = cloneValues(next)
  localValues.value = cloneValues(next)
  fileErrors.value = {}
  fileSizeErrors.value = {}

  if (formRef.value?.resetForm) {
    formRef.value.resetForm({
      values: cloneValues(next),
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
    })
  }
}

watch(
  () => props.values,
  () => {
    syncFormState()
  },
  { immediate: true },
)

watch(
  () => props.fields,
  () => {
    syncFormState()
  },
)

const schema = computed(() => {
  const shape: Record<string, any> = {}
  const allowEmptyString = <T extends z.ZodTypeAny>(validator: T) =>
    validator.optional().or(z.literal(''))

  ;(props.fields || [])
    .filter((field) => !field.disabled)
    .forEach((field) => {
      const label = field.label || field.name
      const requiredMessage = `${label} จำเป็นต้องกรอก`
      if (field.type === 'checkbox') {
        shape[field.name] = field.required
          ? z.boolean().refine((val) => val === true, requiredMessage)
          : z.boolean().optional()
        return
      }
      if (field.type === 'checkbox-group') {
        const checkboxMessage = field.required
          ? `${label} กรุณาเลือกอย่างน้อย 1 ตัวเลือก`
          : undefined
        const arraySchema = z.array(z.string())
        shape[field.name] = field.required
          ? arraySchema.min(1, checkboxMessage)
          : arraySchema.optional()
        return
      }

      if (field.type === 'number') {
        shape[field.name] = buildNumberValidator(label, field.required)
        return
      }

      let validator = z.string()
      if (field.type === 'email') {
        validator = validator.email('รูปแบบอีเมลไม่ถูกต้อง')
      }

      if (field.required) {
        shape[field.name] = validator.min(1, requiredMessage)
      } else {
        shape[field.name] = allowEmptyString(validator)
      }
    })

  return toTypedSchema(z.object(shape as Record<string, any>))
})

const isDirty = computed(
  () => JSON.stringify(localValues.value) !== JSON.stringify(initialValues.value),
)

function isMissingRequiredValue(field: NormalFormField) {
  if (!field.required || field.disabled) return false

  const value = localValues.value[field.name]

  if (field.type === 'checkbox') return value !== true
  if (field.type === 'checkbox-group') return !Array.isArray(value) || value.length === 0
  if (field.type === 'file') {
    if (fileSizeErrors.value[field.name]) return true
    return getFiles(field.name).length === 0
  }

  return value == null || value === ''
}

const hasMissingRequiredFields = computed(() =>
  (props.fields || []).some((field) => isMissingRequiredValue(field)),
)

const canSubmit = computed(() => isDirty.value && !hasMissingRequiredFields.value)

watch(
  localValues,
  (vals) => {
    emit('change', { values: cloneValues(vals), isDirty: isDirty.value })
  },
  { deep: true },
)

const onSubmit = (data: Record<string, any>) => {
  initialValues.value = cloneValues(data)
  localValues.value = cloneValues(data)
  emit('save', data)
}

async function submitForm() {
  if (!formRef.value) return false
  const result = await formRef.value.validate()
  const filesValid = validateFileFields()
  if (result.valid && filesValid) {
    onSubmit((result.values as Record<string, any>) || formRef.value.values)
  }
  return result.valid && filesValid
}

function setFieldValue(path: string, value: unknown) {
  if (!formRef.value) return
  formRef.value.setFieldValue?.(path as any, value, false)
}

defineExpose({ submitForm, isDirty, setFieldValue, hasMissingRequiredFields, canSubmit })

function getFiles(fieldName: string): File[] {
  return fileMap.value[fieldName] || []
}

function handleFileSelect(event: Event, fieldItem: NormalFormField) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  addFiles(fieldItem, files)
  input.value = ''
}

function addFiles(fieldItem: NormalFormField, files: File[]) {
  const filtered = fieldItem.accept
    ? files.filter((f: File) => {
        const exts = fieldItem.accept!.split(',').map((s: string) => s.trim().toLowerCase())
        return exts.some(
          (ext: string) =>
            (ext.startsWith('.') && f.name.toLowerCase().endsWith(ext)) ||
            (ext.includes('*') && f.type.startsWith(ext.replace('*', ''))) ||
            f.type === ext,
        )
      })
    : files
  const acceptedBySize = filtered.filter((file) => file.size <= MAX_FILE_SIZE)
  const rejectedBySize = filtered.filter((file) => file.size > MAX_FILE_SIZE)

  if (!fileMap.value[fieldItem.name]) {
    fileMap.value[fieldItem.name] = []
  }

  if (fieldItem.multiple) {
    fileMap.value[fieldItem.name]!.push(...acceptedBySize)
  } else {
    fileMap.value[fieldItem.name] = acceptedBySize.slice(0, 1)
  }

  fileSizeErrors.value[fieldItem.name] =
    rejectedBySize.length > 0 ? FILE_SIZE_ERROR_MESSAGE : undefined

  if (fileMap.value[fieldItem.name]?.length) {
    fileErrors.value[fieldItem.name] = undefined
  }
}

function removeFile(fieldName: string, index: number) {
  fileMap.value[fieldName]?.splice(index, 1)
  fileSizeErrors.value[fieldName] = undefined
}

function validateFileFields() {
  let isValid = true

  for (const field of props.fields || []) {
    if (field.type !== 'file' || field.disabled) continue
    if (fileSizeErrors.value[field.name]) {
      isValid = false
      continue
    }
    if (field.required && getFiles(field.name).length === 0) {
      fileErrors.value[field.name] = `กรุณาแนบ ${field.label || field.name}`
      isValid = false
    } else {
      fileErrors.value[field.name] = undefined
    }
  }

  return isValid
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Date picker helpers
const datePopoverOpen = ref<Record<string, boolean>>({})

function stringToDateValue(str: string | undefined): DateValue | undefined {
  const parts = parseGregorianDateParts(str)
  if (!parts) return undefined
  return new CalendarDate(parts.year, parts.month, parts.day)
}

function dateValueToString(dv: DateValue): string {
  const y = String(dv.year).padStart(4, '0')
  const m = String(dv.month).padStart(2, '0')
  const d = String(dv.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMaxDateValue(field: NormalFormField) {
  return new CalendarDate(
    new Date().getFullYear() + (field.maxYearOffset ?? DEFAULT_DATE_MAX_YEAR_OFFSET),
    12,
    31,
  )
}

function formatDisplayDate(str: string | undefined): string {
  return formatThaiBuddhistDate(str)
}

const comboboxOpen = ref<Record<string, boolean>>({})
const comboboxQuery = ref<Record<string, string>>({})

function getComboboxOptions(field: NormalFormField) {
  const query = (comboboxQuery.value[field.name] || '').trim().toLowerCase()
  const options = field.options || []
  if (!query) return options
  return options.filter((opt) => {
    const label = opt.label.toLowerCase()
    const value = String(opt.value).toLowerCase()
    return label.includes(query) || value.includes(query)
  })
}

function getOptionLabel(field: NormalFormField, value: unknown) {
  if (!field.options?.length || value === undefined || value === null) return ''
  const match = field.options.find((opt) => opt.value === String(value))
  return match?.label || ''
}

function handleCheckboxGroupUpdate(
  field: Record<string, any>,
  optionValue: string,
  checked: boolean,
) {
  const current = Array.isArray(field.value) ? field.value : []
  const next = checked
    ? Array.from(new Set([...current, optionValue]))
    : current.filter((val: string) => val !== optionValue)
  field['onUpdate:modelValue']?.(next)
}
</script>

<template>
  <Card class="h-full w-full gap-3 pb-6">
    <CardHeader class="pb-0" v-if="topic">
      <div class="flex flex-row items-center justify-between border-b-2 pb-2">
        <slot name="header">
          <CardTitle>{{ topic }}</CardTitle>
        </slot>
      </div>
    </CardHeader>
    <div class="grid grid-rows-[1fr] overflow-hidden opacity-100">
      <div class="flex flex-col gap-0 overflow-hidden">
        <CardContent>
          <VeeForm
            ref="formRef"
            :validation-schema="schema"
            :initial-values="initialValues"
            @submit="onSubmit"
          >
            <div
              class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              <VeeField
                v-for="fieldItem in fields"
                :key="fieldItem.name"
                v-slot="{ field, errors }"
                :name="fieldItem.name"
                v-model="localValues[fieldItem.name]"
              >
                <Field :data-invalid="!!errors.length">
                  <FieldLabel :for="`form-field-${fieldItem.name}`">
                    {{ fieldItem.label || fieldItem.name }}
                    <span v-if="fieldItem.required" class="text-red-500">*</span>
                  </FieldLabel>

                  <!-- text / number / email -->
                  <Input
                    v-if="['text', 'number', 'email'].includes(fieldItem.type)"
                    :id="`form-field-${fieldItem.name}`"
                    :model-value="field.value"
                    @update:model-value="(v) => field['onUpdate:modelValue']?.(v)"
                    :type="fieldItem.type"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    autocomplete="off"
                    :aria-invalid="!!errors.length"
                    :disabled="fieldItem.disabled"
                    class="disabled:opacity-50"
                  />

                  <!-- date (Popover + Calendar) -->
                  <Popover
                    v-else-if="fieldItem.type === 'date'"
                    v-model:open="datePopoverOpen[fieldItem.name]"
                  >
                    <PopoverTrigger as-child>
                      <Button
                        :id="`form-field-${fieldItem.name}`"
                        variant="outline"
                        :disabled="fieldItem.disabled"
                        :class="[
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground',
                          fieldItem.disabled && 'disabled:opacity-50',
                        ]"
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{
                          field.value
                            ? formatDisplayDate(field.value as string)
                            : fieldItem.placeholder || 'วว / ดด / ปปปป'
                        }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <ThaiBuddhistCalendar
                        :model-value="stringToDateValue(field.value as string)"
                        layout="month-and-year"
                        :max-value="getMaxDateValue(fieldItem)"
                        @update:model-value="
                          (val: DateValue | undefined) => {
                            if (val) {
                              field['onUpdate:modelValue']?.(dateValueToString(val))
                              datePopoverOpen[fieldItem.name] = false
                            }
                          }
                        "
                      />
                    </PopoverContent>
                  </Popover>

                  <!-- select -->
                  <Select
                    v-else-if="fieldItem.type === 'select'"
                    :model-value="(field.value as string) || ''"
                    :disabled="fieldItem.disabled"
                    @update:model-value="(val: any) => field['onUpdate:modelValue']?.(val)"
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
                        v-for="opt in fieldItem.options || []"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <!-- searchable combobox -->
                  <Popover
                    v-else-if="fieldItem.type === 'combobox'"
                    v-model:open="comboboxOpen[fieldItem.name]"
                  >
                    <PopoverTrigger as-child>
                      <Button
                        :id="`form-field-${fieldItem.name}`"
                        variant="outline"
                        :disabled="fieldItem.disabled"
                        :class="[
                          'w-full justify-between text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        ]"
                      >
                        <span class="truncate">
                          {{
                            getOptionLabel(fieldItem, field.value) ||
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
                          v-model="comboboxQuery[fieldItem.name]"
                          autocomplete="off"
                        />
                      </div>
                      <div class="max-h-60 overflow-y-auto py-1">
                        <button
                          v-for="opt in getComboboxOptions(fieldItem)"
                          :key="opt.value"
                          type="button"
                          class="hover:bg-muted flex w-full items-center justify-between px-3 py-2 text-sm"
                          @click="
                            () => {
                              field['onUpdate:modelValue']?.(opt.value)
                              comboboxOpen[fieldItem.name] = false
                              comboboxQuery[fieldItem.name] = ''
                            }
                          "
                        >
                          <span class="truncate">{{ opt.label }}</span>
                        </button>
                        <p
                          v-if="!getComboboxOptions(fieldItem).length"
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
                    :model-value="field.value"
                    @update:model-value="(v) => field['onUpdate:modelValue']?.(v)"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    :disabled="fieldItem.disabled"
                    class="min-h-20 resize-none disabled:opacity-50"
                    :aria-invalid="!!errors.length"
                  />

                  <!-- checkbox -->
                  <div v-else-if="fieldItem.type === 'checkbox'" class="flex items-center gap-2">
                    <Checkbox
                      :id="`form-field-${fieldItem.name}`"
                      :model-value="Boolean(field.value)"
                      :disabled="fieldItem.disabled"
                      @update:model-value="
                        (val: boolean | 'indeterminate') =>
                          field['onUpdate:modelValue']?.(val === true)
                      "
                    />
                    <label
                      :for="`form-field-${fieldItem.name}`"
                      class="text-muted-foreground text-sm"
                    >
                      {{ fieldItem.placeholder || 'เลือก' }}
                    </label>
                  </div>

                  <!-- checkbox group -->
                  <div v-else-if="fieldItem.type === 'checkbox-group'" class="flex flex-col gap-2">
                    <div
                      v-for="opt in fieldItem.options || []"
                      :key="opt.value"
                      class="flex items-center gap-2"
                    >
                      <Checkbox
                        :id="`${fieldItem.name}-${opt.value}`"
                        :model-value="Array.isArray(field.value) && field.value.includes(opt.value)"
                        :disabled="fieldItem.disabled"
                        @update:model-value="
                          (val: boolean | 'indeterminate') =>
                            handleCheckboxGroupUpdate(field, opt.value, val === true)
                        "
                      />
                      <label :for="`${fieldItem.name}-${opt.value}`" class="text-sm">
                        {{ opt.label }}
                      </label>
                    </div>
                  </div>

                  <div class="min-h-4">
                    <FieldError v-if="errors.length" :errors="errors" />
                  </div>
                </Field>
              </VeeField>
            </div>
          </VeeForm>

          <!-- file fields -->
          <div
            v-if="fields?.some((f: NormalFormField) => f.type === 'file')"
            class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div
              v-for="fieldItem in fields?.filter((f: NormalFormField) => f.type === 'file')"
              :key="fieldItem.name"
            >
              <!-- <FieldLabel v-if="fieldItem.label" :for="`form-field-${fieldItem.name}`">
                {{ fieldItem.label }}
                <span v-if="fieldItem.required" class="text-red-500">*</span>
              </FieldLabel> -->
              <p v-if="fieldItem.placeholder" class="text-muted-foreground mb-2 text-xs">
                {{ fieldItem.placeholder }}
              </p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs[fieldItem.name] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                :accept="fieldItem.accept"
                :multiple="fieldItem.multiple"
                :disabled="fieldItem.disabled"
                @change="handleFileSelect($event, fieldItem)"
              />
              <Button
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-semibold"
                :disabled="fieldItem.disabled"
                @click="fileInputRefs[fieldItem.name]?.click()"
              >
                อัปโหลดไฟล์
              </Button>

              <!-- รายการไฟล์ที่เลือก -->
              <div class="min-h-6">
                <p v-if="fileSizeErrors[fieldItem.name]" class="mt-2 text-sm text-red-600">
                  {{ fileSizeErrors[fieldItem.name] }}
                </p>
                <p v-else-if="fileErrors[fieldItem.name]" class="mt-2 text-sm text-red-600">
                  {{ fileErrors[fieldItem.name] }}
                </p>
              </div>
              <div v-if="getFiles(fieldItem.name).length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, fileIdx) in getFiles(fieldItem.name)"
                  :key="fileIdx"
                  class="border-muted bg-muted/40 flex min-h-11 w-fit max-w-xl items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                >
                  <span class="truncate">{{ file.name }}</span>
                  <span class="text-muted-foreground shrink-0 text-xs">
                    {{ formatFileSize(file.size) }}
                  </span>
                  <button
                    v-if="!fieldItem.disabled"
                    type="button"
                    class="hover:text-destructive text-muted-foreground cursor-pointer rounded p-0.5 transition-colors"
                    @click.stop="removeFile(fieldItem.name, fileIdx)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  </Card>
</template>
