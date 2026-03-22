<script setup lang="ts">
import { FileText, X ,ChevronUp } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ref  } from 'vue'
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})

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
  <div class="mx-6 flex flex-col gap-4 pb-6">
    
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