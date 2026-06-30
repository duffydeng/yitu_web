import { UserLayout, TabLayout, RouteView, BlankLayout, PageView } from '@/components/layouts'

/**
 * 走菜单，走权限控制
 * @type {[null,null]}
 */
export const asyncRouterMap = [

  {
    path: '/',
    name: 'dashboard',
    component: TabLayout,
    meta: { title: '首页' },
    redirect: '/dashboard/analysis',
    children: [
      {
        path: '/material/bom',
        name: 'BomList',
        component: () => import('@/views/material/BomList'),
        meta: { title: 'BOM管理', keepAlive: true }
      },
      {
        path: '/product/category',
        name: 'ProductCategoryList',
        component: () => import('@/views/product/ProductCategoryList'),
        meta: { title: '产品分类', keepAlive: true }
      },
      {
        path: '/system/dealer',
        name: 'DealerList',
        component: () => import('@/views/system/DealerList'),
        meta: { title: '经销商管理', keepAlive: true }
      },
      {
        path: '/system/SurveyQuestionList',
        name: 'SurveyQuestionList',
        component: () => import('@/views/system/SurveyQuestionList'),
        meta: { title: '问卷调查项定义', keepAlive: true }
      },
      {
        path: '/system/surveyResponseList',
        name: 'SurveyResponseList',
        component: () => import('@/views/system/SurveyResponseList'),
        meta: { title: '问卷答卷列表', keepAlive: true }
      },
      {
        path: '/system/miniappBanner',
        name: 'MiniappBannerList',
        component: () => import('@/views/system/MiniappBannerList'),
        meta: { title: '小程序Banner管理', keepAlive: true }
      },
      {
        path: '/system/wechatUser',
        name: 'WechatUserList',
        component: () => import('@/views/system/WechatUserList'),
        meta: { title: '微信用户管理', keepAlive: true }
      },
      {
        path: '/system/dict/type',
        name: 'DictTypeList',
        component: () => import('@/views/system/DictTypeList'),
        meta: { title: '字典类型', keepAlive: true }
      },
      {
        path: '/bill/afterSales',
        name: 'AfterSalesList',
        component: () => import('@/views/bill/AfterSalesList'),
        meta: { title: '售后单管理', keepAlive: true }
      },
      {
        path: '/report/productionReport',
        name: 'ProductionReport',
        component: () => import('@/views/report/ProductionReport'),
        meta: { title: '生产报表', keepAlive: true }
      },
      {
        path: '/report/salesReport',
        name: 'SalesReport',
        component: () => import('@/views/report/SalesReport'),
        meta: { title: '销售报表', keepAlive: true }
      }
    ]
  },
  {
    path: '*', redirect: '/404', hidden: true
  }
]

/**
 * 基础路由
 * @type { *[] }
 */
export const constantRouterMap = [
  {
    path: '/user',
    component: UserLayout,
    redirect: '/user/login',
    hidden: true,
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import(/* webpackChunkName: "user" */ '@/views/user/Login')
      },
      {
        path: 'register',
        name: 'register',
        component: () => import(/* webpackChunkName: "user" */ '@/views/user/Register')
      }
    ]
  },
  {
    path: '/dashboard',
    component: TabLayout,
    redirect: '/dashboard/analysis',
    children: [
      {
        path: 'analysis',
        name: 'analysis',
        meta: { title: '首页' },
        component: () => import(/* webpackChunkName: "dashboard" */ '@/views/dashboard/Analysis')
      }
    ]
  },

  {
    path: '/404',
    component: () => import(/* webpackChunkName: "fail" */ '@/views/exception/404')
  },

]
