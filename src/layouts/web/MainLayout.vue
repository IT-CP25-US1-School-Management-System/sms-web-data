<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { ROUTE_NAMES } from "@/lib/constants";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Settings,
  Users,
  User,
  FileClock,
  Notebook,
  TicketSlash,
  FileKey,
} from "lucide-vue-next";
import AppSidebar from "./AppSidebar.vue";
import ModeToggle from "@/components/ModeToggle.vue";

const route = useRoute();

const breadcrumbConfig = {
  Home: { label: "หน้าหลัก", icon: Home },
  Settings: { label: "ตั้งค่าระบบ", icon: Settings },
  Profile: { label: "โปรไฟล์", icon: User },
  Personal: { label: "ข้อมูลบุคคล", icon: User },
  WorkHistory: { label: "ประวัติการทำงาน", icon: FileClock },
  Achievements: { label: "ผลงานและนวัตกรรม", icon: Notebook },
  Documents: { label: "คำร้อง และ การประเมิน PA", icon: TicketSlash },
  Users: { label: "จัดการผู้ใช้งาน", icon: Users },
  UserDetail: { label: "รายละเอียดผู้ใช้งาน", icon: User },
  Roles: { label: "จัดการบทบาท", icon: FileKey },
};

const currentBreadcrumbs = computed(() => {
  const routeName = route.name?.toString();
  const breadcrumbs: Array<{
    label: string;
    icon: any;
    to: any;
    isLast: boolean;
  }> = [
    {
      label: breadcrumbConfig.Home.label,
      icon: breadcrumbConfig.Home.icon,
      to: { name: ROUTE_NAMES.HOME },
      isLast: false,
    },
  ];

  if (!routeName || routeName === ROUTE_NAMES.HOME) {
    if (breadcrumbs[0]) {
      breadcrumbs[0].isLast = true;
    }
    return breadcrumbs;
  }

  if (routeName === ROUTE_NAMES.SETTINGS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Settings.label,
      icon: breadcrumbConfig.Settings.icon,
      to: { name: ROUTE_NAMES.SETTINGS },
      isLast: true,
    });
  } else if (routeName === ROUTE_NAMES.PROFILE) {
    breadcrumbs.push({
      label: breadcrumbConfig.Profile.label,
      icon: breadcrumbConfig.Profile.icon,
      to: { name: ROUTE_NAMES.PROFILE },
      isLast: true,
    });
  } 
  else if (routeName === ROUTE_NAMES.PERSONAL) {
    breadcrumbs.push({
      label: breadcrumbConfig.Personal.label,
      icon: breadcrumbConfig.Personal.icon,
      to: { name: ROUTE_NAMES.PERSONAL_DETAILS },
      isLast: true,
    });
  } 
  else if (routeName === ROUTE_NAMES.WORK_HISTORY) {
    breadcrumbs.push({
      label: breadcrumbConfig.WorkHistory.label,
      icon: breadcrumbConfig.WorkHistory.icon,
      to: { name: ROUTE_NAMES.POSITION_HISTORY },
      isLast: true,
    });
  }
  else if (routeName === ROUTE_NAMES.ACHIEVEMENTS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Achievements.label,
      icon: breadcrumbConfig.Achievements.icon,
      to: { name: ROUTE_NAMES.TRAINING },
      isLast: true,
    });
  }
    else if (routeName === ROUTE_NAMES.DOCUMENTS) {
    breadcrumbs.push({
      label: breadcrumbConfig.Documents.label,
      icon: breadcrumbConfig.Documents.icon,
      to: { name: ROUTE_NAMES.SUBMIT_DOCUMENTS },
      isLast: true,
    });
  }
  else {
    breadcrumbs.push({
      label: routeName,
      icon: null,
      to: null,
      isLast: true,
    });
  }
  return breadcrumbs;
});

// Scroll detection for header styling
const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Check initial scroll position
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <!-- Header -->
      <!-- Header -->
      <header
        :class="[
          'sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-all duration-300',
          isScrolled
            ? 'mx-0 mt-0 rounded-none shadow-md'
            : 'rounded-t-lg shadow-sm',
        ]"
      >
        <SidebarTrigger class="-ml-1" />
        <div class="flex flex-1 items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Breadcrumb Navigation -->
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem
                  v-for="(crumb, index) in currentBreadcrumbs"
                  :key="index"
                >
                  <BreadcrumbLink v-if="crumb.to && !crumb.isLast" as-child>
                    <RouterLink :to="crumb.to" class="flex items-center">
                      <component
                        :is="crumb.icon"
                        class="size-4 mr-2"
                        v-if="crumb.icon"
                      />
                      {{ crumb.label }}
                    </RouterLink>
                  </BreadcrumbLink>
                  <BreadcrumbPage
                    v-else
                    class="flex items-center font-semibold"
                  >
                    <component
                      :is="crumb.icon"
                      class="size-4 mr-2"
                      v-if="crumb.icon"
                    />
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
