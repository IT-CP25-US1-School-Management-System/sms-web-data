<script setup lang="ts">
import { useRoute } from 'vue-router'
import MainLayout from '../../../layouts/web/MainLayout.vue'

const route = useRoute()
</script>

<template>
  <MainLayout>
    <h1>ข้อมูลบุคคล</h1>
    <h3>{{ route.meta.label }}</h3>
    <router-view />
  </MainLayout>
</template>
