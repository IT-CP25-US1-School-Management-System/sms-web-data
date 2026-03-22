<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ref  } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
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


</script>
<template> 
 <!-- Row 1: กลุ่มสาระ, ปฏิบัติการสอนชั้น/ระดับ x2, รายวิชา -->
<div class="mx-6 flex flex-col gap-4 pb-6">
    <Card class="w-full gap-3 pb-6">
        <CardContent>

  <Separator class="my-4" />
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <Field>
              <FieldLabel>กลุ่มสาระ <span class="text-red-500">*</span></FieldLabel>
              <Select v-model="pa2GroupSubject">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="g in groupSubjectOptions" :key="g.value" :value="g.value">
                    {{ g.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="pa2TeachLevel1" type="text" placeholder="" />
            </Field>
            <Field>
              <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="pa2TeachLevel2" type="text" placeholder="" />
            </Field>
            <Field>
              <FieldLabel>รายวิชา <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="pa2Subject" type="text" placeholder="เช่น 1.ภาษาอังกฤษ1 ชั้น ม.4" />
            </Field>
          </div>

          <!-- Row 2: ชม.การสอน x4 -->
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <Field>
              <FieldLabel>การสอนตามตารางสอน <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="pa2TeachHours" type="text" placeholder="จำนวนชั่วโมง / สัปดาห์" />
            </Field>
            <Field>
              <FieldLabel
                >งานส่งเสริมและสนับสนุนการจัดการเรียนรู้
                <span class="text-red-500">*</span></FieldLabel
              >
              <Input v-model="pa2SupportHours" type="text" placeholder="จำนวนชั่วโมง / สัปดาห์" />
            </Field>
            <Field>
              <FieldLabel
                >งานพัฒนาคุณภาพการศึกษาของสถานศึกษา <span class="text-red-500">*</span></FieldLabel
              >
              <Input v-model="pa2QualityHours" type="text" placeholder="จำนวนชั่วโมง / สัปดาห์" />
            </Field>
            <Field>
              <FieldLabel
                >งานตอบสนองนโยบายและจุดเน้น <span class="text-red-500">*</span></FieldLabel
              >
              <Input v-model="pa2PolicyHours" type="text" placeholder="จำนวนชั่วโมง / สัปดาห์" />
            </Field>
          </div>

          <!-- Row 3: รายชื่อคณะกรรมการประเมิน -->
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <Field>
              <FieldLabel
                >รายชื่อคณะกรรมการประเมิน คนที่ 1 <span class="text-red-500">*</span></FieldLabel
              >
              <Input v-model="pa2Evaluator1" type="text" placeholder="" />
            </Field>
            <Field>
              <FieldLabel
                >รายชื่อคณะกรรมการผู้ประเมิน คนที่ 2 <span class="text-red-500">*</span></FieldLabel
              >
              <Input v-model="pa2Evaluator2" type="text" placeholder="" />
            </Field>
            <Field>
              <FieldLabel
                >รายชื่อคณะกรรมการผู้ประเมิน คนที่ 3 <span class="text-red-500">*</span></FieldLabel
              >
              <Input v-model="pa2Evaluator3" type="text" placeholder="" />
            </Field>
          </div>

          <!-- File uploads: PA1, PA2 (กรรมการ 1-3) -->
          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
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
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
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
            </div>
          </div>    

        </CardContent>
        </Card>
    </div>
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      type="button"
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
     
    >
      บันทึก
    </Button>
  </div>
</template>
<style>
</style>