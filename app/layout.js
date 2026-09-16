import './globals.css'

export const metadata = {
  title: 'PortofoliOps',
  description: 'Internal project monitoring tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
