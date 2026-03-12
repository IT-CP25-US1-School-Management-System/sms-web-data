<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
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
  <div class="mx-6 flex flex-col gap-4">
    <CreateForm
      :isDropdown="true"
      :readonly="!isEditMode"
      :fields="[
        [
          {
            topic: 'ประวัติการมีวิทยฐานะ',
            content: [
              {
                name: 'order-no',
                label: 'คำสั่ง',
                type: 'text',
                required: true,
                isShow: true,
                placeholder: '',
              },
              {
                name: 'rank-position',
                label: 'ตำแหน่งที่ได้รับวิทยฐานะ',
                type: 'select',
                required: true,
                isShow: true,
                placeholder: '',
                options: [],
              },
              {
                name: 'academic-rank',
                label: 'วิทยฐานะ',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'rank-date',
                label: 'วันที่ได้รับวิทยฐานะ',
                type: 'date',
                required: true,
                placeholder: 'วว / ดด / ปปปป',
              },
              {
                name: 'order-file',
                label: 'แนบคำสั่ง',
                type: 'file',
                accept: '.pdf,.jpg,.png',
                multiple: true,
              },
            ],
          },
          {
            topic: 'เงินเดือน',
            content: [
              {
                name: 'compensation',
                label: 'เงินค่าตอบแทน',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'special-monthly-compensation',
                label: 'เงินค่าตอบแทนพิเศษรายเดือนรับ',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'position-allowance',
                label: 'เงินประจำตำแหน่ง',
                type: 'text',
                required: true,
                placeholder: '',
              },
              {
                name: 'special-compensation',
                label: 'เงินค่าตอบแทนพิเศษ',
                type: 'text',
                required: true,
                placeholder: '',
              },
            ],
          },
        ],
      ]"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>
