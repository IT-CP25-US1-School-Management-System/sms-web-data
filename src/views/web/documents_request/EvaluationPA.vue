<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ref, computed } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'

const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const formRef = ref<any>(null)

const pa2GroupSubject = ref('')
const pa2TeachLevel1 = ref('')
const pa2TeachLevel2 = ref('')
const pa2Subject = ref('')
const pa2TeachHours = ref('')
const pa2SupportHours = ref('')
const pa2QualityHours = ref('')
const pa2PolicyHours = ref('')
const pa2Evaluator1 = ref('')
const pa2Evaluator2 = ref('')
const pa2Evaluator3 = ref('')

// Validation schema
const validationSchema = computed(() => {
  return toTypedSchema(
    z.object({
      pa2GroupSubject: z.string().min(1, 'กลุ่มสาระ จำเป็นต้องเลือก'),
      pa2TeachLevel1: z.string().min(1, 'ปฏิบัติการสอนชั้น/ระดับ จำเป็นต้องกรอก'),
      pa2TeachLevel2: z.string().min(1, 'ปฏิบัติการสอนชั้น/ระดับ จำเป็นต้องกรอก'),
      pa2Subject: z.string().min(1, 'รายวิชา จำเป็นต้องกรอก'),
      pa2TeachHours: z.string().min(1, 'การสอนตามตารางสอน จำเป็นต้องกรอก'),
      pa2SupportHours: z.string().min(1, 'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้ จำเป็นต้องกรอก'),
      pa2QualityHours: z.string().min(1, 'งานพัฒนาคุณภาพการศึกษา จำเป็นต้องกรอก'),
      pa2PolicyHours: z.string().min(1, 'งานตอบสนองนโยบายและจุดเน้น จำเป็นต้องกรอก'),
      pa2Evaluator1: z.string().min(1, 'คนที่ 1 จำเป็นต้องกรอก'),
      pa2Evaluator2: z.string().min(1, 'คนที่ 2 จำเป็นต้องกรอก'),
      pa2Evaluator3: z.string().min(1, 'คนที่ 3 จำเป็นต้องกรอก'),
      'pa2-pa1-count': z.number().min(1, 'PA1 จำเป็นต้องแนบไฟล์'),
      'pa2-eval1-count': z.number().min(1, 'PA2 กรรมการคนที่ 1 จำเป็นต้องแนบไฟล์'),
      'pa2-eval2-count': z.number().min(1, 'PA2 กรรมการคนที่ 2 จำเป็นต้องแนบไฟล์'),
      'pa2-eval3-count': z.number().min(1, 'PA2 กรรมการคนที่ 3 จำเป็นต้องแนบไฟล์'),
    }),
  )
})

const initialValues = computed(() => ({
  pa2GroupSubject: pa2GroupSubject.value,
  pa2TeachLevel1: pa2TeachLevel1.value,
  pa2TeachLevel2: pa2TeachLevel2.value,
  pa2Subject: pa2Subject.value,
  pa2TeachHours: pa2TeachHours.value,
  pa2SupportHours: pa2SupportHours.value,
  pa2QualityHours: pa2QualityHours.value,
  pa2PolicyHours: pa2PolicyHours.value,
  pa2Evaluator1: pa2Evaluator1.value,
  pa2Evaluator2: pa2Evaluator2.value,
  pa2Evaluator3: pa2Evaluator3.value,
  'pa2-pa1-count': fileMap.value['pa2-pa1']?.length || 0,
  'pa2-eval1-count': fileMap.value['pa2-eval1']?.length || 0,
  'pa2-eval2-count': fileMap.value['pa2-eval2']?.length || 0,
  'pa2-eval3-count': fileMap.value['pa2-eval3']?.length || 0,
}))

const groupSubjectOptions = [
  { label: 'ภาษาไทย', value: 'thai' },
  { label: 'คณิตศาสตร์', value: 'math' },
  { label: 'วิทยาศาสตร์และเทคโนโลยี', value: 'science' },
  { label: 'สังคมศึกษา ศาสนาและวัฒนธรรม', value: 'social' },
  { label: 'ศิลปะ', value: 'art' },
  { label: 'สุขศึกษาและพลศึกษา', value: 'health' },
  { label: 'การงานอาชีพ', value: 'career' },
  { label: 'ภาษาต่างประเทศ', value: 'foreign' },
]

function handleFileSelect(event: Event, key: string, multiple = false) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  if (!fileMap.value[key]) fileMap.value[key] = []
  if (multiple) {
    fileMap.value[key].push(...files)
  } else {
    fileMap.value[key] = files.slice(0, 1)
  }
  input.value = ''
  // Sync file count to form and validate
  const countField = `${key}-count`
  formRef.value?.setFieldValue(countField, fileMap.value[key].length, false)
  formRef.value?.validateField?.(countField)
}

function removeFile(key: string, idx: number) {
  fileMap.value[key]?.splice(idx, 1)
  // Sync file count to form and validate
  const countField = `${key}-count`
  formRef.value?.setFieldValue(countField, fileMap.value[key]?.length || 0, false)
  formRef.value?.validateField?.(countField)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function triggerFileInput(key: string) {
  fileInputRefs.value[key]?.click()
}

function onSubmit(values: Record<string, any>) {
  toast.success('บันทึก PA2 เอกสารสำเร็จ', { position: 'bottom-right' })
  console.log('PA2 Evaluation submitted:', values)
}

async function submitPA2Form() {
  // Sync all field values first
  formRef.value?.setFieldValue('pa2GroupSubject', pa2GroupSubject.value)
  formRef.value?.setFieldValue('pa2TeachLevel1', pa2TeachLevel1.value)
  formRef.value?.setFieldValue('pa2TeachLevel2', pa2TeachLevel2.value)
  formRef.value?.setFieldValue('pa2Subject', pa2Subject.value)
  formRef.value?.setFieldValue('pa2TeachHours', pa2TeachHours.value)
  formRef.value?.setFieldValue('pa2SupportHours', pa2SupportHours.value)
  formRef.value?.setFieldValue('pa2QualityHours', pa2QualityHours.value)
  formRef.value?.setFieldValue('pa2PolicyHours', pa2PolicyHours.value)
  formRef.value?.setFieldValue('pa2Evaluator1', pa2Evaluator1.value)
  formRef.value?.setFieldValue('pa2Evaluator2', pa2Evaluator2.value)
  formRef.value?.setFieldValue('pa2Evaluator3', pa2Evaluator3.value)
  formRef.value?.setFieldValue('pa2-pa1-count', fileMap.value['pa2-pa1']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval1-count', fileMap.value['pa2-eval1']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval2-count', fileMap.value['pa2-eval2']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval3-count', fileMap.value['pa2-eval3']?.length || 0)

  // Mark all fields as touched and validate
  const fieldNames = [
    'pa2GroupSubject',
    'pa2TeachLevel1',
    'pa2TeachLevel2',
    'pa2Subject',
    'pa2TeachHours',
    'pa2SupportHours',
    'pa2QualityHours',
    'pa2PolicyHours',
    'pa2Evaluator1',
    'pa2Evaluator2',
    'pa2Evaluator3',
    'pa2-pa1-count',
    'pa2-eval1-count',
    'pa2-eval2-count',
    'pa2-eval3-count',
  ]

  for (const fieldName of fieldNames) {
    formRef.value?.setFieldTouched?.(fieldName, true, true)
    await formRef.value?.validateField?.(fieldName)
  }

  // Submit form
  await formRef.value?.submitForm()
}
</script>
<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <Card class="w-full gap-3 pb-6">
      <CardContent>
        <VeeForm
          ref="formRef"
          :validation-schema="validationSchema"
          :initial-values="initialValues"
          @submit="onSubmit"
        >
          <Separator class="my-4" />
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <VeeField name="pa2GroupSubject" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>กลุ่มสาระ <span class="text-red-500">*</span></FieldLabel>
                <Select
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2GroupSubject = v
                    }
                  "
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="เลือก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="g in groupSubjectOptions" :key="g.value" :value="g.value">
                      {{ g.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2TeachLevel1" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2TeachLevel1 = v
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2TeachLevel2" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2TeachLevel2 = v
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2Subject" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>รายวิชา <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2Subject = v
                    }
                  "
                  type="text"
                  placeholder="เช่น 1.ภาษาอังกฤษ1 ชั้น ม.4"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <!-- Row 2: ชม.การสอน x4 -->
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <VeeField name="pa2TeachHours" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>การสอนตามตารางสอน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2TeachHours = v
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2SupportHours" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานส่งเสริมและสนับสนุนการจัดการเรียนรู้
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2SupportHours = v
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2QualityHours" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานพัฒนาคุณภาพการศึกษาของสถานศึกษา
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2QualityHours = v
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2PolicyHours" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานตอบสนองนโยบายและจุดเน้น <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2PolicyHours = v
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <!-- Row 3: รายชื่อคณะกรรมการประเมิน -->
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <VeeField name="pa2Evaluator1" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการประเมิน คนที่ 1 <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2Evaluator1 = v
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2Evaluator2" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการผู้ประเมิน คนที่ 2
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2Evaluator2 = v
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2Evaluator3" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการผู้ประเมิน คนที่ 3
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2Evaluator3 = v
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <!-- File uploads: PA1, PA2 (กรรมการ 1-3) -->
          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <VeeField name="pa2-pa1-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">ข้อตกลงPA (PA1)</p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa1
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-pa1'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-pa1')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-pa1')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-pa1']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-pa1']"
                    :key="i"
                    class="border-muted bg-muted/50 flex h-10 w-max items-center gap-2 rounded-2xl border-2 p-2 text-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5"
                      @click="removeFile('pa2-pa1', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <FieldError v-if="errors.length" :errors="errors" />
              </div>
            </VeeField>
            <VeeField name="pa2-eval1-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">PA2 (กรรมการคนที่1 ผู้อำนวยการ)</p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ1
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-eval1'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-eval1')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-eval1')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-eval1']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-eval1']"
                    :key="i"
                    class="border-muted bg-muted/50 flex h-10 w-max items-center gap-2 rounded-2xl border-2 p-2 text-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5"
                      @click="removeFile('pa2-eval1', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <FieldError v-if="errors.length" :errors="errors" />
              </div>
            </VeeField>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <VeeField name="pa2-eval2-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">PA2 (กรรมการคนที่ 2)</p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ2
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-eval2'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-eval2')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-eval2')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-eval2']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-eval2']"
                    :key="i"
                    class="border-muted bg-muted/50 flex h-10 w-max items-center gap-2 rounded-2xl border-2 p-2 text-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5"
                      @click="removeFile('pa2-eval2', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <FieldError v-if="errors.length" :errors="errors" />
              </div>
            </VeeField>
            <VeeField name="pa2-eval3-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">PA2 (กรรมการคนที่ 3)</p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ3
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-eval3'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-eval3')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-eval3')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-eval3']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-eval3']"
                    :key="i"
                    class="border-muted bg-muted/50 flex h-10 w-max items-center gap-2 rounded-2xl border-2 p-2 text-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5"
                      @click="removeFile('pa2-eval3', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <FieldError v-if="errors.length" :errors="errors" />
              </div>
            </VeeField>
          </div>
        </VeeForm>
      </CardContent>
    </Card>
  </div>
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      type="button"
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      @click="submitPA2Form"
    >
      บันทึก
    </Button>
  </div>
</template>
<style></style>
