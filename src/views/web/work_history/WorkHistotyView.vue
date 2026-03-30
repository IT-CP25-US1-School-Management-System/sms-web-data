<script setup lang="ts">
import { useRoute } from 'vue-router'
import MainLayout from '../../../layouts/web/MainLayout.vue'

const route = useRoute()
</script>

<template>
  <MainLayout>
    <div class="relative flex flex-col gap-4">
      <h2 class="mx-6 mt-6 font-['Noto_Sans_Thai'] text-2xl font-bold">ข้อมูลประวัติการทำงาน</h2>
      <div class="mx-6 rounded-[10px] border bg-[#1C509F] p-3">
        <h4 class="font-['Noto_Sans_Thai'] text-xl font-bold text-neutral-50">
          {{ route.meta.label }}
        </h4>
      </div>
      <router-view />
    </div>
  </MainLayout>
</template>
