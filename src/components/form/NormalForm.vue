<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { X } from 'lucide-vue-next'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { h, ref } from 'vue'

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
  disabled?: boolean
  required?: boolean
  options?: { label: string; value: string }[]
  accept?: string
  multiple?: boolean
}

defineProps<{
  topic?: string
  fields?: FieldItem[]
}>()

// File upload state
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})

function getFiles(fieldName: string): File[] {
  return fileMap.value[fieldName] || []
}

function handleFileSelect(event: Event, fieldItem: FieldItem) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  addFiles(fieldItem, files)
  input.value = ''
}

function addFiles(fieldItem: FieldItem, files: File[]) {
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
  <Card class="w-full gap-3 pb-6 h-full">
    <CardHeader class="pb-0" v-if="topic">
      <div class="flex flex-row pb-2 justify-between items-center border-b-2">
        <slot name="header">
          <CardTitle>{{ topic }}</CardTitle>
        </slot>
      </div>
    </CardHeader>
    <div class="grid overflow-hidden grid-rows-[1fr] opacity-100">
      <div class="overflow-hidden flex flex-col gap-0">
        <CardContent>
          <form id="form-vee-demo" @submit="onSubmit">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <VeeField
                v-for="fieldItem in fields"
                :key="fieldItem.name"
                v-slot="{ field, errors }"
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
                    v-bind="field"
                    :type="fieldItem.type"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    autocomplete="off"
                    :aria-invalid="!!errors.length"
                    :disabled="fieldItem.disabled"
                    class="disabled:opacity-50"
                  />

                  <!-- date -->
                  <Input
                    v-else-if="fieldItem.type === 'date'"
                    :id="`form-field-${fieldItem.name}`"
                    v-bind="field"
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
                    :model-value="field.value"
                    :aria-invalid="!!errors.length"
                    :disabled="fieldItem.disabled"
                    :name="field.name"
                    class="w-full"
                    @update:model-value="field['onUpdate:modelValue']?.($event)"
                    @blur="field.onBlur"
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
                    v-bind="field"
                    :placeholder="fieldItem.placeholder || fieldItem.label || fieldItem.name"
                    :disabled="fieldItem.disabled"
                    class="min-h-20 resize-none disabled:opacity-50"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
            </div>
          </form>

          <!-- file fields -->
          <div
            v-if="fields?.some((f: FieldItem) => f.type === 'file')"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2"
          >
            <div
              v-for="fieldItem in fields?.filter((f: FieldItem) => f.type === 'file')"
              :key="fieldItem.name"
            >
              <FieldLabel v-if="fieldItem.label" :for="`form-field-${fieldItem.name}`">
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
