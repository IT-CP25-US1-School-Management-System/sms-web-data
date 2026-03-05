<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { ChevronUp, CirclePlus, Trash2, X } from 'lucide-vue-next'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
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
  type: 'text' | 'date' | 'select' | 'number' | 'email' | 'textarea' | 'file'
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

                            <!-- date -->
                            <Input
                              v-else-if="fieldItem.type === 'date'"
                              :id="`form-field-${fieldItem.name}`"
                              v-bind="veeField"
                              type="date"
                              :placeholder="fieldItem.placeholder || 'วว / ดด / ปปปป'"
                              :aria-invalid="!!errors.length"
                              :disabled="fieldItem.disabled"
                              class="disabled:opacity-50"
                            />

                            <!-- select -->
                            <NativeSelect
                              v-else-if="fieldItem.type === 'select'"
                              :id="`form-field-${fieldItem.name}`"
                              :model-value="veeField.value"
                              :aria-invalid="!!errors.length"
                              :disabled="fieldItem.disabled"
                              :name="veeField.name"
                              class="w-full"
                              @update:model-value="veeField['onUpdate:modelValue']?.($event)"
                              @blur="veeField.onBlur"
                            >
                              <NativeSelectOption value="" disabled selected>
                                {{ fieldItem.placeholder || 'เลือก...' }}
                              </NativeSelectOption>
                              <NativeSelectOption
                                v-for="opt in fieldItem.options"
                                :key="opt.value"
                                :value="opt.value"
                              >
                                {{ opt.label }}
                              </NativeSelectOption>
                            </NativeSelect>

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
