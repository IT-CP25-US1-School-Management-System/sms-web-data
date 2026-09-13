<script setup lang="ts">
import { ref } from 'vue'
import { Download, Eye, FileText, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { downloadDocumentFile } from '@/stores/api'
import type { FileDocument } from '@/types/document'

const props = defineProps<{
  documentKey: string
  resource: FileDocument | null
}>()
const emit = defineEmits<{ preview: [resource: FileDocument] }>()
const downloading = ref(false)

function formatFileSize(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function preview() {
  if (props.resource) emit('preview', props.resource)
}

async function download() {
  if (!props.resource || downloading.value) return
  downloading.value = true
  try {
    const { blob, filename } = await downloadDocumentFile(props.documentKey)
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  } catch {
    toast.error('ดาวน์โหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่ หรือตรวจสอบสิทธิ์เข้าถึงไฟล์')
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div
    :class="[
      'bg-muted/20 flex flex-wrap items-center gap-3 rounded-md border p-3 transition-colors outline-none',
      resource &&
        'hover:bg-muted/60 hover:border-primary/40 focus-visible:ring-ring cursor-pointer focus-visible:ring-2',
    ]"
    :role="resource ? 'button' : undefined"
    :tabindex="resource ? 0 : undefined"
    :aria-label="resource ? `ดูตัวอย่างไฟล์ ${resource.original_filename}` : undefined"
    @click="preview"
    @keydown.enter="preview"
    @keydown.space.prevent="preview"
  >
    <FileText class="text-primary h-5 w-5 shrink-0" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ resource?.original_filename || documentKey }}</p>
      <p class="text-muted-foreground mt-1 text-xs">
        {{ formatFileSize(resource?.size) }} · {{ resource?.content_type || 'ไม่พบประเภทไฟล์' }}
      </p>
    </div>
    <template v-if="resource">
      <Eye class="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :disabled="downloading"
        :aria-label="`ดาวน์โหลดไฟล์ ${resource.original_filename}`"
        title="ดาวน์โหลดไฟล์"
        @click.stop="download"
        @keydown.stop
      >
        <Loader2 v-if="downloading" class="h-4 w-4 animate-spin" />
        <Download v-else class="h-4 w-4" />
      </Button>
    </template>
    <span v-else class="text-destructive text-xs">โหลดข้อมูลไฟล์ไม่สำเร็จ</span>
  </div>
</template>
