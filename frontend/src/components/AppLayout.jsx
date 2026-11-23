import { NavLink, Outlet } from 'react-router'
import { modules } from '../config/modules'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl gap-7 overflow-x-auto px-5 sm:gap-9 sm:px-8">
          {modules.map(({ key, path, shortLabel }) => (
            <NavLink
              key={key}
              to={path}
              className={({ isActive }) => `shrink-0 border-b-2 py-5 text-sm font-medium transition-colors ${isActive ? 'border-zinc-900 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              {shortLabel}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  )
}
