<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ChevronUp, CalendarIcon, X } from 'lucide-vue-next'

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
import { h, ref ,computed  } from 'vue'
import { label } from '@unovis/ts/components/axis/style'

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


// const onSubmit = handleSubmit((data) => {
//   toast('You submitted the following values:', {
//     description: h(
//       'pre',
//       { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' },
//       h('code', JSON.stringify(data, null, 2)),
//     ),
//     position: 'bottom-right',
//     class: 'flex flex-col gap-2',
//     style: {
//       '--border-radius': 'calc(var(--radius)  + 4px)',
//     },
//   })
// })

type FieldItem = {
  name: string
  label?: string
  type: 'text' | 'date' | 'select' | 'number' | 'email' | 'textarea' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { label: string; value: string }[]
  accept?: string
  multiple?: boolean
}

const emit = defineEmits<{
  (e: 'save', value: Record<string, any>): void
  (e: 'delete', value: Record<string, any>): void
}>()

const props = defineProps<{
  topic?: string
  fields?: FieldItem[]
  values?: Record<string, any>
}>()

const schema = computed(() => {
  const shape: Record<string, any> = {}

  // do not include disabled fields in the validation schema
  props.fields?.filter((f) => !f.disabled).forEach((f) => {
    if (f.required) {
      shape[f.name] = z.string().min(1, `${f.label || f.name} is required`)
    } else {
      shape[f.name] = z.string().optional()
    }
  })

  return toTypedSchema(z.object(shape))
})

const initialValues = ref<Record<string, any>>({})
initialValues.value = { ...(props.values || {}) }

// ref to the internal VeeForm component so parent can trigger submit
const formRef = ref<any>(null)

async function submitForm() {
  try {
    if (formRef.value && typeof formRef.value.submitForm === 'function') {
      await formRef.value.submitForm()
      return true
    }
  } catch (err) {
    console.warn('submitForm failed', err)
  }
  // fallback: try native form element by id
  const el = document.getElementById('form-vee-demo') as HTMLFormElement | null
  if (el) {
    el.requestSubmit()
    return true
  }
  return false
}

defineExpose({ submitForm })

function onSubmit(values: Record<string, any>) {
  initialValues.value = {  ...(values || {}) }
  console.log('submit:', values)
   emit('save', values)
}
//console.log('mapValueToOption', mapValueToOption())
const isOpen = ref(true)

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
</script>

<template>
  <Card class="w-full gap-3" :class="{ 'pb-0': !isOpen }">
    <CardHeader :class="{ 'pb-0': !isOpen }">
      <div
        class="flex flex-row pb-2 justify-between items-center"
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
      class="grid transition-all duration-300 ease-in-out overflow-hidden"
      :class="isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden flex flex-col gap-0">
        <CardContent>
          <VeeForm id="form-vee-demo"
            :validation-schema="schema"
            :initial-values="initialValues"
            @submit="onSubmit"
            :ref="formRef">
            <div class="grid grid-cols-1 gap-3 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 items-start">
              <VeeField
                v-for="fieldItem in fields"
                :key="fieldItem.name"
                v-slot="{ field, errors }"
                :name="fieldItem.name"
                :model-value="values?.[fieldItem.name] ?? undefined"
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
                    v-bind="field"
                    :type="fieldItem.type"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    autocomplete="off"
                    :aria-invalid="!!errors.length"
                    :disabled="fieldItem.disabled"
                    class="disabled:opacity-50 w-full"
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
                        layout="month-and-year"
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

                  <!-- textarea -->
                  <Textarea
                    v-else-if="fieldItem.type === 'textarea'"
                    :id="`form-field-${fieldItem.name}`"
                    v-bind="field"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    :disabled="fieldItem.disabled"
                    class="min-h-20 resize-none disabled:opacity-50 w-full"
                    :aria-invalid="!!errors.length"
                  />
                  <div class="min-h-6">
                    <FieldError v-if="errors.length" :errors="errors" class="ml-0 mt-1" />
                  </div>
                </Field>
              </VeeField>
            </div>
          </VeeForm>
          <!-- file fields -->
          <div
            v-if="fields?.some((f: FieldItem) => f.type === 'file')"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4"
          >
            <div
              v-for="fieldItem in fields?.filter((f: FieldItem) => f.type === 'file')"
              :key="fieldItem.name"
            >
              <FieldLabel v-if="fieldItem.label" :for="`form-field-${fieldItem.name}`" class="mb-2 block text-sm font-medium">
                {{ fieldItem.label }}
                <span v-if="fieldItem.required" class="text-red-500">*</span>
              </FieldLabel>
              <p v-if="fieldItem.placeholder" class="text-xs text-muted-foreground mb-2">
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
              <div v-if="getFiles(fieldItem.name).length" class="mt-2 flex flex-col gap-1">
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
        </CardContent>
      </div>
    </div>
  </Card>
</template>
