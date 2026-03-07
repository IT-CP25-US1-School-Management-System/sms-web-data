<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-vue-next'

// Mock data — readonly
const mockData = [
  {
    date: '2568-01-15',
    position: 'ครูผู้ช่วย',
    salary: '15,050',
    contractNo: 'คส.001/2568',
    fileName: 'สัญญาจ้าง_2568.pdf',
  },
  {
    date: '2567-05-01',
    position: 'ครูอัตราจ้าง',
    salary: '12,000',
    contractNo: 'คส.045/2567',
    fileName: 'สัญญาจ้าง_2567.pdf',
  },
]
</script>

<template>
  <div class="flex flex-col gap-4 mx-6">
    <Card v-for="(item, index) in mockData" :key="index" class="w-full gap-3 pb-6">
      <CardContent>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field>
            <FieldLabel> วันเดือนปี <span class="text-red-500">*</span> </FieldLabel>
            <Input type="date" :model-value="item.date" disabled class="disabled:opacity-70" />
          </Field>
          <Field>
            <FieldLabel> ตำแหน่ง <span class="text-red-500">*</span> </FieldLabel>
            <Input type="text" :model-value="item.position" disabled class="disabled:opacity-70" />
          </Field>
          <Field>
            <FieldLabel> เงินเดือน <span class="text-red-500">*</span> </FieldLabel>
            <Input type="text" :model-value="item.salary" disabled class="disabled:opacity-70" />
          </Field>
          <Field>
            <FieldLabel> เลขที่คำสั่ง/สัญญาจ้าง <span class="text-red-500">*</span> </FieldLabel>
            <Input
              type="text"
              :model-value="item.contractNo"
              disabled
              class="disabled:opacity-70"
            />
          </Field>
        </div>

        <!-- เอกสารเอกสารสัญญาจ้าง -->
        <div class="mt-4">
          <FieldLabel>เอกสารเอกสารสัญญาจ้าง</FieldLabel>
          <Button
            type="button"
            class="mt-1 px-4 py-2 rounded-lg font-semibold text-sm"
            @click="() => {}"
          >
            <FileText class="w-4 h-4 mr-1" />
            ดาวโหลดไฟล์
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
