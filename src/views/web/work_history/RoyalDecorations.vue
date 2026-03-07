<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

const isEditMode = true

function handleSave(groupIndex: number) {
  toast(`บันทึกข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}

function handleDelete(groupIndex: number) {
  toast(`ลบข้อมูลกลุ่มที่ ${groupIndex + 1} สำเร็จ`, { position: 'bottom-right' })
}
</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    <CreateForm
      :isDropdown="false"
      :readonly="!isEditMode"
      :fields="[
        [
          {
            content: [
              {
                name: 'gazette-date',
                label: 'วันที่ประกาศในราชกิจจา',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: 'เลือกระดับการศึกษา',
                options: [],
              },
              {
                name: 'year',
                label: 'ประจำปี',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'class-rank',
                label: 'ชั้นตรา',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'volume-no',
                label: 'เล่มที่',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'section-no',
                label: 'ตอนที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'dated',
                label: 'ลงวันที่',
                type: 'text',
                placeholder: '',
              },
              {
                name: 'page',
                label: 'หน้า',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'important-no',
                label: 'สำคัญที่',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'announcement-file',
                label: 'แนบประกาศ',
                type: 'file',
                required: true,
                accept: '.pdf,.jpg,.png',
                multiple: true,
              },
            ],
          },
        ],
      ]"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>

  <!-- ปุ่มบันทึก -->
  <div
    class="shrink-0 flex justify-end border-t border-gray-200 bg-white dark:bg-background rounded-b-xl p-3 mx-4 sm:mx-6"
  >
    <Button
      class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
    >
      บันทึก
    </Button>
  </div>
</template>
