import type { CapacitorConfig } from '@capacitor/cli'

/**
 * iOS App 内嵌网页地址：优先读环境变量，否则改下面默认值为你已部署的站点（须 https）。
 * 本地联调示例：CAP_SERVER_URL=http://192.168.1.5:3847 npx cap sync ios
 */
const serverUrl =
  process.env.CAP_SERVER_URL?.trim() || 'https://YOUR-SUBDOMAIN.onrender.com'

const config: CapacitorConfig = {
  appId: 'com.recordingcoach.app',
  appName: '录视频引导',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://')
  },
  ios: {
    scheme: 'App',
    limitsNavigationsToAppBoundDomain: false
  }
}

export default config
