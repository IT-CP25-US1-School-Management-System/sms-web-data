<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
// toast unused in this component
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RangeCalendar } from '@/components/ui/range-calendar'

import { ChevronUp, CirclePlus, CalendarIcon, Trash2, X } from 'lucide-vue-next'

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
import type { DateRange } from 'reka-ui'
import { ref, watch } from 'vue'

// (removed example global form - using per-entry VeeForm instead)

type FieldItem = {
  name: string
  label?: string
  type: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'email' | 'textarea' | 'file'
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

const props = defineProps<{
  isDropdown?: boolean
  readonly?: boolean
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
        // all fields treated as string for simplicity; required => nonempty
        // NOTE: include disabled fields in the schema as optional so they are
        // registered by vee-validate and receive initial-values from the form.
        // We only enforce `min(1)` for required fields.
        if (f.required) shape[f.name] = z.string().min(1)
        else shape[f.name] = z.string().optional()
      })
    })
    return toTypedSchema(z.object(shape))
  })
}

const emit = defineEmits<{
  (e: 'save', index: number, values: Record<string, any>): void
  (e: 'delete', index: number): void
}>()

// localEntries: FieldSection[][] — แต่ละ entry คือ 1 การ์ด ที่มีหลาย section
const localEntries = ref<FieldSection[][]>([])
// localValues: เก็บค่าของแต่ละ entry (แยก object)
const localValues = ref<Record<string, any>[]>([])
// per-entry version to force VeeForm re-render when initial values change
const localValuesVersions = ref<number[]>([])

// Sync localEntries & localValues with props.fields/values
// ซิงก์ค่า `props.fields` และ `props.values` เข้ากับ state ภายใน (localEntries/localValues)
// เป้าหมาย:
// - ให้มี template (localEntries) สำหรับแต่ละ value ที่รับมา
// - ให้ localValues เก็บสำเนาของค่าที่ parent ส่งมา
// - บังคับให้ VeeForm รีมอนต์เมื่อค่าเริ่มต้นเปลี่ยน (ด้วย localValuesVersions)
watch(
  [() => props.fields, () => props.values],
  ([fields, values]) => {
    // 1) หากยังไม่มี template ให้ clone จาก props.fields (ครั้งแรกที่ mount)
    if (fields && localEntries.value.length === 0) {
      localEntries.value = JSON.parse(JSON.stringify(fields))
    }

    // 2) หาก parent ส่ง values มาเป็นอาเรย์ ให้ใช้ค่านั้นเป็น localValues
    if (Array.isArray(values) && values.length > 0) {
      // เก็บสำเนา (ไม่ผูก reference ตรง ๆ)
      localValues.value = values.map((v) => ({ ...v }))

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
      localValuesVersions.value = localEntries.value.map(() => 0)
    }

    // 3) ให้ความยาวของ localValues / localValuesVersions เท่ากับ localEntries เสมอ
    const entriesCount = localEntries.value.length
    while (localValues.value.length < entriesCount) localValues.value.push({})
    while (localValues.value.length > entriesCount) localValues.value.pop()

    while (localValuesVersions.value.length < entriesCount) localValuesVersions.value.push(0)
    while (localValuesVersions.value.length > entriesCount) localValuesVersions.value.pop()

    // 4) สร้าง/อัปเดต Zod schema สำหรับแต่ละ entry
    buildSchemas()
  },
  { immediate: true },
)

watch(
  () => props.values,
  (newValues) => {
    console.log('Values prop changed:', newValues)
  },
)
function addEntry() {
  if (!props.fields?.length) return
  // Clone template จาก entry แรก
  const template = props.fields[0]
  const cloned: FieldSection[] = JSON.parse(JSON.stringify(template))
  localEntries.value.push(cloned)
  localValues.value.push({})
  localValuesVersions.value.push(0)
  // rebuild schemas so the new entry gets validation
  buildSchemas()
}

function deleteEntry(entryIndex: number) {
  localEntries.value.splice(entryIndex, 1)
  localValues.value.splice(entryIndex, 1)
  localValuesVersions.value.splice(entryIndex, 1)
  emit('delete', entryIndex)
  // rebuild schemas to keep schemas in sync
  buildSchemas()
}

function saveEntry(entryIndex: number) {
  // programmatically submit the whole-entry form for this entry
  const el = document.getElementById('form-' + entryIndex) as HTMLFormElement | null
  if (el) el.requestSubmit()
  else emit('save', entryIndex, localValues.value[entryIndex] || {})
}

function onSubmitEntry(entryIndex: number, values: Record<string, any>) {
  // update local values and emit save with validated data
  localValues.value[entryIndex] = { ...(values || {}) }
  // bump version so VeeForm will reinitialize with new values if needed
  localValuesVersions.value[entryIndex] = (localValuesVersions.value[entryIndex] || 0) + 1
  emit('save', entryIndex, { ...(values || {}) })
}

// Toggle state: key = entryIndex
const openState = ref<Record<number, boolean>>({})

function isEntryOpen(entryIdx: number): boolean {
  return openState.value[entryIdx] !== false
}

function toggleEntry(entryIdx: number) {
  openState.value[entryIdx] = !isEntryOpen(entryIdx)
}

// File upload state: key = fieldItem.name, value = File[]
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
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

  if (!fileMap.value[fieldItem.name]) {
    fileMap.value[fieldItem.name] = []
  }

  if (fieldItem.multiple) {
    fileMap.value[fieldItem.name]!.push(...filtered)
  } else {
    fileMap.value[fieldItem.name] = filtered.slice(0, 1)
  }
}

function removeFile(fieldName: string, index: number) {
  fileMap.value[fieldName]?.splice(index, 1)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const [startStr, endStr] = str.split('~')
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
  const [startStr, endStr] = str.split('~')
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
            class="gab-3 w-full"
            :class="{ 'pb-0': !isEntryOpen(entryIndex) }"
          >
            <!-- แต่ละ section ภายใน entry -->
            <VeeForm
              :key="'form-' + entryIndex + '-' + (localValuesVersions[entryIndex] ?? 0)"
              :id="'form-' + entryIndex"
              :initial-values="localValues[entryIndex]"
              :validation-schema="schemas[entryIndex]"
              @submit="(values) => onSubmitEntry(entryIndex, values)"
            >
              <div
                v-for="(section, sectionIndex) in entry"
                :key="sectionIndex"
                :class="{ hidden: sectionIndex > 0 && !isEntryOpen(entryIndex) }"
              >
                <CardHeader :class="{ 'pb-0': !isEntryOpen(entryIndex) }">
                  <div
                    class="flex flex-row items-center justify-between pb-2"
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
                      class="hover:bg-muted rounded-md p-1 transition-colors duration-150"
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
                    <CardContent class="pt-0">
                      <div class="flex flex-col gap-1 pb-4">
                        <!-- รวมสรุปจากทุก section ใน entry -->
                        <template v-for="(sec, secIdx) in entry" :key="secIdx">
                          <template v-for="value in sec.content" :key="value.name">
                            <p v-if="value.isShow" class="text-muted-foreground text-sm">
                              <span class="text-foreground font-medium">{{ value.label }}</span> :
                              {{ value.label }}
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
                                (val: any) => veeField['onUpdate:modelValue']?.(val)
                              "
                              :type="fieldItem.type"
                              :placeholder="
                                fieldItem.placeholder || fieldItem.label || fieldItem.name
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
                                        veeField['onUpdate:modelValue']?.(dateValueToString(val))
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
                                        veeField['onUpdate:modelValue']?.(dateRangeToString(val))
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
                                (val: any) => veeField['onUpdate:modelValue']?.(val)
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

                            <!-- textarea -->
                            <Textarea
                              v-else-if="fieldItem.type === 'textarea'"
                              :id="`form-field-${fieldItem.name}`"
                              :model-value="veeField.value"
                              @update:model-value="
                                (val: any) => veeField['onUpdate:modelValue']?.(val)
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
                        class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
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
                          <div
                            v-if="getFiles(fieldItem.name).length"
                            class="mt-2 flex flex-col gap-1"
                          >
                            <div
                              v-for="(file, fileIdx) in getFiles(fieldItem.name)"
                              :key="fileIdx"
                              class="border-muted bg-muted/50 flex h-10 w-max items-center justify-between gap-2 rounded-2xl border-2 p-2 text-sm"
                            >
                              <span class="truncate">{{ file.name }}</span>
                              <span class="text-muted-foreground shrink-0 text-xs">
                                {{ formatFileSize(file.size) }}
                              </span>
                              <button
                                v-if="!fieldItem.disabled"
                                type="button"
                                class="hover:text-destructive text-muted-foreground rounded p-0.5 transition-colors"
                                @click.stop="removeFile(fieldItem.name, fileIdx)"
                              >
                                <X class="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
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
                type="button"
                variant="destructive"
                class="rounded-lg px-6 py-2 font-semibold shadow-sm"
                @click="deleteEntry(entryIndex)"
              >
                <Trash2 class="mr-1 h-4 w-4" />
                ลบ
              </Button>
              <Button
                type="button"
                class="rounded-lg bg-[#16A34A] px-6 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
                @click="saveEntry(entryIndex)"
              >
                บันทึก
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </div>
    </div>
  </Card>
</template>
