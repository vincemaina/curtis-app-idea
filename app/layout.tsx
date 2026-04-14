import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ConvoCoach — Master the Art of Conversation',
  description: 'Practice real-world conversations with AI-powered characters and get expert coaching feedback.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-game-bg text-game-text antialiased">{children}</body>
    </html>
  )
}
