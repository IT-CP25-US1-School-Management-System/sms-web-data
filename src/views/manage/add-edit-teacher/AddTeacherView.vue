<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useTeacherStore } from '@/stores/teachers'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { ROUTE_NAMES } from '@/lib/constants'
import { ChevronLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const teacherStore = useTeacherStore()

const goBack = () => {
  teacherStore.clearCurrentTeacher()
  router.push({ name: ROUTE_NAMES.MANAGE_TEACHERS })
}
</script>

<template>
  <MainLayout>
    <div class="relative flex h-full flex-col gap-4 overflow-auto">
      <!-- Back button -->
      <div class="shrink-0 pt-3">
        <button
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="h-4 w-4" />
          ย้อนกลับ
        </button>
      </div>

      <!-- Page title -->
      <h2 class="mx-6 text-2xl font-bold">ข้อมูลบุคคล</h2>

      <!-- Section header -->
      <div class="bg-primary mx-6 rounded-[10px] border p-3">
        <h4 class="text-primary-foreground text-xl font-bold">
          {{ route.meta.label }}
        </h4>
      </div>

      <!-- Child route content -->
      <router-view />
    </div>
  </MainLayout>
</template>
