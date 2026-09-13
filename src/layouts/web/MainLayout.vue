<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE_NAMES } from '@/lib/constants'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Home,
  Users,
  User,
  FileClock,
  Notebook,
  TicketSlash,
  FileKey,
  ClipboardCheck,
  FileText,
} from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import ModeToggle from '@/components/ModeToggle.vue'

const route = useRoute()

const breadcrumbConfig = {
  Home: { label: 'หน้าหลัก', icon: Home },
  Profile: { label: 'โปรไฟล์', icon: User },
  Personal: { label: 'ข้อมูลบุคคล', icon: User },
  WorkHistory: { label: 'ประวัติการทำงาน', icon: FileClock },
  Achievements: { label: 'ผลงานและนวัตกรรม', icon: Notebook },
  Documents: { label: 'คำร้อง และ การประเมิน PA', icon: TicketSlash },
  Users: { label: 'จัดการผู้ใช้งาน', icon: Users },
  UserDetail: { label: 'รายละเอียดผู้ใช้งาน', icon: User },
  Roles: { label: 'จัดการบทบาท', icon: FileKey },
}

const currentBreadcrumbs = computed(() => {
  const routeName = route.name?.toString()
  const breadcrumbs: Array<{
    label: string
    icon: any
    to: any
    isLast: boolean
  }> = [
    {
      label: breadcrumbConfig.Home.label,
      icon: breadcrumbConfig.Home.icon,
      to: { name: ROUTE_NAMES.HOME },
      isLast: false,
    },
  ]

  if (!routeName || routeName === ROUTE_NAMES.HOME) {
    if (breadcrumbs[0]) {
      breadcrumbs[0].isLast = true
    }
    return breadcrumbs
  }

  if (routeName === ROUTE_NAMES.PROFILE) {
    breadcrumbs.push({
      label: breadcrumbConfig.Profile.label,
      icon: breadcrumbConfig.Profile.icon,
      to: { name: ROUTE_NAMES.PROFILE },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.PERSONAL) {
    breadcrumbs.push({
      label: breadcrumbConfig.Personal.label,
      icon: breadcrumbConfig.Personal.icon,
      to: { name: ROUTE_NAMES.PERSONAL_DETAILS },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.WORK_HISTORY) {
    breadcrumbs.push({
      label: breadcrumbConfig.WorkHistory.label,
      icon: breadcrumbConfig.WorkHistory.icon,
      to: { name: ROUTE_NAMES.POSITION_HISTORY },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.ACHIEVEMENTS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Achievements.label,
      icon: breadcrumbConfig.Achievements.icon,
      to: { name: ROUTE_NAMES.TRAINING },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.DOCUMENTS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Documents.label,
      icon: breadcrumbConfig.Documents.icon,
      to: { name: ROUTE_NAMES.SUBMIT_DOCUMENTS },
      isLast: true,
    })
  } else if (
    [ROUTE_NAMES.WEB_PA, ROUTE_NAMES.WEB_PA_DETAIL, ROUTE_NAMES.WEB_PA_FILES].some(
      (name) => name === routeName,
    )
  ) {
    breadcrumbs.push({
      label: 'การประเมิน PA',
      icon: ClipboardCheck,
      to: { name: ROUTE_NAMES.WEB_PA },
      isLast: routeName === ROUTE_NAMES.WEB_PA,
    })
    if (routeName !== ROUTE_NAMES.WEB_PA) {
      breadcrumbs.push({
        label: 'รายละเอียดการประเมิน PA',
        icon: FileText,
        to: { name: ROUTE_NAMES.WEB_PA_DETAIL, params: { id: route.params.id } },
        isLast: routeName === ROUTE_NAMES.WEB_PA_DETAIL,
      })
    }
    if (routeName === ROUTE_NAMES.WEB_PA_FILES) {
      breadcrumbs.push({ label: 'ดาวน์โหลดไฟล์', icon: FileText, to: null, isLast: true })
    }
  } else {
    breadcrumbs.push({
      label: routeName,
      icon: null,
      to: null,
      isLast: true,
    })
  }
  return breadcrumbs
})

// Scroll detection for header styling
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial scroll position
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <!-- Header -->
      <!-- Header -->
      <header
        :class="[
          'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur transition-all duration-300',
          isScrolled ? 'mx-0 mt-0 rounded-none shadow-md' : 'rounded-t-lg shadow-sm',
        ]"
      >
        <SidebarTrigger class="-ml-1" />
        <div class="flex flex-1 items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Breadcrumb Navigation -->
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem v-for="(crumb, index) in currentBreadcrumbs" :key="index">
                  <BreadcrumbLink v-if="crumb.to && !crumb.isLast" as-child>
                    <RouterLink :to="crumb.to" class="flex items-center">
                      <component :is="crumb.icon" class="mr-2 size-4" v-if="crumb.icon" />
                      {{ crumb.label }}
                    </RouterLink>
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else class="flex items-center font-semibold">
                    <component :is="crumb.icon" class="mr-2 size-4" v-if="crumb.icon" />
                    {{ crumb.label }}
                  </BreadcrumbPage>
                  <BreadcrumbSeparator v-if="!crumb.isLast" />
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div class="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
