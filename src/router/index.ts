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
      component: () => import('@/views/web/personal/PersonalInfoView.vue'),
      meta: { requiresAuth: true },
      redirect: { name: ROUTE_NAMES.PERSONAL_INFO },
      children: [
        {
          path: 'personal-info',
          name: ROUTE_NAMES.PERSONAL_INFO,
          component: () => import('@/views/web/personal/PersonalDetailView.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลส่วนบุคคล' },
        },
        {
          path: 'address-info',
          name: ROUTE_NAMES.ADDRESS_INFO,
          component: () => import('@/views/web/personal/AddressInfoView.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลที่อยู่' },
        },
        {
          path: 'family-info',
          name: ROUTE_NAMES.FAMILY_INFO,
          component: () => import('@/views/web/personal/FamilyInfoView.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลครอบครัว' },
        },
        {
          path: 'education-info',
          name: ROUTE_NAMES.EDUCATION_INFO,
          component: () => import('@/views/web/personal/EducationInfoView.vue'),
          meta: { requiresAuth: true, label: 'ข้อมูลการศึกษา' },
        },
        {
          path: 'professional-license',
          name: ROUTE_NAMES.PROFESSIONAL_LICENSE_INFO,
          component: () => import('@/views/web/personal/ProfessionalLicenseView.vue'),
          meta: { requiresAuth: true, label: 'ใบประกอบวิชาชีพ' },
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
