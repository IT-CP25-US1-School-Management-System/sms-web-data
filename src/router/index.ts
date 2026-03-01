import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
      path: '/manage/teachers',
      name: ROUTE_NAMES.MANAGE_TEACHERS,
      component: () => import('@/views/manage/ManageTeacherView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/manage/students',
      name: ROUTE_NAMES.MANAGE_STUDENTS,
      component: () => import('@/views/manage/ManageStudentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/import-data',
      name: ROUTE_NAMES.IMPORT_DATA,
      component: () => import('@/views/manage/ImportDataView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/requests',
      name: ROUTE_NAMES.REQUESTS,
      component: () => import('@/views/manage/RequestsView.vue'),
      meta: { requiresAuth: true },
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
