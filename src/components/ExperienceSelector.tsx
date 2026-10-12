import type { ExperienceConfig } from '../config/experience'

type ExperienceSelectorProps = {
  experiences: ExperienceConfig[]
  selectedId: string
  onSelect: (id: string) => void
  visible?: boolean
}

export function ExperienceSelector({
  experiences,
  selectedId,
  onSelect,
  visible = true,
}: ExperienceSelectorProps) {
  if (!visible || experiences.length <= 1) return null

  return (
    <div className="mt-8">
      <p className="mb-3 text-[11px] tracking-[0.25em] text-muted uppercase">
        Choose experience
      </p>
      <div className="flex flex-wrap gap-2">
        {experiences.map((experience) => {
          const selected = experience.id === selectedId
          return (
            <button
              key={experience.id}
              type="button"
              onClick={() => onSelect(experience.id)}
              className={
                selected
                  ? 'min-h-10 border border-gold bg-gold/10 px-4 text-xs tracking-wide text-gold'
                  : 'min-h-10 border border-ivory/15 px-4 text-xs tracking-wide text-muted transition hover:border-ivory/35 hover:text-ivory'
              }
            >
              {experience.experienceTitle}
            </button>
          )
        })}
      </div>
    </div>
  )
}
