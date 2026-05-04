<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, SearchX, User,LogIn } from 'lucide-vue-next'
import ModeToggle from '@/components/ModeToggle.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isAuthenticated) return

  try {
    await authStore.checkSession()
  } catch (error) {
    // Anonymous users should still be able to see the 404 page.
  }
})

const primaryAction = computed(() => {
  if (authStore.isAuthenticated) {
    return {
      icon: User,
      label: 'กลับหน้าหลัก',
      routeName: ROUTE_NAMES.HOME,
    }
  }

  return {
    icon: LogIn,
    label: 'ไปหน้าเข้าสู่ระบบ',
    routeName: ROUTE_NAMES.LOGIN,
  }
})
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-background px-4 text-foreground transition-colors"
  >
    <div class="absolute right-4 top-4">
      <ModeToggle />
    </div>

    <div class="mx-auto max-w-lg space-y-8 text-center">
      <div class="flex justify-center">
        <div class="rounded-full bg-muted p-6 ring-1 ring-border">
          <SearchX class="h-12 w-12 text-muted-foreground" />
        </div>
      </div>

      <div class="space-y-3">
        <h1
          class="select-none bg-gradient-to-b from-foreground to-muted-foreground/50 bg-clip-text text-9xl font-black tracking-tighter text-transparent"
        >
          404
        </h1>
        <div class="flex items-center justify-center gap-2">
          <div class="h-px max-w-16 flex-1 bg-border" />
          <span class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            ไม่พบหน้าที่ต้องการ
          </span>
          <div class="h-px max-w-16 flex-1 bg-border" />
        </div>
      </div>

      <div class="space-y-2">
        <h2 class="text-2xl font-bold tracking-tight text-foreground">
          ไม่พบหน้าที่คุณต้องการ
        </h2>
        <p class="leading-relaxed text-muted-foreground">
          หน้าที่คุณกำลังเปิดอาจถูกย้าย ลบออก หรือ URL ที่ระบุไม่ถูกต้อง
        </p>
      </div>

      <div class="flex items-center justify-center gap-3 pt-2">
        <Button class="gap-2" variant="outline" @click="router.back()">
          <ArrowLeft class="h-4 w-4" />
          ย้อนกลับ
        </Button>
        <Button class="gap-2" @click="router.push({ name: primaryAction.routeName })">
          <component :is="primaryAction.icon" class="h-4 w-4" />
          {{ primaryAction.label }}
        </Button>
      </div>
    </div>
  </div>
</template>
