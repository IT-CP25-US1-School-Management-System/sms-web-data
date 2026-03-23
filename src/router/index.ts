import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAMES } from '@/lib/constants'
import { getTeacherById } from '@/stores/teachers'

const validateTeacherIdGuard = async (to: any) => {
  const idFromUrl = to.query.id as string
  if (idFromUrl) {
    try {
      await getTeacherById(idFromUrl)
      // ID exists, allow navigation
      return true
    } catch (error) {
      // ID not found or invalid
      return { name: ROUTE_NAMES.HOME }
    }
  }
  // No ID in URL, allow navigation (add mode)
  return true
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: ROUTE_NAMES.LOGIN,
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: ROUTE_NAMES.HOME,
      redirect: () => {
        const authStore = useAuthStore()
        if (authStore.hasRole('admin')) {
          return { name: ROUTE_NAMES.MANAGE_TEACHERS }
        }
        return { name: ROUTE_NAMES.PERSONAL_DETAILS }
      },
      meta: { requiresAuth: true },
    },
    {
      path: '/setting',
      name: ROUTE_NAMES.SETTINGS,
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: ROUTE_NAMES.PROFILE,
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/personal',
      component: () => import('@/views/web/personal/PersonalView.vue'),
      meta: { requiresAuth: true, webOnly: true },
      redirect: { name: ROUTE_NAMES.PERSONAL_DETAILS },
      children: [
        {
          path: 'personal-details',
          name: ROUTE_NAMES.PERSONAL_DETAILS,
          component: () => import('@/views/web/personal/PersonalDetail.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลส่วนบุคคล' },
        },
        {
          path: 'address',
          name: ROUTE_NAMES.ADDRESS,
          component: () => import('@/views/web/personal/AddressInfo.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลที่อยู่' },
        },
        {
          path: 'family',
          name: ROUTE_NAMES.FAMILY,
          component: () => import('@/views/web/personal/FamilyInfo.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลครอบครัว' },
        },
        {
          path: 'education',
          name: ROUTE_NAMES.EDUCATION,
          component: () => import('@/views/web/personal/EducationInfo.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลการศึกษา' },
        },
        {
          path: 'professional-license',
          name: ROUTE_NAMES.PROFESSIONAL_LICENSE,
          component: () => import('@/views/web/personal/ProfessionalLicense.vue'),
          meta: { requiresAuth: true, label: 'ใบประกอบวิชาชีพ' },
        },
      ],
    },
    {
      path: '/work-history',
      component: () => import('@/views/web/work_history/WorkHistotyView.vue'),
      meta: { requiresAuth: true, webOnly: true },
      redirect: { name: ROUTE_NAMES.POSITION_HISTORY },
      children: [
        {
          path: 'position-history',
          name: ROUTE_NAMES.POSITION_HISTORY,
          component: () => import('@/views/web/work_history/PositionHistory.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลการดำรงตำแหน่ง' },
        },
        {
          path: 'royal-decorations',
          name: ROUTE_NAMES.ROYAL_DECORATIONS,
          component: () => import('@/views/web/work_history/RoyalDecorations.vue'),
          meta: { requiresAuth: true, label: 'เครื่องราชอิสริยาภรณ์' },
        },
        {
          path: 'academic-rank-history',
          name: ROUTE_NAMES.ACADEMIC_RANK_HISTORY,
          component: () => import('@/views/web/work_history/AcademicRankHistory.vue'),
          meta: { requiresAuth: true, label: 'ประวัติวิทยฐานะ' },
        },
        {
          path: 'employment',
          name: ROUTE_NAMES.EMPLOYMENT,
          component: () => import('@/views/web/work_history/Employment.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลการจ้างงาน' },
        },
        {
          path: 'contract-position',
          name: ROUTE_NAMES.CONTRACT_POSITION,
          component: () => import('@/views/web/work_history/ContractPosition.vue'),
          meta: { requiresAuth: true, label: 'ประวัติการดำรงตำแหน่ง' },
        },
      ],
    },
    {
      path: '/achievements',
      component: () => import('@/views/web/achievements/AchievementsView.vue'),
      meta: { requiresAuth: true, webOnly: true },
      redirect: { name: ROUTE_NAMES.TRAINING },
      children: [
        {
          path: 'training',
          name: ROUTE_NAMES.TRAINING,
          component: () => import('@/views/web/achievements/Training.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลการอบรม/ศึกษาดูงาน' },
        },
        {
          path: 'achievements-innovations',
          name: ROUTE_NAMES.ACHIEVEMENTS_INNOVATIONS,
          component: () => import('@/views/web/achievements/Innovations.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลผลงาน/นวัตกรรม' },
        },
      ],
    },
    {
      path: '/documents',
      component: () => import('@/views/web/documents_request/DocumentsView.vue'),
      meta: { requiresAuth: true, webOnly: true },
      redirect: { name: ROUTE_NAMES.SUBMIT_DOCUMENTS },
      children: [
        {
          path: 'submit-documents',
          name: ROUTE_NAMES.SUBMIT_DOCUMENTS,
          component: () => import('@/views/web/documents_request/CreateDocument.vue'),
          meta: { requiresAuth: true, label: 'ยื่นคำร้อง' },
        },
        {
          path: 'track-documents',
          name: ROUTE_NAMES.TRACK_DOCUMENTS,
          component: () => import('@/views/web/documents_request/TrackDocument.vue'),
          meta: { requiresAuth: true, label: 'ติดตามคำร้อง' },
        },
      ],
    },
    {
      path: '/manage',
      redirect: { name: ROUTE_NAMES.MANAGE_TEACHERS },
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/manage/teachers',
      name: ROUTE_NAMES.MANAGE_TEACHERS,
      component: () => import('@/views/manage/ManageTeacherView.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/manage/teachers/add',
      component: () => import('@/views/manage/add-edit-teacher/AddTeacherView.vue'),
      meta: { requiresAuth: true, adminOnly: true },
      redirect: { name: ROUTE_NAMES.ADD_TEACHER_PERSONAL },
      beforeEnter: validateTeacherIdGuard,
      children: [
        {
          path: 'personal',
          name: ROUTE_NAMES.ADD_TEACHER_PERSONAL,
          component: () => import('@/views/manage/add-edit-teacher/personal/PersonalDetail.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลส่วนบุคคล' },
        },
        {
          path: 'address',
          name: ROUTE_NAMES.ADD_TEACHER_ADDRESS,
          component: () => import('@/views/manage/add-edit-teacher/personal/AddressInfo.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลที่อยู่' },
        },
        {
          path: 'family',
          name: ROUTE_NAMES.ADD_TEACHER_FAMILY,
          component: () => import('@/views/manage/add-edit-teacher/personal/FamilyInfo.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลครอบครัว' },
        },
        {
          path: 'education',
          name: ROUTE_NAMES.ADD_TEACHER_EDUCATION,
          component: () => import('@/views/manage/add-edit-teacher/personal/EducationInfo.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลการศึกษา' },
        },
        {
          path: 'professional-license',
          name: ROUTE_NAMES.ADD_TEACHER_PROFESSIONAL_LICENSE,
          component: () => import('@/views/manage/add-edit-teacher/personal/ProfessionalLicense.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ใบประกอบวิชาชีพ' },
        },
        {
          path: 'position-history',
          name: ROUTE_NAMES.ADD_TEACHER_POSITION_HISTORY,
          component: () => import('@/views/manage/add-edit-teacher/work_history/PositionHistory.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลการดำรงตำแหน่ง' },
        },
        {
          path: 'royal-decorations',
          name: ROUTE_NAMES.ADD_TEACHER_ROYAL_DECORATIONS,
          component: () => import('@/views/manage/add-edit-teacher/work_history/RoyalDecorations.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'เครื่องราชอิสริยาภรณ์' },
        },
        {
          path: 'academic-rank',
          name: ROUTE_NAMES.ADD_TEACHER_ACADEMIC_RANK,
          component: () => import('@/views/manage/add-edit-teacher/work_history/AcademicRankHistory.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ประวัติวิทยฐานะ' },
        },
        {
          path: 'employment',
          name: ROUTE_NAMES.ADD_TEACHER_EMPLOYMENT,
          component: () => import('@/views/manage/add-edit-teacher/work_history/Employment.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลการจ้างงาน' },
        },
        {
          path: 'contract-position',
          name: ROUTE_NAMES.ADD_TEACHER_CONTRACT_POSITION,
          component: () => import('@/views/manage/add-edit-teacher/work_history/ContractPosition.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ประวัติการดำรงตำแหน่ง' },
        },
        {
          path: 'training',
          name: ROUTE_NAMES.ADD_TEACHER_TRAINING,
          component: () => import('@/views/manage/add-edit-teacher/achievements/Training.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลการอบรม/ศึกษาดูงาน' },
        },
        {
          path: 'innovations',
          name: ROUTE_NAMES.ADD_TEACHER_INNOVATIONS,
          component: () => import('@/views/manage/add-edit-teacher/achievements/Innovations.vue'),
          meta: { requiresAuth: true, adminOnly: true, label: 'ข้อมูลผลงานและนวัตกรรม' },
        },
      ],
    },
    {
      path: '/manage/students',
      name: ROUTE_NAMES.MANAGE_STUDENTS,
      component: () => import('@/views/manage/ManageStudentView.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/import-data',
      name: ROUTE_NAMES.IMPORT_DATA,
      component: () => import('@/views/manage/ImportDataView.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/manage/requests',
      name: ROUTE_NAMES.REQUEST_LIST,
      component: () => import('@/views/manage/requests/RequestsListView.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/manage/requests/:id',
      name: ROUTE_NAMES.REQUEST_EDIT,
      component: () => import('@/views/manage/requests/RequestEditView.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Guest route (login page)
  if (to.meta.requiresGuest) {
    if (authStore.isAuthenticated) {
      next({ name: ROUTE_NAMES.HOME })
      return
    }
    next()
    return
  }

  // Auth required routes — check session
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      try {
        await authStore.checkSession()
      } catch (error) {
        console.log('Session check failed, redirecting to login:', error)
        next({ name: ROUTE_NAMES.LOGIN })
        return
      }
    }

    if (!authStore.isAuthenticated) {
      next({ name: ROUTE_NAMES.LOGIN })
      return
    }

    const isAdmin = authStore.hasRole('admin')

    // Admin trying to access web-only routes → redirect to /manage
    if (isAdmin && to.meta.webOnly) {
      next({ name: ROUTE_NAMES.MANAGE_TEACHERS })
      return
    }

    // Non-admin trying to access admin-only routes → redirect to /personal
    if (!isAdmin && to.meta.adminOnly) {
      next({ name: ROUTE_NAMES.PERSONAL_DETAILS })
      return
    }
  }

  next()
})

export default router
