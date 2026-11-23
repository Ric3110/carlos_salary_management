import { modules } from '../config/modules'

export default function ModulePlaceholder({ moduleKey }) {
  const module = modules.find((item) => item.key === moduleKey)
  if (!module) return null

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{module.label}</h1>
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-400">
        Not available yet.
      </div>
    </section>
  )
}
