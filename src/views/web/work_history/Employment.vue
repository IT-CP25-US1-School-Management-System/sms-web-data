<script setup lang="ts">
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    <!-- ข้อมูลการทำงาน -->
    <DropDownForm
      topic="ข้อมูลการทำงาน"
      :fields="[
        {
          name: 'position',
          label: 'ตำแหน่ง',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
        },
        {
          name: 'work-status',
          label: 'สถานะการทำงาน',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
        },
        {
          name: 'employment-type',
          label: 'ลักษณะการจ้าง',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
        },
        {
          name: 'latest-transfer-type',
          label: 'ประเภทการเคลื่อนไหวล่าสุด',
          type: 'text',
          placeholder: '',
        },
      ]"
    />

    <!-- ข้อมูลค่าตอบแทนและสิทธิประโยชน์ -->
    <DropDownForm
      topic="ข้อมูลค่าตอบแทนและสิทธิประโยชน์"
      :fields="[
        {
          name: 'salary',
          label: 'เงินค่าจ้าง',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
        },
        {
          name: 'social-security-contribution',
          label: 'เงินสมทบกองทุนประกันสังคม',
          type: 'text',
          required: true,
          placeholder: '',
        },
      ]"
    />

    <!-- ข้อมูลสัญญาจ้างและเอกสารจ้างจิง -->
    <DropDownForm
      topic="ข้อมูลสัญญาจ้างและเอกสารจ้างจิง"
      :fields="[
        {
          name: 'contract-order-no',
          label: 'เลขที่คำสั่ง / สัญญาจ้าง',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'contract-count',
          label: 'จำนวนครั้งที่ทำสัญญา',
          type: 'text',
          required: true,
          placeholder: '',
        },
      ]"
    />

    <!-- ข้อมูลระยะเวลาในการจ้างงาน -->
    <DropDownForm
      topic="ข้อมูลระยะเวลาในการจ้างงาน"
      :fields="[
        {
          name: 'first-contract-date',
          label: 'ว/ด/ป เริ่มสัญญาครั้งแรก',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
        },
        {
          name: 'total-work-years',
          label: 'จ้างมาแล้วกี่ปี (อายุงานรวม)',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'current-contract-start',
          label: 'วันเดือนปีที่เริ่มสัญญาจ้าง (สัญญาปัจจุบัน)',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'contract-end-date',
          label: 'วันเดือนปีสิ้นสุดสัญญาจ้าง',
          type: 'text',
          required: true,
          placeholder: '',
        },
      ]"
    />

    <!-- ข้อมูลแหล่งงบประมาณที่ใช้จ้าง -->
    <DropDownForm
      topic="ข้อมูลแหล่งงบประมาณที่ใช้จ้าง"
      :fields="[
        {
          name: 'budget-type',
          label: 'ประเภทเงินงบประมาณ',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
        },
        {
          name: 'school-income-type',
          label: 'ประเภทเงินรายได้สถานศึกษา',
          type: 'select',
          required: true,
          placeholder: '',
          options: [],
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
