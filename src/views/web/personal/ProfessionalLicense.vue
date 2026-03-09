<script setup lang="ts">
import NormalForm from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    <NormalForm
      :fields="[
        {
          name: 'license-type',
          label: 'ใบประกอบวิชาชีพ',
          type: 'select',
          required: true,
          placeholder: 'เลือกประเภทใบประกอบวิชาชีพ',
          options: [],
        },
        {
          name: 'license-number',
          label: 'เลขที่ใบประกอบวิชาชีพ',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'issue-date',
          label: 'วันเดือนปีที่ออกบัตร',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'expiry-date',
          label: 'วันเดือนปีบัตรหมดอายุ',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'license-file',
          label: '',
          type: 'file',
          accept: '.pdf,.jpg,.png',
          multiple: true,
        },
      ]"
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
