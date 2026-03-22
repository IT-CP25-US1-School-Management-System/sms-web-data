<script setup lang="ts">
import { FileText, X, ChevronUp } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'

import { ref, computed } from 'vue'
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const formRef = ref<any>(null)

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

// Build schema for PA validation
const paFileSchema = computed(() => {
  const shape: Record<string, any> = {}
  paSections.forEach((section, idx) => {
    shape[`pa-${idx}-count`] = z.number().min(1, `${section} จำเป็นต้องแนบไฟล์`)
  })
  return toTypedSchema(z.object(shape))
})

const initialValues = computed(() => {
  const vals: Record<string, any> = {}
  paSections.forEach((_, idx) => {
    vals[`pa-${idx}-count`] = fileMap.value[`pa-${idx}`]?.length || 0
  })
  return vals
})

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
  const idx = key.split('-')[1]
  formRef.value?.setFieldValue(`pa-${idx}-count`, fileMap.value[key].length, false)
  formRef.value?.validateField?.(`pa-${idx}-count`)
}

function removeFile(key: string, idx: number) {
  fileMap.value[key]?.splice(idx, 1)
  // Sync file count to form and validate
  const sectionIdx = key.split('-')[1]
  formRef.value?.setFieldValue(`pa-${sectionIdx}-count`, fileMap.value[key]?.length || 0, false)
  formRef.value?.validateField?.(`pa-${sectionIdx}-count`)
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
  toast.success('บันทึก PA เอกสารสำเร็จ', { position: 'bottom-right' })
  console.log('PA Documents submitted:', values)
}

async function submitPAForm() {
  // Mark all PA fields as touched and validate
  for (const idx of paSections.keys()) {
    formRef.value?.setFieldTouched?.(`pa-${idx}-count`, true, true)
    await formRef.value?.validateField?.(`pa-${idx}-count`)
  }
  // Submit form
  await formRef.value?.submitForm()
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <VeeForm
      ref="formRef"
      :validation-schema="paFileSchema"
      :initial-values="initialValues"
      @submit="onSubmit"
    >
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
            :class="paOpenState[sIdx] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden">
              <CardContent class="pt-3">
                <p class="mb-2 text-sm font-semibold">แนบไฟล์ PDF</p>
                <VeeField :name="`pa-${sIdx}-count`" v-slot="{ errors }">
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
                  <FieldError v-if="errors.length" :errors="errors" class="mt-2" />
                </VeeField>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </VeeForm>
  </div>
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      type="button"
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      @click="submitPAForm"
    >
      บันทึก
    </Button>
  </div>
</template>

<style></style>
