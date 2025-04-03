export default function Layout({ children }: { children: React.ReactNode }) {

  return (
      <main className="w-full h-full max-h-screen">
        {children}
      </main>
  )
}
