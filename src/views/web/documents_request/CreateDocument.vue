<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
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
import { ChevronUp, FileText, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

/* ──────────────────── ประเภทคำร้อง ──────────────────── */
const requestTypeOptions = [
  { label: 'คำร้องขอเอกสาร', value: '1' },
  { label: 'คำขอบัตรประจำตัว', value: '2' },
  { label: 'คำร้องขออนุญาตไปต่างประเทศ', value: '3' },
  { label: 'แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ', value: '4' },
  { label: 'การประเมินผลการพัฒนางานตามข้อตกลง PA', value: '5' },
  { label: 'การส่ง PA2 กับ PA3', value: '6' },
]

/* ──────────────────── Common state ──────────────────── */
const title = ref('')
const requestType = ref('')

/* ──────────────────── Type 1: คำร้องขอเอกสาร ──────────────────── */
const chkSalary = ref(false)
const salaryQty = ref('')
const chkWork = ref(false)
const workQty = ref('')
const chkLetter = ref(false)
const letterBank = ref('')
const letterQty = ref('')

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

/* ──────────────────── Type 5: PA – collapsible sections ──────────────────── */
const paSections = [
  'แบบข้อตกลงในการพัฒนางาน PA1',
  'แบบบันทึกขอหมายลิขบุคลากรที่มีวิไขปฏิบัติงาน',
  'รายงานกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ PLC',
  'รายงานการวิจัย',
  'แผนการจัดการเรียนรู้',
  'สรุปผลการเยี่ยมบ้านนักเรียน',
  'รายงานการประเมินตนเอง T-SAR',
  'KP Innovative',
]
const paOpenState = ref<Record<number, boolean>>(
  Object.fromEntries(paSections.map((_, i) => [i, true])),
)

/* ──────────────────── Type 6: การส่ง PA2 กับ PA3 ──────────────────── */
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
  chkSalary.value = false
  salaryQty.value = ''
  chkWork.value = false
  workQty.value = ''
  chkLetter.value = false
  letterBank.value = ''
  letterQty.value = ''
  chkDegree.value = false
  chkMarriage.value = false
  chkDivorce.value = false
  chkLetter4.value = false
  letterBank4.value = ''
  letterQty4.value = ''
  fileMap.value = {}
  pa2GroupSubject.value = ''
  pa2TeachLevel1.value = ''
  pa2TeachLevel2.value = ''
  pa2Subject.value = ''
  pa2TeachHours.value = ''
  pa2SupportHours.value = ''
  pa2QualityHours.value = ''
  pa2PolicyHours.value = ''
  pa2Evaluator1.value = ''
  pa2Evaluator2.value = ''
  pa2Evaluator3.value = ''
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <Card class="w-full gap-3 pb-6">
      <CardContent>
        <!-- ══════════ Header: หัวข้อ + ประเภทคำร้อง ══════════ -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>หัวข้อ <span class="text-red-500">*</span></FieldLabel>
            <Input v-model="title" type="text" placeholder="หัวข้อ" />
          </Field>
          <Field>
            <FieldLabel>ประเภทคำร้อง <span class="text-red-500">*</span></FieldLabel>
            <Select v-model="requestType">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="เลือกประเภทคำร้อง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in requestTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <!-- Type 1: คำร้องขอเอกสาร -->
        <template v-if="requestType === '1'">
          <Separator class="my-4" />

          <!-- ใบรับรองเงินเดือน -->
          <div class="mb-4 flex flex-wrap items-end gap-4">
            <div class="mt-2 flex min-w-40 items-center gap-2">
              <Checkbox id="chk-salary" v-model:checked="chkSalary" />
              <Label for="chk-salary" class="cursor-pointer">ใบรับรองเงินเดือน</Label>
            </div>
            <Field class="w-64">
              <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="letterQty4" type="number" min="1" max="100" placeholder="กรอกจำนวน" />
            </Field>
          </div>

          <!-- ใบรับรองการปฏิบัติงาน -->
          <div class="mb-4 flex flex-wrap items-end gap-4">
            <div class="mt-2 flex min-w-40 items-center gap-2">
              <Checkbox id="chk-work" v-model:checked="chkWork" />
              <Label for="chk-work" class="cursor-pointer">ใบรับรองการปฏิบัติงาน</Label>
            </div>
            <Field class="w-64">
              <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
              <Input v-model="letterQty4" type="number" min="1" max="100" placeholder="กรอกจำนวน" />
            </Field>
          </div>

          <!-- เอกสารหนังสือผ่านสิทธิ์ -->
          <div class="mb-4 flex flex-wrap items-center gap-4">
            <div class="mt-2 flex min-w-40 items-center gap-2">
              <Checkbox id="chk-letter" v-model:checked="chkLetter" />
              <Label for="chk-letter" class="cursor-pointer">เอกสารหนังสือผ่านสิทธิ์</Label>
            </div>
            <Field class="w-64">
              <FieldLabel>ธนาคาร <span class="text-red-500">*</span></FieldLabel>
              <Select v-model="letterBank">
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
              <Input v-model="letterQty" type="number" min="1" max="100" placeholder="กรอกจำนวน" />
            </Field>
          </div>

          <!-- แนบสลิปเงินเดือน -->
          <div class="mt-2">
            <p class="mb-2 text-sm font-semibold">แนบสลิปเงินเดือน</p>
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
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร</p>
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
              <p class="mb-2 text-sm font-semibold">แนบเอกสาร</p>
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

        <!-- 
             Type 5: การประเมินผลการพัฒนางานตามข้อตกลง PA
         -->
        <template v-if="requestType === '5'">
          <div class="mt-4 flex flex-col gap-3">
            <Card
              v-for="(section, sIdx) in paSections"
              :key="sIdx"
              class="w-full gap-0"
              :class="{ 'pb-0': !paOpenState[sIdx] }"
            >
              <CardHeader :class="{ 'pb-0': !paOpenState[sIdx] }">
                <div
                  class="flex cursor-pointer flex-row items-center justify-between"
                  @click="paOpenState[sIdx] = !paOpenState[sIdx]"
                >
                  <CardTitle class="text-sm">{{ section }}</CardTitle>
                  <ChevronUp
                    class="h-5 w-5 transition-transform"
                    :class="paOpenState[sIdx] ? 'rotate-0' : 'rotate-180'"
                  />
                </div>
              </CardHeader>
              <div
                class="grid overflow-hidden transition-all duration-300 ease-in-out"
                :class="
                  paOpenState[sIdx] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                "
              >
                <div class="overflow-hidden">
                  <CardContent class="pt-3">
                    <p class="mb-2 text-sm font-semibold">แนบไฟล์ PDF</p>
                    <input
                      :ref="
                        (el: any) => {
                          if (el) fileInputRefs[`pa-${sIdx}`] = el as HTMLInputElement
                        }
                      "
                      type="file"
                      class="hidden"
                      accept=".pdf"
                      @change="handleFileSelect($event, `pa-${sIdx}`)"
                    />
                    <Button
                      type="button"
                      class="cursor-pointer"
                      @click="triggerFileInput(`pa-${sIdx}`)"
                    >
                      <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                    </Button>
                    <div v-if="fileMap[`pa-${sIdx}`]?.length" class="mt-2 flex flex-col gap-1">
                      <div
                        v-for="(file, i) in fileMap[`pa-${sIdx}`]"
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
                          @click="removeFile(`pa-${sIdx}`, i)"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </template>

        <!--
             Type 6: การส่ง PA2 กับ PA3
        -->
        <template v-if="requestType === '6'">
          <Separator class="my-4" />

          <!-- Row 1: กลุ่มสาระ, ปฏิบัติการสอนชั้น/ระดับ x2, รายวิชา -->
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
        </template>
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
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
    >
      บันทึก
    </Button>
  </div>
</template>
