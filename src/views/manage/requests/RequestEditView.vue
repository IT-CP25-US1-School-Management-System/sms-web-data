<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { DocumentRequest, ApprovalLog } from '@/types/document'
import { getDocumentRequestById, updateDocumentRequest, createApprovalLog } from '@/stores/documents'
import { toDateInputFormat, getPrefixName } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()

// State
const request = ref<DocumentRequest | null>(null)
const loading = ref(false)
const saving = ref(false)

// Form data
const formData = ref({
  document_type: '',
  description: '',
  start_date: '',
  end_date: '',
  quantity: '',
  status: '',
})

// Fetch request data
const fetchRequest = async () => {
  if (!route.params.id) return
  
  loading.value = true
  try {
    const response = await getDocumentRequestById(route.params.id as string)
    request.value = response.data
    // Populate form
    formData.value = {
      document_type: response.data.document_type || '',
      description: response.data.description || '',
      start_date: toDateInputFormat(response.data.start_date) || '',
      end_date: toDateInputFormat(response.data.end_date) || '',
      quantity: String(response.data.quantity) || '',
      status: response.data.status || '',
    }
  } catch (error: any) {
    console.error('Failed to fetch request:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลคำร้องเอกสารได้',
    })
  } finally {
    loading.value = false
  }
}

// Save changes
const handleSave = async () => {
   if (!request.value) return
 
   saving.value = true
   try {
     const updateData: Partial<DocumentRequest> = {
       id: request.value.id,
       title: request.value.title,
       person_id: request.value.person_id,
       document_type: formData.value.document_type,
       description: formData.value.description,
       start_date: formData.value.start_date || undefined,
       end_date: formData.value.end_date || undefined,
       quantity: parseFloat(formData.value.quantity) || 0,
       status: (
         formData.value.status as
           | 'กำลังดำเนินการ'
           | 'อนุมัติ'
           | 'ไม่อนุมัติ'
       ) || undefined,
       created_at: request.value.created_at,
       updated_at: new Date().toISOString(),
     }
     await updateDocumentRequest(request.value.id, updateData)
     
     // Create approval log
     const authStore = useAuthStore()
     const approvalLogData: Omit<ApprovalLog, 'id' | 'created_at'> = {
       request_id: request.value.id,
       approver_id: authStore.user?.id || '', //9667f10f-12d2-4795-86a1-3e82deb6ac0e
       action: formData.value.status as 'อนุมัติ' | 'ไม่อนุมัติ' | 'กำลังดำเนินการ',
       comment: `แก้ไขคำร้อง: เปลี่ยนสถานะจาก ${request.value.status || ''} เป็น ${formData.value.status || ''}`,
     }
     await createApprovalLog(approvalLogData)
     
     toast.success('สำเร็จ', {
       description: 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว',
     })
     console.log(updateData);
     
     router.back()
   } catch (error: any) {
     console.error('Failed to update request:', error)
     toast.error('เกิดข้อผิดพลาด', {
       description: error.message || 'ไม่สามารถบันทึกการเปลี่ยนแปลง',
     })
   } finally {
     saving.value = false
   }
 }

// Handle cancel
const handleCancel = () => {
  router.back()
}

// Load data on mount
onMounted(() => {
  fetchRequest()
})
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <!-- Header -->
      <div class="shrink-0 space-y-2">
        <div class="flex gap-4 justify-between items-center">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="handleCancel">
              <ArrowLeft class="h-4 w-4 mr-2" />
              ย้อนกลับ
            </Button>
            <h1 class="text-lg font-semibold">แก้ไขคำร้องเอกสาร</h1>
          </div>
        </div>
      </div>

      <!-- Form Card Header -->
      <div class="shrink-0 bg-primary text-primary-foreground rounded-lg px-4 py-2">
        <h2 class="text-base font-semibold">ข้อมูลคำร้องเอกสาร {{ getPrefixName(request?.person_data?.[0]?.prefix_id) }}{{ request?.person_data?.[0]?.first_name_th }} {{ request?.person_data?.[0]?.last_name_th }}</h2>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex min-h-0 flex-1 items-center justify-center">
        <div class="flex flex-col items-center gap-2">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
        <Card>
          <CardContent class="space-y-4 pt-6">
            <!-- Document Type -->
            <div class="space-y-2">
              <Label for="document_type">ประเภทเอกสาร</Label>
               <Input
                 id="document_type"
                 v-model="formData.document_type"
                 placeholder="เช่น ใบการศึกษา"
                 :disabled="true"
               />
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label for="description">รายละเอียด</Label>
               <Textarea
                 id="description"
                 v-model="formData.description"
                 placeholder="รายละเอียดคำร้อง"
                 rows="4"
                 :disabled="true"
               />
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="start_date">วันที่เริ่มต้น</Label>
                 <Input
                   id="start_date"
                   v-model="formData.start_date"
                   type="date"
                   :disabled="true"
                 />
              </div>
              <div class="space-y-2">
                <Label for="end_date">วันสิ้นสุด</Label>
                 <Input
                   id="end_date"
                   v-model="formData.end_date"
                   type="date"
                   :disabled="true"
                 />
              </div>
            </div>

            <!-- Quantity & Status -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="quantity">จำนวน</Label>
                 <Input
                   id="quantity"
                   v-model="formData.quantity"
                   type="number"
                   placeholder="0"
                   :disabled="true"
                 />
              </div>
              <div class="space-y-2">
                <Label for="status">สถานะ</Label>
                <select
                  id="status"
                  v-model="formData.status"
                  :class="[
                    'flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-medium',
                    formData.status === 'อนุมัติ' ? 'border-green-600 bg-green-600 text-white' : formData.status === 'ไม่อนุมัติ' ? 'border-red-600 bg-red-400 text-white' : formData.status === 'กำลังดำเนินการ' ? 'border-yellow-300 bg-yellow-300 text-blue-800' : 'border-input bg-transparent',
                  ]"
                >
                  <option value="">-- เลือกสถานะ --</option>
                  <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                  <option value="อนุมัติ">อนุมัติ</option>
                  <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <div class="shrink-0 flex justify-end gap-2">
          <Button variant="outline" @click="handleCancel" :disabled="saving">
            ยกเลิก
          </Button>
          <Button class="bg-blue-600 hover:bg-blue-700" @click="handleSave" :disabled="saving">
            {{ saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
          </Button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped></style>
