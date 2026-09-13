<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ExternalLink, Loader2 } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FileDocument } from '@/types/document'

const props = defineProps<{
  open: boolean
  resource: FileDocument | null
}>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const loading = ref(false)
const error = ref('')
const previewUrl = ref('')
const contentType = ref('')
let generation = 0

const fileKind = computed<'pdf' | 'image' | 'unsupported'>(() => {
  const type = contentType.value.toLowerCase()
  const name = props.resource?.original_filename.toLowerCase() || ''
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name)) return 'image'
  return 'unsupported'
})

function revokePreviewUrl() {
  if (!previewUrl.value) return
  window.URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function reset() {
  generation++
  loading.value = false
  error.value = ''
  contentType.value = ''
  revokePreviewUrl()
}

async function loadPreview() {
  const resource = props.resource
  if (!props.open || !resource) return
  const current = ++generation
  loading.value = true
  error.value = ''
  contentType.value = resource.content_type || ''
  revokePreviewUrl()
  try {
    const response = await fetch(resource.url, { credentials: 'include' })
    if (!response.ok) throw new Error('ไม่สามารถโหลดไฟล์ตัวอย่างได้')
    const blob = await response.blob()
    if (current !== generation) return
    contentType.value = blob.type || resource.content_type || ''
    previewUrl.value = window.URL.createObjectURL(blob)
    if (fileKind.value === 'unsupported')
      error.value = 'ไฟล์ประเภทนี้ยังไม่รองรับการแสดงตัวอย่าง กรุณาเปิดในแท็บใหม่'
  } catch (cause) {
    if (current === generation)
      error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดไฟล์ตัวอย่างได้'
  } finally {
    if (current === generation) loading.value = false
  }
}

watch([() => props.open, () => props.resource], ([open]) => {
  if (open) void loadPreview()
  else reset()
})
onBeforeUnmount(reset)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-[98vw] max-w-[98vw] sm:max-w-[96vw] 2xl:max-w-[1600px]">
      <DialogHeader class="pr-8">
        <DialogTitle>ดูตัวอย่างไฟล์</DialogTitle>
        <DialogDescription class="break-all">
          {{ resource?.original_filename || '-' }}
        </DialogDescription>
      </DialogHeader>
      <div class="text-muted-foreground flex items-center justify-between gap-3 text-xs">
        <span>{{ contentType || resource?.content_type || 'ไม่พบประเภทไฟล์' }}</span>
        <a
          v-if="resource?.url"
          :href="resource.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary inline-flex items-center gap-1 underline underline-offset-2"
        >
          <ExternalLink class="h-4 w-4" />เปิดแท็บใหม่
        </a>
      </div>
      <div class="bg-muted/20 overflow-hidden rounded-md border">
        <div v-if="loading" class="flex h-[82vh] items-center justify-center">
          <div class="text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 class="text-primary h-6 w-6 animate-spin" />
            <span>กำลังโหลดตัวอย่างไฟล์...</span>
          </div>
        </div>
        <div
          v-else-if="error"
          class="text-muted-foreground flex h-[82vh] items-center justify-center px-6 text-center text-sm"
        >
          {{ error }}
        </div>
        <iframe
          v-else-if="fileKind === 'pdf' && previewUrl"
          :src="previewUrl"
          class="h-[82vh] w-full"
          title="preview-document"
        />
        <div
          v-else-if="fileKind === 'image' && previewUrl"
          class="bg-background flex h-[82vh] items-center justify-center p-4"
        >
          <img
            :src="previewUrl"
            :alt="resource?.original_filename || 'preview-document'"
            class="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
