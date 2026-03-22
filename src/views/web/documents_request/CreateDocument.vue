<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FileText, X } from 'lucide-vue-next'
import { ref, watch, computed } from 'vue'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'


/* ──────────────────── ประเภทคำร้อง ──────────────────── */
const requestTypeOptions = [
  { label: 'คำร้องขอเอกสาร', value: '1' },
  { label: 'คำขอบัตรประจำตัว', value: '2' },
  { label: 'คำร้องขออนุญาตไปต่างประเทศ', value: '3' },
  { label: 'แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ', value: '4' },
  { label: 'คำร้องขอเพิ่มวุติการศึกษา', value: '5' },
]

/* ──────────────────── Common state ──────────────────── */
const title = ref('')
const requestType = ref('')

/* ──────────────────── Type 1: คำร้องขอเอกสาร ──────────────────── */
const salaryQty = ref('')
const workQty = ref('')
const letterBank = ref('')
const letterQty = ref('')

// salary detail local refs (kept in sync with VeeField)
const salary_info = ref('')
const salary_base = ref('')
const salary_compensation = ref('')

const bankOptions = [
  { label: 'ธนาคารกรุงไทย', value: 'krungthai' },
  { label: 'ธนาคารกรุงเทพ', value: 'bangkok' },
  { label: 'ธนาคารกสิกรไทย', value: 'kasikorn' },
  { label: 'ธนาคารไทยพาณิชย์', value: 'scb' },
  { label: 'ธนาคารออมสิน', value: 'gsb' },
]

/* ──────────────────── Type 4: แบบรายงานเปลี่ยนแปลง ──────────────────── */
const chkDegree = ref(false)
const chkMarriage = ref(false)
const chkDivorce = ref(false)
const chkLetter4 = ref(false)
const letterBank4 = ref('')
const letterQty4 = ref('')




/* ──────────────────── File upload helpers ──────────────────── */
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})

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
}

function removeFile(key: string, idx: number) {
  fileMap.value[key]?.splice(idx, idx + 1)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function triggerFileInput(key: string) {
  fileInputRefs.value[key]?.click()
}

/* Reset state when changing request type */
watch(requestType, () => {
  title.value = ''
  salaryQty.value = ''
  workQty.value = ''
  letterBank.value = ''
  letterQty.value = ''
  chkDegree.value = false
  chkMarriage.value = false
  chkDivorce.value = false
  chkLetter4.value = false
  letterBank4.value = ''
  letterQty4.value = ''
  fileMap.value = {}

})

// Build a plain object used as initial-values for VeeForm
const initialValues = computed(() => ({
  requestType: requestType.value,
  title: title.value,

  // type 1
  // ensure checkbox flags exist so dependent fields (disabled bindings) react correctly
  chkSalary: false,
  chkWork: false,
  chkLetter: false,
  salaryQty: salaryQty.value,
  salary_info: salary_info.value,
  salary_base: salary_base.value,
  salary_compensation: salary_compensation.value,
  workQty: workQty.value,
  letterBank: letterBank.value,
  letterQty: letterQty.value,
  slipCount: fileMap.value['slip']?.length || 0,

  // type 4
  chkDegree: chkDegree.value,
  chkMarriage: chkMarriage.value,
  chkDivorce: chkDivorce.value,
  chkLetter4: chkLetter4.value,
  letterBank4: letterBank4.value,
  letterQty4: letterQty4.value,
}))

const schema = computed(() => {
  // base shape
  const shape: Record<string, any> = {
    requestType: z.string().min(1, 'กรุณาเลือกประเภทคำร้อง'),
    title: z.string().optional(),

  chkSalary: z.boolean().optional(),
  salaryQty: z.string().optional(),
  // salary detail fields (required when requestType === '1')
  salary_info: z.string().optional(),
  salary_base: z.string().optional(),
  salary_compensation: z.string().optional(),
    chkWork: z.boolean().optional(),
    workQty: z.string().optional(),
    chkLetter: z.boolean().optional(),
    letterBank: z.string().optional(),
    letterQty: z.string().optional(),
    slipCount: z.number().optional(),

    chkDegree: z.boolean().optional(),
    chkMarriage: z.boolean().optional(),
    chkDivorce: z.boolean().optional(),
    chkLetter4: z.boolean().optional(),
    letterBank4: z.string().optional(),
    letterQty4: z.string().optional(),
  }

  const base = z.object(shape).superRefine((data, ctx) => {
    // requestType specific validations
    if (data.requestType === '1') {
      // require salary detail fields for request type 1
      if (!data.salary_info || String(data.salary_info).trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_info'], message: 'กรุณากรอกข้อมูลเงินเดือน' })
      }
      if (!data.salary_base || String(data.salary_base).trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_base'], message: 'กรุณากรอกเงินวิทยฐานะ' })
      }
      if (!data.salary_compensation || String(data.salary_compensation).trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_compensation'], message: 'กรุณากรอกเงินค่าตอบแทน' })
      }
      // if checkboxes selected, require their qty/bank
      if (data.chkSalary && (!data.salaryQty || String(data.salaryQty).trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salaryQty'], message: 'กรุณากรอกจำนวนใบรับรองเงินเดือน' })
      }
      if (data.chkWork && (!data.workQty || String(data.workQty).trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['workQty'], message: 'กรุณากรอกจำนวนใบรับรองการปฏิบัติงาน' })
      }
      if (data.chkLetter) {
        if (!data.letterBank || String(data.letterBank).trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['letterBank'], message: 'กรุณาเลือกธนาคาร' })
        }
        if (!data.letterQty || String(data.letterQty).trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['letterQty'], message: 'กรุณากรอกจำนวน' })
        }
      }
      // require at least one slip file when relevant (if any of the above selected)
      if ((data.chkSalary || data.chkWork || data.chkLetter) && (!data.slipCount || data.slipCount <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['slipCount'], message: 'กรุณาแนบสลิปเงินเดือน' })
      }
    }

    if (data.requestType === '4') {
      // if chkLetter4 selected require bank + qty
      if (data.chkLetter4) {
        if (!data.letterBank4 || String(data.letterBank4).trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['letterBank4'], message: 'กรุณาเลือกธนาคาร' })
        }
        if (!data.letterQty4 || String(data.letterQty4).trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['letterQty4'], message: 'กรุณากรอกจำนวน' })
        }
      }
    }
  })

  return toTypedSchema(base)
})

function onSubmit(values: Record<string, any>) {
  // build payload including actual fileMap entries
  const payload: Record<string, any> = { ...values }
  // attach file lists
  payload.files = { ...fileMap.value }

  // for now show a toast and log payload
  try {
    console.log('CreateDocument submit payload:', JSON.parse(JSON.stringify(payload, getCircularReplacer())))
  } catch (e) {
    // ignore
  }
  toast.success('Validated — payload ready (check console)')
}

// helper for safe JSON stringify (in case of File objects)
function getCircularReplacer() {
  const seen = new WeakSet()
  return function (_key: any, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return
      seen.add(value)
      // replace File objects with filename for logging
      if (value instanceof File) return { name: value.name, size: value.size, type: value.type }
    }
    return value
  }
}
const formRef = ref<any>(null)

function submitDocForm() {
  // sync ค่าเข้า form ก่อน (เหมือนเดิม)
  formRef.value?.setFieldValue('requestType', requestType.value)
  formRef.value?.setFieldValue('salaryQty', salaryQty.value)

  formRef.value?.setFieldValue('salary_info', salary_info.value ?? '')
  formRef.value?.setFieldValue('salary_base', salary_base.value ?? '')
  formRef.value?.setFieldValue('salary_compensation', salary_compensation.value ?? '')

  formRef.value?.setFieldValue('workQty', workQty.value)
  formRef.value?.setFieldValue('letterBank', letterBank.value)
  formRef.value?.setFieldValue('letterQty', letterQty.value)

  formRef.value?.setFieldValue('slipCount', fileMap.value['slip']?.length || 0)

  // 🔥 สำคัญ: ใช้ submitForm ของ form จริง
  formRef.value?.submitForm()
}

</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    เอาหัวข้อออก  , เพิ่ม 3 กล่อง 1.ข้อมูลเงินเดือน  2.เงืนวิทยฐานะ    3.เงินค่าตอบแทน   ในคำร้องขอเอกสาร    ก่อนที่จะมีการแนบสลิป  เอาการประเมิน PA แยกออกมาเป็ฯอีก tab  , list เพิ่ม  คำร้องขอเพิ่มวุติการศึกษา
    <Card class="w-full gap-3 pb-6">
      <CardContent>
        <VeeForm 
        ref="formRef"
        v-slot="{ values }"
        :validation-schema="schema" 
        :initial-values="initialValues" 
        id="doc-form" @submit="onSubmit">
        <!-- ══════════ Header: หัวข้อ + ประเภทคำร้อง ══════════ -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <VeeField name="requestType" v-slot="{ field, errors }">
            <Field :data-invalid="!!errors.length">
              <FieldLabel>ประเภทคำร้อง <span class="text-red-500">*</span></FieldLabel>
              <Select :model-value="field.value" @update:model-value="(v) => { field.onChange?.(v); requestType = String(v ?? '') }">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="เลือกประเภทคำร้อง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in requestTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>
        </div>

        <!-- Type 1: คำร้องขอเอกสาร -->
        <template v-if="requestType === '1'">
          <Separator class="my-4" />

          <!-- ใบรับรองเงินเดือน -->
          <div class="mb-4 flex flex-wrap items-start gap-4">
            <VeeField name="chkSalary" v-slot="{ field }">
              <div class="mt-2 flex min-w-40 items-center gap-2">
                <Checkbox
                  id="chk-salary"
                  :checked="field.value"
                  @update:checked="(v: any) => field.onChange?.(v)"
                />
                <Label for="chk-salary" class="cursor-pointer">
                  ใบรับรองเงินเดือน
                </Label>
              </div>
            </VeeField>
         

            <VeeField name="salaryQty" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value"
                  @update:model-value="(v: any) => { field.onChange?.(v); salaryQty = String(v ?? '') }"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="กรอกจำนวน"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <!-- ใบรับรองการปฏิบัติงาน -->
          <div class="mb-4 flex flex-wrap items-start gap-4">
              <VeeField name="chkWork" v-slot="{ field }">
              <div class="mt-2 flex min-w-40 items-center gap-2">
                <Checkbox
                  id="chk-work"
                  :checked="field.value"
                  @update:checked="(v: any) => field.onChange?.(v)"
                />
                <Label for="chk-work" class="cursor-pointer">
                  ใบรับรองการปฏิบัติงาน
                </Label>
              </div>
            </VeeField>
             

            <VeeField name="workQty" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value"
                  @update:model-value="(v: any) => { field.onChange?.(v); workQty = String(v ?? '') }"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="กรอกจำนวน"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <!-- เอกสารหนังสือผ่านสิทธิ์ -->
          <div class="mb-4 flex flex-wrap items-start gap-4">
              <VeeField name="chkLetter" v-slot="{ field }">
                <div class="mt-2 flex min-w-40 items-center gap-2">
                  <Checkbox
                    id="chk-letter"
                    :checked="field.value"
                    @update:checked="(v: any) => field.onChange?.(v)"
                  />
                  <Label for="chk-letter" class="cursor-pointer">
                    เอกสารหนังสือผ่านสิทธิ์
                  </Label>
                </div>
              </VeeField>

            <VeeField name="letterBank" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>ธนาคาร <span class="text-red-500">*</span></FieldLabel>
                <Select    :model-value="field.value" @update:model-value="(v: any) => { field.onChange?.(v); letterBank = String(v ?? '') }">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="เลือก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="b in bankOptions" :key="b.value" :value="b.value">
                      {{ b.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>

            <VeeField name="letterQty" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value"
                  @update:model-value="(v: any) => { field.onChange?.(v); letterQty = String(v ?? '') }"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="กรอกจำนวน"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>
          
          <!-- แนบสลิปเงินเดือน -->
          <div class="mt-2">
              <div class="mb-4 flex flex-wrap items-end gap-4">
            <VeeField name="salary_info" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>ข้อมูลเงินเดือน <span class="text-red-500">*</span></FieldLabel>
                <Input :model-value="field.value" @update:model-value="(v) => { field.onChange?.(v); salary_info = String(v ?? '') }" 
                  type="text" placeholder="ข้อมูลเงินเดือน" />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>

            <VeeField name="salary_base" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>เงินวิทยฐานะ <span class="text-red-500">*</span></FieldLabel>
                <Input :model-value="field.value" @update:model-value="(v) => { field.onChange?.(v); salary_base = String(v ?? '') }" type="text" placeholder="เงินวิทยฐานะ" />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>

            <VeeField name="salary_compensation" v-slot="{ field, errors }">
              <Field class="w-64" :data-invalid="!!errors.length">
                <FieldLabel>เงินค่าตอบแทน <span class="text-red-500">*</span></FieldLabel>
                <Input :model-value="field.value" @update:model-value="(v) => { field.onChange?.(v); salary_compensation = String(v ?? '') }" type="text" placeholder="เงินค่าตอบแทน" />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>

          </div>
            <p class="mb-2 text-sm font-semibold">แนบสลิปเงินเดือน<span class="text-red-500"> *</span></p>
            <input
              :ref="
                (el: any) => {
                  if (el) fileInputRefs['slip'] = el as HTMLInputElement
                }
              "
              type="file"
              class="hidden"
              accept=".pdf,.jpg,.png"
              @change="handleFileSelect($event, 'slip')"
            />
            <Button type="button" class="cursor-pointer" @click="triggerFileInput('slip')">
              <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
            </Button>
            <div v-if="fileMap['slip']?.length" class="mt-2 flex flex-col gap-1">
              <div
                v-for="(file, i) in fileMap['slip']"
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
                  @click="removeFile('slip', i)"
                >
                  <X class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Type 2: คำขอบัตรประจำตัว -->
        <template v-if="requestType === '2'">
          <Separator class="my-4" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold">แบบฟอร์มเอกสารคำขอบัตรประจำตัว</p>
              <Button type="button" class="cursor-pointer" variant="default">
                <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
              </Button>
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร<span class="text-red-500"> *</span></p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs['card-doc'] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.png"
                @change="handleFileSelect($event, 'card-doc')"
              />
              <Button
                type="button"
                class="cursor-pointer"
                variant="destructive"
                @click="triggerFileInput('card-doc')"
              >
                <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
              </Button>
              <div v-if="fileMap['card-doc']?.length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, i) in fileMap['card-doc']"
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
                    @click="removeFile('card-doc', i)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Type 3: คำร้องขออนุญาตไปต่างประเทศ -->
        <template v-if="requestType === '3'">
          <Separator class="my-4" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold">แบบฟอร์มเอกสารคำร้องขออนุญาตไปต่างประเทศ</p>
              <Button type="button" class="cursor-pointer" variant="default">
                <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
              </Button>
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร<span class="text-red-500">*</span></p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs['abroad-doc'] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.png"
                @change="handleFileSelect($event, 'abroad-doc')"
              />
              <Button
                type="button"
                class="cursor-pointer"
                variant="destructive"
                @click="triggerFileInput('abroad-doc')"
              >
                <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
              </Button>
              <div v-if="fileMap['abroad-doc']?.length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, i) in fileMap['abroad-doc']"
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
                    @click="removeFile('abroad-doc', i)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Type 4: แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ -->
        <template v-if="requestType === '4'">
          <Separator class="my-4" />

          <!-- Checkboxes -->
          <div class="mb-4 flex flex-wrap items-center gap-6">
            <div class="flex items-center gap-2">
              <Checkbox id="chk-degree" v-model:checked="chkDegree" />
              <Label for="chk-degree" class="cursor-pointer">ได้รับวุฒิเพิ่ม(ปรับวุฒิ)</Label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox id="chk-marriage" v-model:checked="chkMarriage" />
              <Label for="chk-marriage" class="cursor-pointer">จดทะเบียนสมรส</Label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox id="chk-divorce" v-model:checked="chkDivorce" />
              <Label for="chk-divorce" class="cursor-pointer">จดทะเบียนหย่า</Label>
            </div>
          </div>

          <!-- Download + Upload แบบรายงาน -->
          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold">
                แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ
              </p>
              <Button type="button" class="cursor-pointer" variant="default">
                <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
              </Button>
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร<span class="text-red-500">*</span></p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs['report-doc'] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.png"
                @change="handleFileSelect($event, 'report-doc')"
              />
              <Button
                type="button"
                class="cursor-pointer"
                variant="destructive"
                @click="triggerFileInput('report-doc')"
              >
                <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
              </Button>
              <div v-if="fileMap['report-doc']?.length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, i) in fileMap['report-doc']"
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
                    @click="removeFile('report-doc', i)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Separator class="my-4" />

          <!-- เอกสารหนังสือผ่านสิทธิ์ -->
          <div class="mb-4 flex flex-wrap items-center gap-4">
            <div class="mt-2 flex min-w-40 items-center gap-2">
              <Checkbox id="chk-letter4" v-model:checked="chkLetter4" />
              <Label for="chk-letter4" class="cursor-pointer">เอกสารหนังสือผ่านสิทธิ์</Label>
            </div>
            <Field class="w-64">
              <FieldLabel>ธนาคาร <span class="text-red-500">*</span></FieldLabel>
              <Select v-model="letterBank4">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="b in bankOptions" :key="b.value" :value="b.value">
                    {{ b.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field class="w-64">
              <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="letterQty4" type="number" min="1" max="100" placeholder="กรอกจำนวน" />
            </Field>
          </div>

          <!-- Download + Upload แบบคำขอเพิ่ม -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold">
                แบบคำขอเพิ่ม/ปรับปรุงข้อมูลในฐานข้อมูลบุคลากรภาครัฐ
              </p>
              <Button type="button" class="cursor-pointer" variant="default">
                <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
              </Button>
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร<span class="text-red-500">*</span></p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs['update-doc'] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.png"
                @change="handleFileSelect($event, 'update-doc')"
              />
              <Button
                type="button"
                class="cursor-pointer"
                variant="destructive"
                @click="triggerFileInput('update-doc')"
              >
                <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
              </Button>
              <div v-if="fileMap['update-doc']?.length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, i) in fileMap['update-doc']"
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
                    @click="removeFile('update-doc', i)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

           <!-- Type 5: คำร้องขอเพิ่มวุติการศึกษา -->
        <template v-if="requestType === '5'">
          <Separator class="my-4" />

          <!-- Checkboxes -->
          <div class="mb-4 flex flex-wrap items-center gap-6">
            <div class="flex items-center gap-2">
              <Checkbox id="chk-degree" v-model:checked="chkDegree" />
              <Label for="chk-degree" class="cursor-pointer">ได้รับวุฒิเพิ่ม(ปรับวุฒิ)</Label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox id="chk-marriage" v-model:checked="chkMarriage" />
              <Label for="chk-marriage" class="cursor-pointer">จดทะเบียนสมรส</Label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox id="chk-divorce" v-model:checked="chkDivorce" />
              <Label for="chk-divorce" class="cursor-pointer">จดทะเบียนหย่า</Label>
            </div>
          </div>

          <!-- Download + Upload แบบรายงาน -->
          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold">
                แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ
              </p>
              <Button type="button" class="cursor-pointer" variant="default">
                <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
              </Button>
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร</p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs['report-doc'] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.png"
                @change="handleFileSelect($event, 'report-doc')"
              />
              <Button
                type="button"
                class="cursor-pointer"
                variant="destructive"
                @click="triggerFileInput('report-doc')"
              >
                <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
              </Button>
              <div v-if="fileMap['report-doc']?.length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, i) in fileMap['report-doc']"
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
                    @click="removeFile('report-doc', i)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Separator class="my-4" />

          <!-- เอกสารหนังสือผ่านสิทธิ์ -->
          <div class="mb-4 flex flex-wrap items-center gap-4">
            <div class="mt-2 flex min-w-40 items-center gap-2">
              <Checkbox id="chk-letter4" v-model:checked="chkLetter4" />
              <Label for="chk-letter4" class="cursor-pointer">เอกสารหนังสือผ่านสิทธิ์</Label>
            </div>
            <Field class="w-64">
              <FieldLabel>ธนาคาร <span class="text-red-500">*</span></FieldLabel>
              <Select v-model="letterBank4">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="b in bankOptions" :key="b.value" :value="b.value">
                    {{ b.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field class="w-64">
              <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="letterQty4" type="number" min="1" max="100" placeholder="กรอกจำนวน" />
            </Field>
          </div>

          <!-- Download + Upload แบบคำขอเพิ่ม -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold">
                แบบคำขอเพิ่ม/ปรับปรุงข้อมูลในฐานข้อมูลบุคลากรภาครัฐ
              </p>
              <Button type="button" class="cursor-pointer" variant="default">
                <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
              </Button>
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร</p>
              <input
                :ref="
                  (el: any) => {
                    if (el) fileInputRefs['update-doc'] = el as HTMLInputElement
                  }
                "
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.png"
                @change="handleFileSelect($event, 'update-doc')"
              />
              <Button
                type="button"
                class="cursor-pointer"
                variant="destructive"
                @click="triggerFileInput('update-doc')"
              >
                <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
              </Button>
              <div v-if="fileMap['update-doc']?.length" class="mt-2 flex flex-col gap-1">
                <div
                  v-for="(file, i) in fileMap['update-doc']"
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
                    @click="removeFile('update-doc', i)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
     
      
        </VeeForm>
      </CardContent>

      <!-- ══════════ Footer: Submit button ══════════ -->
      <!-- <div v-if="requestType" class="flex justify-end px-6 pb-4">
        <Button type="button" class="cursor-pointer" class="px-6"> ยื่นคำร้อง </Button>
      </div> -->
    </Card>
  </div>
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      type="button"
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      @click="submitDocForm()"
    >
      บันทึก
    </Button>
  </div>
</template>
