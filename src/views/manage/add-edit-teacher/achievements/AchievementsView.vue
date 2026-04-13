<script setup lang="ts">
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { ROUTE_NAMES } from '@/lib/constants'
import { useTeacherStore } from '@/stores/teachers'
import { ChevronLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()

function goBack() {
  teacherStore.clearCurrentTeacher()
  router.push({ name: ROUTE_NAMES.MANAGE_TEACHERS })
}
</script>

<template>
  <MainLayout>
    <div class="relative flex h-full flex-col gap-4 overflow-auto">
      <div class="shrink-0 pt-3">
        <button
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="h-4 w-4" />
          ย้อนกลับ
        </button>
      </div>

      <h2 class="mx-6 text-2xl font-bold">ข้อมูลการอบรม / ข้อมูลผลงาน</h2>

      <div class="bg-primary mx-6 rounded-[10px] border p-3">
        <h4 class="text-primary-foreground text-xl font-bold">
          {{ route.meta.label }}
        </h4>
      </div>

      <router-view />
    </div>
  </MainLayout>
</template>
