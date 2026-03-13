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
  Settings,
  Users,
  User,
  Database,
  FileText,
  UserPlus,
} from 'lucide-vue-next'
import AppSidebar from '@/layouts/manage/AppSidebar.vue'
import ModeToggle from '@/components/ModeToggle.vue'

const route = useRoute()

const breadcrumbConfig = {
  Home: { label: 'หน้าหลัก', icon: Home },
  Settings: { label: 'ตั้งค่าระบบ', icon: Settings },
  Profile: { label: 'โปรไฟล์', icon: User },
  ManageTeachers: { label: 'รายชื่อคุณครู', icon: Users },
  AddTeacher: { label: 'ข้อมูลบุคคล', icon: UserPlus },
  ManageStudents: { label: 'รายชื่อนักเรียน', icon: Users },
  ImportData: { label: 'นำเข้าข้อมูล', icon: Database },
  Requests: { label: 'คำร้อง', icon: FileText },
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

  if (routeName === ROUTE_NAMES.SETTINGS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Settings.label,
      icon: breadcrumbConfig.Settings.icon,
      to: { name: ROUTE_NAMES.SETTINGS },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.PROFILE) {
    breadcrumbs.push({
      label: breadcrumbConfig.Profile.label,
      icon: breadcrumbConfig.Profile.icon,
      to: { name: ROUTE_NAMES.PROFILE },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.MANAGE_TEACHERS) {
    breadcrumbs.push({
      label: breadcrumbConfig.ManageTeachers.label,
      icon: breadcrumbConfig.ManageTeachers.icon,
      to: { name: ROUTE_NAMES.MANAGE_TEACHERS },
      isLast: true,
    })
  } else if (routeName?.startsWith('AddTeacher')) {
    const addTeacherLabel = route.meta.label?.toString() || breadcrumbConfig.AddTeacher.label

    breadcrumbs.push({
      label: breadcrumbConfig.ManageTeachers.label,
      icon: breadcrumbConfig.ManageTeachers.icon,
      to: { name: ROUTE_NAMES.MANAGE_TEACHERS },
      isLast: false,
    })

    breadcrumbs.push({
      label: addTeacherLabel,
      icon: breadcrumbConfig.AddTeacher.icon,
      to: null,
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.MANAGE_STUDENTS) {
    breadcrumbs.push({
      label: breadcrumbConfig.ManageStudents.label,
      icon: breadcrumbConfig.ManageStudents.icon,
      to: { name: ROUTE_NAMES.MANAGE_STUDENTS },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.IMPORT_DATA) {
    breadcrumbs.push({
      label: breadcrumbConfig.ImportData.label,
      icon: breadcrumbConfig.ImportData.icon,
      to: { name: ROUTE_NAMES.IMPORT_DATA },
      isLast: true,
    })
  } else if (routeName === ROUTE_NAMES.REQUESTS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Requests.label,
      icon: breadcrumbConfig.Requests.icon,
      to: { name: ROUTE_NAMES.REQUESTS },
      isLast: true,
    })
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
    <SidebarInset class="flex h-screen flex-col overflow-hidden">
      <!-- Header -->
      <!-- Header -->
      <header
        :class="[
          'sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-all duration-300',
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
                      <component :is="crumb.icon" class="size-4 mr-2" v-if="crumb.icon" />
                      {{ crumb.label }}
                    </RouterLink>
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else class="flex items-center font-semibold">
                    <component :is="crumb.icon" class="size-4 mr-2" v-if="crumb.icon" />
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
      <main class="min-h-0 flex-1 overflow-hidden p-6">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
