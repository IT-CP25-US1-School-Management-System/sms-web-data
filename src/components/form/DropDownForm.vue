<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ChevronUp, CalendarIcon, X } from 'lucide-vue-next'

import { Checkbox } from '@/components/ui/checkbox'
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
import { type DateValue, CalendarDate } from '@internationalized/date'
import { formatThaiBuddhistDate, THAI_BUDDHIST_LOCALE } from '@/lib/helpers'
import { ref, computed, watch } from 'vue'

type FieldItem = {
  name: string
  label?: string
  type: 'text' | 'date' | 'select' | 'number' | 'email' | 'textarea' | 'file' | 'checkbox'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { label: string; value: string }[]
  accept?: string
  multiple?: boolean
  maxYearOffset?: number
}

const emit = defineEmits<{
  (e: 'save', value: Record<string, any>): void
  (e: 'delete', value: Record<string, any>): void
  (e: 'change', payload: { values: Record<string, any>; isDirty: boolean }): void
}>()

const props = defineProps<{
  topic?: string
  fields?: FieldItem[]
  values?: Record<string, any>
}>()

const DEFAULT_DATE_MAX_YEAR_OFFSET = 80

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

const schema = computed(() => {
  const shape: Record<string, any> = {}

  // do not include disabled fields in the validation schema
  props.fields
    ?.filter((f) => !f.disabled)
    .forEach((field) => {
      const label = field.label || field.name
      const baseRequiredMessage = `${label} จำเป็นต้องกรอก`

      if (field.type === 'checkbox') {
        shape[field.name] = field.required
          ? z.boolean().refine((value) => value === true, {
              message: `${label} จำเป็นต้องเลือก`,
            })
          : z.boolean().optional()
        return
      }

      const allowEmptyString = <T extends z.ZodTypeAny>(validator: T) =>
        validator.optional().or(z.literal(''))

      if (field.type === 'number') {
        shape[field.name] = buildNumberValidator(label, field.required)
        return
      }

      if (field.required) {
        let validator = z.string().min(1, baseRequiredMessage)
        if (field.type === 'email') {
          validator = validator.email('รูปแบบอีเมลไม่ถูกต้อง')
        }
        shape[field.name] = validator
      } else {
        let validator = allowEmptyString(z.string())
        if (field.type === 'email') {
          validator = allowEmptyString(z.string().email('รูปแบบอีเมลไม่ถูกต้อง'))
        }
        shape[field.name] = validator
      }
    })

  return toTypedSchema(z.object(shape))
})

const initialValues = ref<Record<string, any>>({})
const localValues = ref<Record<string, any>>({})
const MAX_FILE_SIZE = 15 * 1024 * 1024
const FILE_SIZE_ERROR_MESSAGE = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`

// ref to the internal VeeForm component so parent can trigger submit
const formRef = ref<any>(null)

const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const fileErrors = ref<Record<string, string | undefined>>({})
const fileSizeErrors = ref<Record<string, string | undefined>>({})

function cloneValues(source: Record<string, any> = {}) {
  return JSON.parse(JSON.stringify(source))
}

function buildValuesFromProps() {
  const result: Record<string, any> = {}
  ;(props.fields || []).forEach((field) => {
    const incoming = props.values?.[field.name]

    if (field.type === 'checkbox') {
      result[field.name] = incoming === true || incoming === 'true'
      return
    }

    result[field.name] = incoming ?? ''
  })
  return result
}

function serializeValues(source: Record<string, any> = {}) {
  return JSON.stringify(source)
}

function syncFormState(force = false) {
  const next = buildValuesFromProps()
  if (!force && serializeValues(next) === serializeValues(localValues.value)) {
    return
  }

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
  { immediate: true, deep: true },
)

watch(
  () => (props.fields || []).map((field) => field.name).join('|'),
  () => {
    syncFormState(true)
  },
)

const isDirty = computed(
  () => JSON.stringify(localValues.value) !== JSON.stringify(initialValues.value),
)

watch(
  localValues,
  (vals) => {
    emit('change', { values: cloneValues(vals || {}), isDirty: isDirty.value })
  },
  { deep: true },
)

function onSubmit(values: Record<string, any>) {
  initialValues.value = cloneValues(values || {})
  localValues.value = cloneValues(values || {})
  emit('save', values)
}

async function submitForm() {
  if (!formRef.value) return false

  const result = await formRef.value.validate()
  const filesValid = validateFileFields()

  if (result.valid && filesValid) {
    // formRef.value.$el?.dispatchEvent(
    //   new Event('submit', { cancelable: true, bubbles: true })
    // )
    onSubmit((result.values as Record<string, any>) || formRef.value.values)
  }

  return result.valid && filesValid
}

async function validateForm() {
  if (!formRef.value) return false

  const result = await formRef.value.validate()
  const filesValid = validateFileFields()

  return result.valid && filesValid
}

function setFieldValue(path: string, value: unknown) {
  if (localValues.value[path] === value) return
  localValues.value = {
    ...localValues.value,
    [path]: value,
  }
  formRef.value?.setFieldValue?.(path as any, value, false)
}

defineExpose({ submitForm, validateForm, isDirty, setFieldValue })

const isOpen = ref(true)

function getFiles(fieldName: string): File[] {
  return fileMap.value[fieldName] || []
}

function handleFileSelect(event: Event, fieldItem: FieldItem) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  addFiles(fieldItem, files)
  input.value = '' // reset เพื่อให้เลือกไฟล์ซ้ำได้
}

function addFiles(fieldItem: FieldItem, files: File[]) {
  const filtered = fieldItem.accept
    ? files.filter((f) => {
        const exts = fieldItem.accept!.split(',').map((s) => s.trim().toLowerCase())
        return exts.some(
          (ext) =>
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

function getMaxDateValue(field: FieldItem) {
  return new CalendarDate(
    new Date().getFullYear() + (field.maxYearOffset ?? DEFAULT_DATE_MAX_YEAR_OFFSET),
    12,
    31,
  )
}

function formatDisplayDate(str: string | undefined): string {
  return formatThaiBuddhistDate(str)
}
</script>

<template>
  <Card class="w-full gap-3" :class="{ 'pb-0': !isOpen }">
    <CardHeader :class="{ 'pb-0': !isOpen }">
      <div
        class="flex flex-row items-center justify-between pb-2"
        :class="isOpen ? 'border-b-2' : 'border-b-0'"
      >
        <slot name="header">
          <CardTitle v-if="topic">{{ topic }}</CardTitle>
        </slot>
        <div class="cursor-pointer" @click="isOpen = !isOpen">
          <ChevronUp :class="isOpen ? 'rotate-0' : 'rotate-180'" />
        </div>
      </div>
    </CardHeader>
    <div
      class="grid overflow-hidden transition-all duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="flex flex-col gap-0 overflow-hidden">
        <CardContent>
          <VeeForm
            ref="formRef"
            :validation-schema="schema"
            :initial-values="initialValues"
            @submit="onSubmit"
          >
            <div
              class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              <VeeField
                v-for="fieldItem in fields"
                :key="fieldItem.name"
                v-slot="{ field, errors }"
                :name="fieldItem.name"
                v-model="localValues[fieldItem.name]"
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
                    :model-value="localValues[fieldItem.name]"
                    @update:model-value="(val) => field['onUpdate:modelValue']?.(val)"
                    :type="fieldItem.type"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    autocomplete="off"
                    :aria-invalid="!!errors.length"
                    :disabled="fieldItem.disabled"
                    class="w-full disabled:opacity-50"
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
                          fieldItem.disabled && 'opacity-50',
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
                      <Calendar
                        :model-value="stringToDateValue(field.value as string)"
                        :locale="THAI_BUDDHIST_LOCALE"
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
                    :model-value="field.value"
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
                        v-for="opt in fieldItem.options"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div
                    v-else-if="fieldItem.type === 'checkbox'"
                    class="flex min-h-9 items-center gap-3 px-3"
                  >
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
                      class="text-muted-foreground cursor-pointer text-sm"
                      :class="{ 'cursor-not-allowed opacity-50': fieldItem.disabled }"
                    >
                      {{ fieldItem.placeholder || fieldItem.label || fieldItem.name }}
                    </label>
                  </div>

                  <!-- textarea -->
                  <Textarea
                    v-else-if="fieldItem.type === 'textarea'"
                    :id="`form-field-${fieldItem.name}`"
                    :model-value="localValues[fieldItem.name]"
                    @update:model-value="(val) => field['onUpdate:modelValue']?.(val)"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    :disabled="fieldItem.disabled"
                    class="min-h-20 w-full resize-none disabled:opacity-50"
                    :aria-invalid="!!errors.length"
                  />
                  <div class="min-h-4">
                    <FieldError v-if="errors.length" :errors="errors" class="mt-1 ml-0" />
                  </div>
                </Field>
              </VeeField>
            </div>
          </VeeForm>
          <!-- file fields -->
          <div
            v-if="fields?.some((f: FieldItem) => f.type === 'file')"
            class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div
              v-for="fieldItem in fields?.filter((f: FieldItem) => f.type === 'file')"
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
                  class="border-muted bg-muted/40 c flex min-h-11 w-fit max-w-xl items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                >
                  <span class="truncate">{{ file.name }}</span>
                  <span class="text-muted-foreground shrink-0 text-xs">
                    {{ formatFileSize(file.size) }}
                  </span>
                  <button
                    v-if="!fieldItem.disabled"
                    type="button"
                    class="hover:text-destructive text-muted-foreground ursor-pointer rounded p-0.5 transition-colors"
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
