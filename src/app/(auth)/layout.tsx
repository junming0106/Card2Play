import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s - Card2Play',
    default: 'Card2Play - 遊戲卡片收藏交易平台'
  },
  description: '登入或註冊 Card2Play 帳戶，開始您的 Nintendo Switch 遊戲收藏之旅',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}