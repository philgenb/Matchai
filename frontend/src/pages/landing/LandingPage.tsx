import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import matchaiLogo from '../../assets/icons/matchai-logo.svg'
import matchaiMarkInverted from '../../assets/icons/matchai-mark-inverted.svg'
import friendsPicture from '../../assets/images/friends_picture.png'
import googleCalendarLogo from '../../assets/images/google_calendar_logo.png'
import googleMapsPin from '../../assets/images/google_maps_pin.png'
import hannahAvatar from '../../assets/images/hannah_avatar.png'
import julianAvatar from '../../assets/images/julian_avatar.png'
import peopleGroup from '../../assets/images/people_group.png'

const DESIGN_WIDTH = 1728
const DESIGN_HEIGHT = 3027

const navItems = ['Product', 'Functions', 'About us']

function useDesignScale() {
  const [scale, setScale] = useState(() => Math.min(1, window.innerWidth / DESIGN_WIDTH))

  useEffect(() => {
    const updateScale = () => setScale(Math.min(1, window.innerWidth / DESIGN_WIDTH))
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return scale
}

function ArrowCircle() {
  return (
    <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#7d3dc5]">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="-rotate-45 text-white">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      </svg>
    </span>
  )
}

function CtaButton({ children, className = '' }: { children: string; className?: string }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/signup')}
      className={`group flex h-[76px] items-center justify-between rounded-[38px] bg-[var(--color-primary)] pl-[45px] pr-[12px] font-['Inter',sans-serif] text-[23px] font-semibold tracking-[-0.04em] text-white shadow-[0_10px_30px_rgba(180,115,255,0.35)] transition hover:scale-[1.03] hover:bg-[var(--color-primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)] ${className}`}
    >
      <span>{children}</span>
      <ArrowCircle />
    </button>
  )
}

function NamePill({
  name,
  color,
  className = '',
}: {
  name: string
  color: string
  className?: string
}) {
  return (
    <span
      className={`absolute rounded-full px-8 py-[9px] font-['Space_Grotesk',sans-serif] text-[19px] font-medium tracking-[-0.02em] text-white shadow-[0_10px_22px_rgba(0,0,0,0.08)] ${className}`}
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  )
}

function AvatarTile({
  src,
  alt,
  className = '',
  imageClassName = '',
}: {
  src: string
  alt: string
  className?: string
  imageClassName?: string
}) {
  return (
    <div className={`absolute flex items-center justify-center rounded-[30px] border-2 border-white/50 bg-white/50 shadow-[0_0_20px_rgba(0,0,0,0.14),inset_0_0_12px_rgba(255,255,255,0.8)] ${className}`}>
      <img src={src} alt={alt} className={`rounded-[20px] object-cover ${imageClassName}`} />
    </div>
  )
}

function StepTile({
  icon,
  alt,
  className = '',
  iconClassName = '',
}: {
  icon: string
  alt: string
  className?: string
  iconClassName?: string
}) {
  return (
    <article className={`flex h-[241px] w-[241px] items-center justify-center rounded-[23px] border-2 border-white/50 bg-white/50 shadow-[0_0_28px_rgba(0,0,0,0.07),inset_0_0_12px_rgba(255,255,255,0.8)] transition hover:-translate-y-2 ${className}`}>
      <img src={icon} alt={alt} className={`object-contain ${iconClassName}`} />
    </article>
  )
}

function LandingPageCanvas() {
  const navigate = useNavigate()

  return (
    <main className="relative h-[3027px] w-[1728px] overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-[176px] top-[-448px] h-[623px] w-[1376px] rounded-full bg-[radial-gradient(circle,_rgba(94,196,80,0.2)_0%,_rgba(163,82,255,0)_70%)]" />
      <div className="pointer-events-none absolute left-[1369px] top-[436px] h-[623px] w-[1376px] rounded-full bg-[radial-gradient(circle,_rgba(163,82,255,0.2)_0%,_rgba(163,82,255,0)_70%)]" />
      <div className="pointer-events-none absolute left-[-965px] top-[463px] h-[623px] w-[1185px] rounded-full bg-[radial-gradient(circle,_rgba(163,82,255,0.2)_0%,_rgba(163,82,255,0)_70%)]" />

      <header className="absolute left-[94px] top-[158px] flex w-[1540px] items-center justify-between">
        <img src={matchaiLogo} alt="MatchAI logo" width={69} height={69} className="h-[69px] w-[69px]" />
        <nav className="flex h-[69px] w-[552px] items-center justify-end rounded-[19px] bg-white px-[13px] shadow-[0_0_35px_rgba(0,0,0,0.12)]" aria-label="Main navigation">
          <div className="flex items-center gap-[33px]">
            <div className="flex gap-[32px] font-['Inter',sans-serif] text-[18px] font-semibold tracking-[-0.03em] text-[#464646]">
              {navItems.map((item) => (
                <button key={item} type="button" className="transition hover:text-[var(--color-primary)]">
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="h-[42px] w-[157px] rounded-[26px] bg-[var(--color-primary)] font-['Inter',sans-serif] text-[18px] font-semibold tracking-[-0.03em] text-white transition hover:bg-[var(--color-primary-strong)]"
            >
              Demo
            </button>
          </div>
        </nav>
      </header>

      <section className="absolute left-0 top-0 h-[900px] w-full">
        <AvatarTile src={hannahAvatar} alt="Hannah" className="left-[417px] top-[232px] h-[121px] w-[121px] -rotate-[6deg]" imageClassName="h-[78px] w-[78px] -rotate-[2deg]" />
        <NamePill name="Hannah" color="#b282e5" className="left-[482px] top-[346px]" />
        <NamePill name="Christian" color="#4868a9" className="left-[405px] top-[669px]" />
        <NamePill name="Julian" color="#7ca8ff" className="left-[1305px] top-[669px]" />
        <AvatarTile src={julianAvatar} alt="Julian" className="left-[1408px] top-[569px] h-[126px] w-[126px] rotate-[9deg]" imageClassName="h-[88px] w-[88px]" />

        <h1 className="absolute left-1/2 top-[397px] w-[1376px] -translate-x-1/2 text-center font-['Plus_Jakarta_Sans',sans-serif] text-[88px] font-extrabold leading-[97px] tracking-[-0.03em] text-[#2f2f2f] [text-shadow:0_0_99px_white]">
          <span className="text-[#5b5b5b]">Find</span> time <span className="text-[#5b5b5b]">for</span> friends <span className="text-[#5b5b5b]">between</span> busy schedules <span className="text-[#5b5b5b]">and</span> excuses
        </h1>
        <p className="absolute left-1/2 top-[641px] w-[460px] -translate-x-1/2 text-center font-['Geist',sans-serif] text-[27px] font-medium leading-[1.3] tracking-[-0.03em] text-[#979797]">
          We find the time. We pick the place. You just show up.
        </p>
        <CtaButton className="absolute left-[744px] top-[756px] w-[250px]">Let's go</CtaButton>
      </section>

      <section className="absolute left-[273px] top-[970px] h-[662px] w-[1192px] overflow-hidden rounded-[53px]">
        <img src={friendsPicture} alt="Group of friends" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="absolute left-[96px] top-[353px] flex h-[62px] w-[62px] items-center justify-center rounded-[10px] bg-white">
          <img src={matchaiLogo} alt="" aria-hidden className="h-[46px] w-[46px]" />
        </div>
        <p className="absolute left-[96px] top-[455px] w-[873px] font-['Outfit',sans-serif] text-[38px] font-semibold leading-[45px] text-white">
          Life gets busy, calendars fill up, and suddenly it's been months. It doesn't have to be that way.
        </p>
      </section>

      <section className="absolute left-0 top-[1792px] w-full text-center">
        <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-[70px] font-extrabold leading-[97px] tracking-[-0.03em] text-[#2f2f2f] [text-shadow:0_0_99px_white]">How it works</h2>
        <div className="mx-auto mt-[80px] grid w-[835px] grid-cols-3 gap-[50px]">
          <StepTile icon={googleCalendarLogo} alt="Google Calendar" className="-rotate-[4deg]" iconClassName="h-[183px] w-[183px]" />
          <StepTile icon={googleMapsPin} alt="Google Maps" className="-rotate-[2deg]" iconClassName="h-[112px] w-[112px]" />
          <StepTile icon={peopleGroup} alt="People group" className="-rotate-[3deg]" iconClassName="h-[92px] w-[92px]" />
        </div>
        <div className="relative mx-auto mt-[56px] h-[18px] w-[899px]">
          <div className="absolute left-0 top-[8px] h-[3px] w-full bg-gradient-to-r from-white via-[#dfdfdf] to-white" />
          <span className="absolute left-[152px] top-0 h-[17px] w-[17px] rounded-full bg-[#f4f4f4]" />
          <span className="absolute left-[442px] top-0 h-[17px] w-[17px] rounded-full bg-[#e0e0e0]" />
          <span className="absolute left-[731px] top-0 h-[17px] w-[17px] rounded-full bg-[#f4f4f4]" />
        </div>
        <div className="mx-auto mt-[26px] grid w-[835px] grid-cols-3 gap-[50px] font-['Geist',sans-serif] text-[24px] font-medium leading-[1.25] tracking-[-0.03em] text-[#979797]">
          <p>Finds a time that works for everyone.</p>
          <p>Finds the perfect place for everyone.</p>
          <p>All you have to do is show up.</p>
        </div>
        <CtaButton className="absolute left-[733px] top-[702px] w-[264px]">Get started</CtaButton>
      </section>

      <footer className="absolute bottom-0 left-0 flex h-[233px] w-full items-center justify-center bg-[var(--color-primary)]">
        <div className="flex items-center gap-6 text-[#d5afff]">
          <img src={matchaiMarkInverted} alt="" aria-hidden className="h-[74px] w-[74px]" />
          <span className="font-['Outfit',sans-serif] text-[165px] font-bold leading-none tracking-[-0.005em]">matcha</span>
        </div>
      </footer>
    </main>
  )
}

function LandingPage() {
  const scale = useDesignScale()

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-primary)]">
      <div className="relative mx-auto overflow-hidden bg-white" style={{ width: '100%', height: DESIGN_HEIGHT * scale }}>
        <div
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            marginLeft: scale === 1 ? 'auto' : 0,
            marginRight: scale === 1 ? 'auto' : 0,
          }}
        >
          <LandingPageCanvas />
        </div>
      </div>
    </div>
  )
}

export default LandingPage
