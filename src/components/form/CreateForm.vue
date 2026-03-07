<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toast } from 'vue-sonner'
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
import { h, ref, watch } from 'vue'

const formSchema = toTypedSchema(
  z.object({
    title: z
      .string()
      .min(5, 'Bug title must be at least 5 characters.')
      .max(32, 'Bug title must be at most 32 characters.'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters.')
      .max(100, 'Description must be at most 100 characters.'),
  }),
)

const { handleSubmit } = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: '',
    description: '',
  },
})

const onSubmit = handleSubmit((data) => {
  toast('You submitted the following values:', {
    description: h(
      'pre',
      { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' },
      h('code', JSON.stringify(data, null, 2)),
    ),
    position: 'bottom-right',
    class: 'flex flex-col gap-2',
    style: {
      '--border-radius': 'calc(var(--radius)  + 4px)',
    },
  })
})

type FieldItem = {
  name: string
  label?: string
  type: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'email' | 'textarea' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  isShow?: boolean
  options?: { label: string; value: string }[]
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
}>()

const emit = defineEmits<{
  (e: 'save', index: number): void
  (e: 'delete', index: number): void
}>()

// localEntries: FieldSection[][] — แต่ละ entry คือ 1 การ์ด ที่มีหลาย section
const localEntries = ref<FieldSection[][]>([])

watch(
  () => props.fields,
  (val) => {
    if (val && localEntries.value.length === 0) {
      localEntries.value = JSON.parse(JSON.stringify(val))
    }
  },
  { immediate: true },
)

function addEntry() {
  if (!props.fields?.length) return
  // Clone template จาก entry แรก
  const template = props.fields[0]
  const cloned: FieldSection[] = JSON.parse(JSON.stringify(template))
  localEntries.value.push(cloned)
}

function deleteEntry(entryIndex: number) {
  localEntries.value.splice(entryIndex, 1)
  emit('delete', entryIndex)
}

function saveEntry(entryIndex: number) {
  emit('save', entryIndex)
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
      class="border-4 rounded-lg mx-2 py-2 sm:mx-6 sm:py-6 gap-1 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors duration-200"
      @click="addEntry()"
    >
      <button
        type="button"
        class="sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
        aria-label="เพิ่มข้อมูล"
      >
        <CirclePlus class="w-5 h-5 sm:w-10 sm:h-10" stroke-width="3" />
      </button>
      <div><p class="font-semibold text-sm">เพิ่มข้อมูล</p></div>
    </div>

    <div class="grid transition-all duration-300 ease-in-out overflow-hidden">
      <div class="overflow-hidden">
        <CardContent class="flex flex-col gap-4">
          <!-- แต่ละ entry = 1 การ์ด -->
          <Card
            v-for="(entry, entryIndex) in localEntries"
            :key="entryIndex"
            class="w-full gab-3"
            :class="{ 'pb-0': !isEntryOpen(entryIndex) }"
          >
            <!-- แต่ละ section ภายใน entry -->
            <div
              v-for="(section, sectionIndex) in entry"
              :key="sectionIndex"
              :class="{ hidden: sectionIndex > 0 && !isEntryOpen(entryIndex) }"
            >
              <CardHeader :class="{ 'pb-0': !isEntryOpen(entryIndex) }">
                <div
                  class="flex flex-row pb-2 justify-between items-center"
                  :class="
                    isEntryOpen(entryIndex) && section.topic
                      ? 'border-b-2 mb-2'
                      : 'border-b-0 hidden'
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
                    class="p-1 rounded-md hover:bg-muted transition-colors duration-150"
                    @click="toggleEntry(entryIndex)"
                  >
                    <ChevronUp
                      class="w-5 h-5 text-muted-foreground transition-transform duration-300"
                      :class="isEntryOpen(entryIndex) ? 'rotate-0 ' : 'hidden'"
                    />
                  </button>
                </div>
              </CardHeader>

              <!-- Collapsed: แสดงสรุปข้อมูล -->
              <div
                class="grid transition-all duration-300 ease-in-out overflow-hidden"
                :class="
                  !isEntryOpen(entryIndex) && isDropdown === true
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] hidden'
                "
              >
                <div class="overflow-hidden">
                  <CardContent class="pt-0">
                    <div class="flex flex-col gap-1 pb-4">
                      <!-- รวมสรุปจากทุก section ใน entry -->
                      <template v-for="(sec, secIdx) in entry" :key="secIdx">
                        <template v-for="value in sec.content" :key="value.name">
                          <p v-if="value.isShow" class="text-sm text-muted-foreground">
                            <span class="font-medium text-foreground">{{ value.label }}</span> :
                            {{ value.label }}
                          </p>
                        </template>
                      </template>
                      <button
                        v-if="sectionIndex === 0 && isDropdown === true"
                        type="button"
                        class="p-1 rounded-md hover:bg-muted transition-colors duration-150 self-end"
                        @click="toggleEntry(entryIndex)"
                      >
                        <ChevronUp
                          class="w-5 h-5 text-muted-foreground transition-transform duration-300"
                          :class="isEntryOpen(entryIndex) ? 'hidden' : 'rotate-180'"
                        />
                      </button>
                    </div>
                  </CardContent>
                </div>
              </div>

              <!-- Expanded: แสดงฟอร์ม -->
              <div
                class="grid transition-all duration-300 ease-in-out overflow-hidden"
                :class="
                  isEntryOpen(entryIndex)
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                "
              >
                <div class="overflow-hidden">
                  <CardContent class="pt-0">
                    <form :id="`form-${entryIndex}-${sectionIndex}`" @submit="onSubmit">
                      <!-- non-file fields -->
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <VeeField
                          v-for="fieldItem in section.content.filter((f) => f.type !== 'file')"
                          :key="fieldItem.name"
                          v-slot="{ field: veeField, errors }"
                          :name="fieldItem.name"
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
                              v-bind="veeField"
                              :type="fieldItem.type"
                              :placeholder="
                                fieldItem.placeholder || fieldItem.label || fieldItem.name
                              "
                              autocomplete="off"
                              :aria-invalid="!!errors.length"
                              :disabled="fieldItem.disabled"
                              class="disabled:opacity-50"
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
                              v-bind="veeField"
                              :placeholder="
                                fieldItem.placeholder || fieldItem.label || fieldItem.name
                              "
                              :disabled="fieldItem.disabled"
                              class="min-h-20 resize-none disabled:opacity-50"
                              :aria-invalid="!!errors.length"
                            />

                            <FieldError v-if="errors.length" :errors="errors" />
                          </Field>
                        </VeeField>
                      </div>

                      <!-- file fields -->
                      <div
                        v-if="section.content.some((f) => f.type === 'file')"
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4"
                      >
                        <div
                          v-for="fieldItem in section.content.filter((f) => f.type === 'file')"
                          :key="fieldItem.name"
                        >
                          <FieldLabel v-if="fieldItem.label" :for="`form-field-${fieldItem.name}`">
                            {{ fieldItem.label }}
                            <span v-if="fieldItem.required" class="text-red-500">*</span>
                          </FieldLabel>
                          <p
                            v-if="fieldItem.placeholder"
                            class="text-xs text-muted-foreground mb-2"
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
                            class="px-4 py-2 rounded-lg font-semibold text-sm"
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
                              class="flex items-center gap-2 text-sm border-2 rounded-2xl p-2 w-max h-10 justify-between border-muted bg-muted/50"
                            >
                              <span class="truncate">{{ file.name }}</span>
                              <span class="text-xs text-muted-foreground shrink-0">
                                {{ formatFileSize(file.size) }}
                              </span>
                              <button
                                v-if="!fieldItem.disabled"
                                type="button"
                                class="p-0.5 rounded hover:text-destructive text-muted-foreground transition-colors"
                                @click.stop="removeFile(fieldItem.name, fileIdx)"
                              >
                                <X class="w-3.5 h-3.5" />
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
                          class="border-2 rounded-lg py-2 gap-1 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors duration-200"
                          @click="addSubEntry(entryIndex, sectionIndex)"
                        >
                          <button
                            type="button"
                            class="rounded-full flex items-center justify-center"
                            aria-label="เพิ่มข้อมูล"
                          >
                            <CirclePlus class="w-5 h-5 sm:w-8 sm:h-8" stroke-width="3" />
                          </button>
                          <p class="font-semibold text-xs">เพิ่มข้อมูล</p>
                        </div>

                        <!-- sub-entries list -->
                        <div
                          v-for="(subEntry, subIdx) in getSubEntries(entryIndex, sectionIndex)"
                          :key="subIdx"
                          class="flex items-end gap-4 mt-3"
                        >
                          <div class="grid grid-cols-1 gap-4 sm:grid-cols-4 flex-1">
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
                            class="shrink-0 mb-0.5"
                            @click="deleteSubEntry(entryIndex, sectionIndex, subIdx)"
                          >
                            <Trash2 class="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </div>
              </div>
            </div>

            <!-- ปุ่มบันทึก / ลบ (ซ่อนเมื่อ readonly) -->
            <CardFooter
              v-if="!readonly"
              class="gap-2 pt-0 px-6"
              :class="!isEntryOpen(entryIndex) ? 'hidden' : 'flex justify-end'"
            >
              <Button
                type="button"
                variant="destructive"
                class="px-6 py-2 rounded-lg font-semibold shadow-sm"
                @click="deleteEntry(entryIndex)"
              >
                <Trash2 class="w-4 h-4 mr-1" />
                ลบ
              </Button>
              <Button
                type="button"
                class="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2 rounded-lg font-semibold shadow-sm"
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
