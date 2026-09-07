import './globals.css'

export const metadata = {
  title: 'Project Monitor',
  description: 'Internal project monitoring tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
