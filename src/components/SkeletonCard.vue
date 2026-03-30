<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>
<template>
  <div class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <div class="rounded-xl border bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 sm:hidden">
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>

      <div class="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-36" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-36" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-36" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-36" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-36" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>
    </div>
  </div>
</template>
<style></style>
