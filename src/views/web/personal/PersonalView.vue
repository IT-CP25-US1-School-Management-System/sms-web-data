<script setup lang="ts">
import { useRoute } from 'vue-router'
import MainLayout from '../../../layouts/web/MainLayout.vue'

const route = useRoute()
</script>

<template>
  <MainLayout>
    <div class="relative flex flex-col gap-4 ">
      <h2 class="font-['Noto_Sans_Thai'] text-2xl font-bold mt-6 mx-6">ข้อมูลบุคคล</h2>
      <div class="bg-[#1C509F] border rounded-[10px] p-3 mx-6">
        <h4 class="font-['Noto_Sans_Thai'] text-xl font-bold text-neutral-50 ">
          {{ route.meta.label }}
        </h4>
      </div>
      <router-view />
    </div>
  </MainLayout>
</template>
