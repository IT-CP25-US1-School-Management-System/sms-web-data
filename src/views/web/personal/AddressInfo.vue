<script setup lang="ts">
import NormalForm from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
import { ref } from 'vue'

const addressTypes = ref<string[]>([])
</script>

<template>
  <div class="flex flex-col">
    <!-- Scrollable content area -->
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4">
      <!-- Checkboxes ประเภทที่อยู่ -->
      <div class="flex flex-wrap gap-4 pb-2 mb-2 pl-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="addressTypes"
            value="registered"
            class="rounded border-gray-300"
          />
          <span class="text-sm">ที่อยู่ตามทะเบียนบ้าน</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="addressTypes"
            value="current"
            class="rounded border-gray-300"
          />
          <span class="text-sm">ที่อยู่ปัจจุบัน</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="addressTypes"
            value="retirement"
            class="rounded border-gray-300"
          />
          <span class="text-sm">ที่อยู่หลังเกษียณอายุราชการ</span>
        </label>
      </div>

      <!-- ข้อมูลที่อยู่ -->
      <NormalForm
        :fields="[
          {
            name: 'province',
            label: 'จังหวัด',
            type: 'select',
            required: true,
            placeholder: 'เลือกจังหวัด',
            options: [
              { label: 'กรุงเทพมหานคร', value: 'bangkok' },
              { label: 'เชียงใหม่', value: 'chiangmai' },
              { label: 'ขอนแก่น', value: 'khonkaen' },
            ],
          },
          {
            name: 'postal-code',
            label: 'รหัสไปรษณีย์',
            type: 'text',
            required: true,
            placeholder: 'กรุณาระบุรหัสไปรษณีย์',
          },
          {
            name: 'district',
            label: 'อำเภอ/เขต',
            type: 'select',
            required: true,
            placeholder: 'เลือกอำเภอ/เขต',
            options: [],
          },
          {
            name: 'sub-district',
            label: 'ตำบล/แขวง',
            type: 'select',
            required: true,
            placeholder: 'เลือกตำบล/แขวง',
            options: [],
          },
          {
            name: 'road',
            label: 'ถนน',
            type: 'text',
            placeholder: 'กรุณาระบุถนน',
          },
          {
            name: 'soi',
            label: 'ตรอก/ซอย',
            type: 'text',
            placeholder: 'กรุณาระบุตรอก/ซอย',
          },
          {
            name: 'village',
            label: 'หมู่บ้าน/อาคาร',
            type: 'text',
            placeholder: 'กรุณาระบุหมู่บ้าน/อาคาร',
          },
          {
            name: 'moo',
            label: 'หมู่ที่',
            type: 'text',
            placeholder: 'กรุณาระบุหมู่ที่',
          },
          {
            name: 'house-no',
            label: 'บ้านเลขที่',
            type: 'text',
            placeholder: 'กรุณาระบุบ้านเลขที่',
          },
          {
            name: 'house-reg-code',
            label: 'รหัสทะเบียนบ้าน',
            type: 'text',
            placeholder: 'กรุณาระบุรหัสทะเบียนบ้าน',
          },
        ]"
      />
    </div>

    <!-- ปุ่มบันทึก - อยู่ข้างล่างตลอด -->
    <div
      class="shrink-0 flex justify-end border-t border-gray-200 bg-white dark:bg-background rounded-b-xl p-3 mx-4 sm:mx-6"
    >
      <Button
        class="bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-2 rounded-lg font-semibold shadow-sm"
      >
        บันทึก
      </Button>
    </div>
  </div>
</template>
