import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/authStore'

const routes: RouteRecordRaw[] = [
  // Public
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/public/pages/HomePage.vue'),
  },
  {
    path: '/rooms',
    name: 'rooms',
    component: () => import('@/modules/rooms/pages/RoomList.vue'),
  },
  {
    path: '/rooms/:id',
    name: 'room-detail',
    component: () => import('@/modules/rooms/pages/RoomDetail.vue'),
  },
  {
    path: '/rooms/:roomId/feedback',
    name: 'room-feedback',
    component: () => import('@/modules/feedback/pages/FeedbackList.vue'),
  },
  {
    path: '/request',
    name: 'external-request',
    component: () => import('@/modules/public/pages/ExternalRequestForm.vue'),
  },
  {
    path: '/request/track',
    name: 'track-status',
    component: () => import('@/modules/public/pages/TrackStatus.vue'),
  },

  // Auth
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/auth/sso/callback',
    name: 'sso-callback',
    component: () => import('@/modules/auth/pages/SsoCallback.vue'),
    meta: { guest: true },
  },

  // Employee routes
  {
    path: '/bookings',
    name: 'bookings',
    component: () => import('@/modules/booking/pages/BookingList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookings/calendar',
    name: 'booking-calendar',
    component: () => import('@/modules/booking/pages/BookingCalendar.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookings/create',
    name: 'booking-create',
    component: () => import('@/modules/booking/pages/BookingCreate.vue'),
    meta: { requiresAuth: true, role: 'employee' },
  },
  {
    path: '/bookings/recurring',
    name: 'booking-recurring',
    component: () => import('@/modules/booking/pages/BookingRecurring.vue'),
    meta: { requiresAuth: true, role: 'employee' },
  },
  {
    path: '/bookings/:id',
    name: 'booking-detail',
    component: () => import('@/modules/booking/pages/BookingDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/modules/notification/pages/NotificationList.vue'),
    meta: { requiresAuth: true },
  },

  // Admin routes
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/modules/admin/pages/UserManagement.vue'),
      },
      {
        path: 'rooms',
        name: 'admin-rooms',
        component: () => import('@/modules/admin/pages/AdminRoomManagement.vue'),
      },
      {
        path: 'rooms/create',
        name: 'admin-rooms-create',
        component: () => import('@/modules/rooms/pages/RoomForm.vue'),
      },
      {
        path: 'rooms/:id/edit',
        name: 'admin-rooms-edit',
        component: () => import('@/modules/rooms/pages/RoomForm.vue'),
      },
      {
        path: 'approvals',
        name: 'admin-approvals',
        component: () => import('@/modules/approval/pages/ApprovalQueue.vue'),
      },
      {
        path: 'external-requests',
        name: 'admin-external-requests',
        component: () => import('@/modules/public/pages/ExternalRequestAdmin.vue'),
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/modules/dashboard/pages/ReportsPage.vue'),
      },
      {
        path: 'feedback',
        name: 'admin-feedback',
        component: () => import('@/modules/feedback/pages/FeedbackList.vue'),
      },
    ],
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/components/common/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (auth.isLoading) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.user) {
    return next({ name: 'login' })
  }

  if (to.meta.guest && auth.user) {
    return next({ name: 'home' })
  }

  if (to.meta.role === 'admin' && auth.user?.role !== 'admin') {
    return next({ name: 'home' })
  }

  if (to.meta.role === 'employee' && auth.user?.role !== 'employee' && auth.user?.role !== 'admin') {
    return next({ name: 'home' })
  }

  next()
})

export default router
