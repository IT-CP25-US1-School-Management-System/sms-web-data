<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    <!-- ข้อมูลทั่วไป -->
    <DropDownForm
      topic="ข้อมูลทั่วไป"
      :fields="[
        {
          name: 'prefix-th',
          label: 'คำนำหน้า',
          type: 'select',
          required: true,
          placeholder: 'เลือกคำนำหน้า',
          disabled: true,
          options: [
            { label: 'นาย', value: 'นาย' },
            { label: 'นาง', value: 'นาง' },
            { label: 'นางสาว', value: 'นางสาว' },
          ],
        },
        {
          name: 'first-name-th',
          label: 'ชื่อ',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุชื่อ',
        },
        {
          name: 'middle-name-th',
          label: 'ชื่อกลาง',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุชื่อกลาง',
        },
        {
          name: 'last-name-th',
          label: 'นามสกุล',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุนามสกุล',
        },
        {
          name: 'prefix-en',
          label: 'Prefix',
          type: 'select',
          required: true,
          placeholder: 'Select prefix',
          options: [
            { label: 'Mr.', value: 'Mr.' },
            { label: 'Mrs.', value: 'Mrs.' },
            { label: 'Miss', value: 'Miss' },
          ],
        },
        {
          name: 'middle-name-en',
          label: 'Middlename',
          type: 'text',
          required: true,
          placeholder: 'Enter middlename',
        },
        {
          name: 'first-name-en',
          label: 'Name',
          type: 'text',
          required: true,
          placeholder: 'Enter name',
        },
        {
          name: 'last-name-en',
          label: 'Lastname',
          type: 'text',
          required: true,
          placeholder: 'Enter lastname',
        },
        {
          name: 'birth-date',
          label: 'วัน / เดือน / ปี เกิด',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'age',
          label: 'อายุ (ปี)',
          type: 'number',
          required: true,
          placeholder: 'อายุ',
        },
        {
          name: 'marital-status',
          label: 'สถานภาพการแต่งงาน',
          type: 'select',
          required: true,
          placeholder: 'เลือกสถานภาพการแต่งงาน',
          options: [
            { label: 'โสด', value: 'single' },
            { label: 'สมรส', value: 'married' },
            { label: 'หม้าย', value: 'widowed' },
            { label: 'หย่า', value: 'divorced' },
          ],
        },
        {
          name: 'spouse-name',
          label: 'คู่สมรส',
          type: 'text',
          placeholder: 'กรุณาระบุชื่อคู่สมรส',
        },
        {
          name: 'id-card',
          label: 'เลขบัตรประจำตัวประชาชน',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเลขบัตรประชาชน',
        },

      ]"
    />

    <!-- ข้อมูล Sensitive -->
    <DropDownForm
      topic="ข้อมูล Sensitive"
      :fields="[
        {
          name: 'gender',
          label: 'เพศ',
          type: 'select',
          required: true,
          placeholder: 'เลือกเพศ',
          options: [
            { label: 'ชาย', value: 'male' },
            { label: 'หญิง', value: 'female' },
          ],
        },
        {
          name: 'religion',
          label: 'ศาสนา',
          type: 'select',
          required: true,
          placeholder: 'เลือกศาสนา',
          options: [
            { label: 'พุทธ', value: 'buddhism' },
            { label: 'คริสต์', value: 'christianity' },
            { label: 'อิสลาม', value: 'islam' },
            { label: 'อื่นๆ', value: 'other' },
          ],
        },
        {
          name: 'nationality',
          label: 'สัญชาติ',
          type: 'select',
          required: true,
          placeholder: 'เลือกสัญชาติ',
          options: [
            { label: 'ไทย', value: 'thai' },
            { label: 'อื่นๆ', value: 'other' },
          ],
        },
        {
          name: 'ethnicity',
          label: 'เชื้อชาติ',
          type: 'select',
          required: true,
          placeholder: 'เลือกเชื้อชาติ',
          options: [
            { label: 'ไทย', value: 'thai' },
            { label: 'อื่นๆ', value: 'other' },
          ],
        },
        {
          name: 'blood-type',
          label: 'หมู่เลือด',
          type: 'select',
          required: true,
          placeholder: 'เลือกหมู่เลือด',
          options: [
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'AB', value: 'AB' },
            { label: 'O', value: 'O' },
          ],
        },
        {
          name: 'physical-status',
          label: 'สถานภาพทางร่างกาย',
          type: 'select',
          required: true,
          placeholder: 'เลือกสถานภาพทางร่างกาย',
          options: [
            { label: 'ปกติ', value: 'normal' },
            { label: 'พิการ', value: 'disabled' },
          ],
        },
      ]"
    />

    <!-- ช่องทางการติดต่อ -->
    <DropDownForm
      topic="ช่องทางการติดต่อ"
      :fields="[
        {
          name: 'phone',
          label: 'เบอร์โทรศัพท์',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเบอร์โทรศัพท์',
        },
        {
          name: 'email',
          label: 'E-mail',
          type: 'email',
          required: true,
          placeholder: 'กรุณาระบุอีเมล',
        },
        {
          name: 'line-id',
          label: 'Line ID',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุ Line ID',
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
</template>
