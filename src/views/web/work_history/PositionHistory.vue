<script setup lang="ts">
import NormalForm from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col">
    <!-- Scrollable content area -->
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4">
      <NormalForm
        :fields="[
          {
            name: 'work-group',
            label: 'กลุ่มงาน',
            type: 'text',
            required: true,
            placeholder: '',
          },
          {
            name: 'subject-group',
            label: 'กลุ่มสาระ',
            type: 'text',
            required: true,
            placeholder: '',
          },
          {
            name: 'position',
            label: 'ตำแหน่ง',
            type: 'text',
            required: true,
            placeholder: '',
          },
          {
            name: 'work-status',
            label: 'สถานการทำงาน',
            type: 'text',
            required: true,
            placeholder: '',
          },
          {
            name: 'direct-payment-no',
            label: 'เลขที่จ่ายตรง',
            type: 'text',
            required: true,
            placeholder: '',
          },
          {
            name: 'position-no',
            label: 'เลขที่ตำแหน่ง',
            type: 'text',
            required: true,
            placeholder: '',
          },
          {
            name: 'appointment-type',
            label: 'ประเภทการบรรจุ',
            type: 'select',
            required: true,
            placeholder: 'เลือกประเภทการบรรจุ',
            options: [],
          },
          {
            name: 'appointment-date',
            label: 'ว/ด/ป ที่บรรจุ',
            type: 'date',
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'service-start-date',
            label: 'ว/ด/ป ที่เริ่มปฏิบัติราชการ',
            type: 'date',
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'birth-date',
            label: 'วัน / เดือน / ปี เกษียณ',
            type: 'date',
            required: true,
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'position-held-date',
            label: 'ว/ด/ป ที่ดำรงตำแหน่ง',
            type: 'date',
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'school-service-date',
            label: 'ว/ด/ป ที่ปฏิบัติหน้าที่ในโรงเรียนคณะราษฎร์ฯ',
            type: 'date',
            placeholder: 'วว / ดด / ปปปป',
          },
          {
            name: 'work-age-from-appointment',
            label: 'อายุงาน(นับจากวันบรรจุ)',
            type: 'text',
            placeholder: '',
          },
          {
            name: 'work-age-at-school',
            label: 'อายุงาน ณ โรงเรียนคณะราษฎร์ฯ',
            type: 'text',
            placeholder: '',
          },
        ]"
      />
    </div>

    <!-- ปุ่มบันทึก -->
    <div
      class="sticky bottom-0 right-0 z-40 flex justify-end border-t border-gray-200 bg-white p-3 w-full"
    >
      <Button
        class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
      >
        บันทึก
      </Button>
    </div>
  </div>
</template>
