export const metadata = {
  title: 'Orchestrator Dashboard',
  description: 'Monitor GCP Orchestrator status',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
