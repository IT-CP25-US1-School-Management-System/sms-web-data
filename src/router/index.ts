import { createRouter, createWebHistory } from 'vue-router'
// import { useAuthStore } from "@/stores/auth";
import { ROUTE_NAMES } from '@/lib/constants'

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
      component: () => import('@/views/HomeView.vue'),
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
      meta: { requiresAuth: true },
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
      meta: { requiresAuth: true },
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
      meta: { requiresAuth: true },
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
      meta: { requiresAuth: true },
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
  ],
})

// router.beforeEach(async (to, _from, next) => {
//   const authStore = useAuthStore();

//   if (to.name === ROUTE_NAMES.LOGIN) {
//     if (!authStore.isAuthenticated) {
//       try {
//         await authStore.checkSession();
//         if (authStore.isAuthenticated) {
//           next({ name: ROUTE_NAMES.HOME });
//           return;
//         }
//       } catch (error) {
//         console.log("Session check failed on login page:", error);
//       }
//     } else {
//       next({ name: ROUTE_NAMES.HOME });
//       return;
//     }

//     next();
//     return;
//   }

//   if (to.meta.requiresAuth) {
//     if (!authStore.isAuthenticated) {
//       try {
//         await authStore.checkSession();
//       } catch (error) {
//         console.log("Session check failed, redirecting to login:", error);
//         next({ name: ROUTE_NAMES.LOGIN });
//         return;
//       }
//     }

//     if (!authStore.isAuthenticated) {
//       next({ name: ROUTE_NAMES.LOGIN });
//       return;
//     }
//   }

//   next();
// });

export default router
