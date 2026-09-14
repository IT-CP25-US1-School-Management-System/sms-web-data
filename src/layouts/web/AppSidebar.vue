<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  User,
  ChevronsUpDown,
  LogOut,
  FileClock,
  ChevronRight,
  Notebook,
  TicketSlash,
  ClipboardCheck,
} from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTeacherStore } from '@/stores/teachers'
import { env } from '@/lib/env'
import { DATASET_GET, ROUTE_NAMES } from '@/lib/constants'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getTeacherById } from '@/stores/teachers'
import { getDatasetRows } from '@/stores/dataset'
import { getImgInitials } from '@/lib/helpers'
import { hasPAWebRole } from '@/lib/paAccess'

interface MenuChild {
  id: string
  label: string
  icon: any
  routeName: string
  showCondition?: () => boolean
}

interface MenuItem {
  id: string
  label: string
  icon: any
  routeName: string | null
  children: MenuChild[] | null
  showCondition?: () => boolean
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const teacherStore = useTeacherStore()

async function loadCurrentTeacher() {
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'personal_get',
      page: 1,
      per_page: 50,
    })

    if (response.data?.[0]) {
      teacherStore.setCurrentTeacher(response.data[0])
    }
  } catch (error) {
    console.error('Failed to load current teacher data:', error)
  }
}

onMounted(async () => {
  const idFromUrl = route.query.id as string

  if (teacherStore.currentTeacher?.id) return

  if (idFromUrl) {
    try {
      const response = await getTeacherById(idFromUrl)
      if (response.data) {
        teacherStore.setCurrentTeacher(response.data)
      }
    } catch (error) {
      console.error('Failed to load teacher data:', error)
    }

    return
  }

  await loadCurrentTeacher()
})

const menuConfig: {
  main: MenuItem[]
  settings: MenuItem[]
} = {
  main: [
    {
      id: 'personal',
      label: 'ข้อมูลบุคคล',
      icon: User,
      routeName: null,
      children: [
        {
          id: 'personal-details',
          label: 'ข้อมูลส่วนบุคคล',
          icon: null,
          routeName: ROUTE_NAMES.PERSONAL_DETAILS,
        },
        {
          id: 'address',
          label: 'ข้อมูลที่อยู่',
          icon: null,
          routeName: ROUTE_NAMES.ADDRESS,
          showCondition: () => true, // optional condition
        },
        {
          id: 'family',
          label: 'ข้อมูลครอบครัว',
          icon: null,
          routeName: ROUTE_NAMES.FAMILY,
          showCondition: () => true, // optional condition
        },
        {
          id: 'education',
          label: 'ข้อมูลการศึกษา',
          icon: null,
          routeName: ROUTE_NAMES.EDUCATION,
          showCondition: () => true, // optional condition
        },
        {
          id: 'professional-license',
          label: 'ใบประกอบวิชาชีพ',
          icon: null,
          routeName: ROUTE_NAMES.PROFESSIONAL_LICENSE,
          showCondition: () => true, // optional condition
        },
      ],
    },
    {
      id: 'work-history',
      label: 'ประวัติการทำงาน',
      icon: FileClock,
      routeName: null,
      children: [
        {
          id: 'position-history',
          label: 'ข้อมูลการดำรงตำแหน่ง',
          icon: null,
          routeName: ROUTE_NAMES.POSITION_HISTORY,
          showCondition: () => isGovernment.value, // only for government staff
        },
        {
          id: 'royal-decorations',
          label: 'ประวัติเครื่องราชอิสริยาภรณ์',
          icon: null,
          routeName: ROUTE_NAMES.ROYAL_DECORATIONS,
          showCondition: () => isGovernment.value, // only for government staff
        },
        {
          id: 'academic-rank-history',
          label: 'ประวัติวิทยฐานะ',
          icon: null,
          routeName: ROUTE_NAMES.ACADEMIC_RANK_HISTORY,
          showCondition: () => isGovernment.value, // only for government staff
        },
        {
          id: 'employment',
          label: 'ข้อมูลการจ้าง',
          icon: null,
          routeName: ROUTE_NAMES.EMPLOYMENT,
          showCondition: () => !isGovernment.value, // show for non-government (contract) staff
        },
        {
          id: 'contract-position',
          label: 'ประวัติการดำรงตำแหน่ง',
          icon: null,
          routeName: ROUTE_NAMES.CONTRACT_POSITION,
          showCondition: () => !isGovernment.value, // show for non-government (contract) staff
        },
      ],
    },
    {
      id: 'achievements',
      label: 'ข้อมูลการอบรม / ข้อมูลผลงาน',
      icon: Notebook,
      routeName: null,
      children: [
        {
          id: 'training',
          label: 'ข้อมูลการอบรม/ศึกษาดูงาน',
          icon: null,
          routeName: ROUTE_NAMES.TRAINING,
        },
        {
          id: 'achievements-innovations',
          label: 'ข้อมูลผลงาน/นวัตกรรม',
          icon: null,
          routeName: ROUTE_NAMES.ACHIEVEMENTS_INNOVATIONS,
        },
      ],
    },
    {
      id: 'documents',
      label: 'คำร้อง และ การประเมิน PA',
      icon: TicketSlash,
      routeName: null,
      children: [
        {
          id: 'create-documents',
          label: 'ยื่นคำร้อง',
          icon: null,
          routeName: ROUTE_NAMES.SUBMIT_DOCUMENTS,
        },
        {
          id: 'pa-document',
          label: 'การส่งเอกสาร PA',
          icon: null,
          routeName: ROUTE_NAMES.PA_DOCUMENT,
        },
        {
          id: 'evaluation-pa',
          label: 'การประเมิน PA',
          icon: null,
          routeName: ROUTE_NAMES.EVALUATION_PA,
        },
        {
          id: 'track-documents',
          label: 'ติดตามคำร้อง',
          icon: null,
          routeName: ROUTE_NAMES.TRACK_DOCUMENTS,
          showCondition: () => true, // optional condition
        },
      ],
    },
    {
      id: 'pa-results',
      label: 'สรุปผลการประเมิน PA',
      icon: ClipboardCheck,
      routeName: ROUTE_NAMES.WEB_PA,
      children: null,
      showCondition: () => hasPAWebRole(authStore.user?.roles),
    },
    // ตัวอย่างการใช้ children - uncomment เมื่อต้องการใช้
    // {
    //   id: "example-with-children",
    //   label: "ตัวอย่างเมนูย่อย",
    //   icon: Settings,
    //   routeName: null,
    //   children: [
    //     {
    //       id: "child-1",
    //       label: "เมนูย่อย 1",
    //       icon: User,
    //       routeName: "Child1Route"
    //     },
    //     {
    //       id: "child-2",
    //       label: "เมนูย่อย 2",
    //       icon: Database,
    //       routeName: "Child2Route",
    //       showCondition: () => true // optional condition
    //     }
    //   ]
    // },
  ],
  settings: [
    {
      id: 'profile',
      label: 'โปรไฟล์',
      icon: User,
      routeName: ROUTE_NAMES.PROFILE,
      children: null,
    },
  ],
}

const collapsibleStates = ref<Record<string, boolean>>({})
const visibleMainMenu = computed(() =>
  menuConfig.main.filter((item) => !item.showCondition || item.showCondition()),
)
const initializeCollapsibleStates = () => {
  const states: Record<string, boolean> = {}
  menuConfig.main.forEach((item: MenuItem) => {
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      const hasActiveChild = item.children.some(
        (child: MenuChild) =>
          route.name === child.routeName ||
          route.name?.toString().startsWith(child.routeName || ''),
      )
      states[item.id] = hasActiveChild
    }
  })

  return states
}

collapsibleStates.value = initializeCollapsibleStates()

const toggleCollapsible = (itemId: string) => {
  collapsibleStates.value[itemId] = !collapsibleStates.value[itemId]
}

const mockAuth = {
  getUserDisplayName: authStore.user?.name || 'ผู้ใช้ระบบ',
  user: { email: authStore.user?.email || '' },
  isLoading: authStore.loading,
}

// Determine whether the current user is government staff. The user object
// coming from the auth store may vary in shape (some backends nest attributes),
// so check common locations where `is_government` might appear.
const isGovernment = computed(() => {
  const u: any = teacherStore.currentTeacher || authStore.user
  if (!u) return false

  const rawValue =
    u.is_government ??
    u.profile?.is_government ??
    u.attributes?.is_government ??
    u.isGovernment ??
    false

  return rawValue === true || rawValue === 'true'
})

const isActiveRoute = (routeName: string | null) => {
  if (!routeName) return false
  return route.name === routeName || route.name?.toString().startsWith(routeName)
}

const isActiveMenuItem = (menuItem: MenuItem) => {
  if (menuItem.children && Array.isArray(menuItem.children) && menuItem.children.length > 0) {
    return menuItem.children.some((child: MenuChild) => isActiveRoute(child.routeName))
  }
  return isActiveRoute(menuItem.routeName)
}

const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <Sidebar variant="inset">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <div class="flex items-center gap-2">
              <div
                class="bg-background flex aspect-square h-10 items-center justify-center rounded-lg"
              >
                <img src="/kp.png" alt="Logo" class="h-9" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ env.APP_NAME }}</span>
                <span class="truncate text-xs">v{{ env.APP_VERSION }}</span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>เมนูหลัก</SidebarGroupLabel>
        <SidebarMenu>
          <template v-for="menuItem in visibleMainMenu" :key="menuItem.id">
            <SidebarMenuItem
              v-if="
                !menuItem.children ||
                !Array.isArray(menuItem.children) ||
                menuItem.children.length === 0
              "
            >
              <SidebarMenuButton
                :is-active="isActiveRoute(menuItem.routeName)"
                as-child
                v-if="menuItem.routeName"
              >
                <RouterLink :to="{ name: menuItem.routeName }">
                  <component :is="menuItem.icon" class="size-4" />
                  <span>{{ menuItem.label }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <template v-else>
              <SidebarMenuItem>
                <SidebarMenuButton
                  :is-active="isActiveMenuItem(menuItem)"
                  @click="toggleCollapsible(menuItem.id)"
                >
                  <component :is="menuItem.icon" class="size-4" />
                  <span>{{ menuItem.label }}</span>
                  <ChevronRight
                    class="ml-auto transition-transform duration-200"
                    :class="{ 'rotate-90': collapsibleStates[menuItem.id] }"
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <template v-if="collapsibleStates[menuItem.id]">
                <SidebarMenuSub>
                  <SidebarMenuSubItem
                    v-for="child in menuItem.children"
                    :key="child.id"
                    v-show="!child.showCondition || child.showCondition()"
                  >
                    <SidebarMenuSubButton :is-active="isActiveRoute(child.routeName)" as-child>
                      <RouterLink :to="{ name: child.routeName }">
                        <component :is="child.icon" class="size-4" />
                        <span>{{ child.label }}</span>
                      </RouterLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </template>
            </template>
          </template>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>การตั้งค่า</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="menuItem in menuConfig.settings" :key="menuItem.id">
            <SidebarMenuButton
              :is-active="isActiveRoute(menuItem.routeName)"
              as-child
              v-if="menuItem.routeName"
            >
              <RouterLink :to="{ name: menuItem.routeName }">
                <component :is="menuItem.icon" class="size-4" />
                <span>{{ menuItem.label }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar class="h-8 w-8">
                  <AvatarFallback>
                    {{ getImgInitials(mockAuth.getUserDisplayName) }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">
                    {{ mockAuth.getUserDisplayName || 'ผู้ใช้' }}
                  </span>
                  <span class="truncate text-xs">
                    {{ mockAuth.user?.email || 'ไม่มีอีเมล' }}
                  </span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              :sideOffset="4"
            >
              <DropdownMenuLabel class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar class="h-8 w-8">
                    <AvatarFallback>
                      {{ getImgInitials(mockAuth.getUserDisplayName) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">
                      {{ mockAuth.getUserDisplayName || 'ผู้ใช้' }}
                    </span>
                    <span class="truncate text-xs">
                      {{ mockAuth.user?.email || 'ไม่มีอีเมล' }}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem @click="router.push({ name: ROUTE_NAMES.PROFILE })">
                  <User class="mr-2 h-4 w-4" />
                  โปรไฟล์
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout" :disabled="mockAuth.isLoading">
                <LogOut class="mr-2 h-4 w-4" />
                <span v-if="mockAuth.isLoading">กำลังออกจากระบบ...</span>
                <span v-else>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
