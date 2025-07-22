/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 医学影像相关类型声明
declare module '*.dcm' {
  const src: string
  export default src
}

declare module '*.dicom' {
  const src: string
  export default src
}

// Element Plus 自动导入类型
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ElButton: typeof import('element-plus')['ElButton']
    ElInput: typeof import('element-plus')['ElInput']
    ElCard: typeof import('element-plus')['ElCard']
    ElContainer: typeof import('element-plus')['ElContainer']
    ElHeader: typeof import('element-plus')['ElHeader']
    ElAside: typeof import('element-plus')['ElAside']
    ElMain: typeof import('element-plus')['ElMain']
    ElFooter: typeof import('element-plus')['ElFooter']
    ElMenu: typeof import('element-plus')['ElMenu']
    ElMenuItem: typeof import('element-plus')['ElMenuItem']
    ElMenuItemGroup: typeof import('element-plus')['ElMenuItemGroup']
    ElSubMenu: typeof import('element-plus')['ElSubMenu']
    ElIcon: typeof import('element-plus')['ElIcon']
    ElLoading: typeof import('element-plus')['ElLoading']
    ElMessage: typeof import('element-plus')['ElMessage']
    ElMessageBox: typeof import('element-plus')['ElMessageBox']
    ElNotification: typeof import('element-plus')['ElNotification']
  }
}

export {}
