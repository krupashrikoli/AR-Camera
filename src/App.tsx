import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ARScanner } from './components/ARScanner'
import { TargetCompilerPage } from './pages/TargetCompilerPage'

const routerBasename =
  import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<ARScanner />} />
        <Route path="/tools/compile" element={<TargetCompilerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-atmosphere px-6 text-center safe-pad">
      <p className="font-display text-3xl text-ivory">Page not found</p>
      <Link to="/" className="mt-6 text-sm text-gold underline-offset-4 hover:underline">
        Return to scanner
      </Link>
    </div>
  )
}
