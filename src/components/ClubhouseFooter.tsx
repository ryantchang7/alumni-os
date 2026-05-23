import PennGolfCrest from '@/components/PennGolfCrest'

/**
 * The clubhouse signature that closes every page. Thin gold rule + a
 * small crest. Restraint over sitemap — this is the way a country
 * club closes a letter.
 */
export default function ClubhouseFooter() {
  return (
    <footer className="bg-[#f4ecdb] border-t border-[#d9c8a8]/40 mt-16">
      <div
        className="mx-auto"
        style={{
          width: '64px',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, rgba(200,168,75,0.55) 50%, transparent)',
          marginTop: '0',
        }}
      />
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-10 flex flex-col items-center">
        <PennGolfCrest size={42} tone="navy" />
      </div>
    </footer>
  )
}
