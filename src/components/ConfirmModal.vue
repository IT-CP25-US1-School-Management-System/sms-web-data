<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { computed } from 'vue'
const props = defineProps<{
  action: string
  topic?: string
  value?: string
}>()

const emit = defineEmits<{
  (e: 'confirm', action: boolean): void
}>()

const topic = computed(() => {
  switch (props.action) {
    case 'delete':
      return 'ลบ'
    case 'update':
      return 'แก้ไข'
    default:
      return 'เพิ่ม'
  }
})
</script>
<template>
  <Dialog
    :open="true"
    @update:open="
      (open) => {
        if (!open) emit('confirm', false)
      }
    "
  >
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ topic }} {{ props.topic }}</DialogTitle>
        <DialogDescription>
          ท่านกำลังจะ{{ topic }} ข้อมูล{{ props.value ? `ของ ${props.value}` : '' }}
          กรุณายืนยันการดำเนินการ
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          class="cursor-pointer bg-[#b11717] text-white hover:bg-[#8d1717]"
          type="button"
          form="dialogForm"
          @click="emit('confirm', false)"
        >
          ยกเลิก
        </Button>
        <Button
          class="cursor-pointer bg-[#16A34A] text-white hover:bg-[#15803D]"
          type="submit"
          form="dialogForm"
          @click="emit('confirm', true)"
        >
          ตกลง
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
<style></style>
