import { useNavigate } from 'react-router-dom'
import hannahAvatar from '../../components/ui/hannah_profile_icon.png'
import julianAvatar from '../../components/ui/julian_profile_icon.png'
import hannahBubble from '../../components/ui/hannah_bubble.png'
import christianBubble from '../../components/ui/christian_bubble.png'
import julianBubble from '../../components/ui/julian_bubble.png'
import heroImage from '../../assets/hero.png'
import matchaiMark from '../../assets/icons/matchai-logo.svg'
import matchaiMarkInverted from '../../assets/icons/matchai-mark-inverted.svg'
import peopleGroup from '../../assets/icons/people-group.svg'
import googleCalendarLogo from '../../assets/icons/google-calendar-icon.svg'
import googleMapsPin from '../../assets/icons/google-maps-icon.svg'
import friendsPicture from '/friends_picture.png'

const navItems = ['Product', 'Functions', 'About us']

function LandingHeaderNav() {
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between">
      <img src={matchaiMark} alt="MatchAI logo" width={69} height={69} className="h-[69px] w-[69px] text-[var(--color-primary)]" />
      <nav className="h-[69px] w-[552px] rounded-[19px] bg-white px-[56px] shadow-[0_0_20px_rgba(0,0,0,0.09)]" aria-label="Main navigation">
        <ul className="flex h-full items-center justify-between text-[18px] font-semibold tracking-[-0.03em] text-[#464646]">
          {navItems.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="transition-colors hover:text-[var(--color-heading)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                onClick={() => {
                  // TODO: wire navigation click handlers.
                }}
              >
                {item}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="h-[42px] min-w-[157px] rounded-full bg-[var(--color-primary)] px-5 py-2 text-[18px] text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => navigate('/signup')}
            >
              Demo
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

function PrimaryCtaButton({ label }: { label: string }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="inline-flex h-[76px] items-center gap-4 rounded-[38px] bg-[var(--color-primary)] px-11 py-3 text-[23px] font-semibold tracking-[-0.04em] text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-55"
      onClick={() => navigate('/signup')}
    >
      <span>{label}</span>
      <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.28)]">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="rotate-[-45deg]">
          <path d="M6 12h12M12 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

function FriendTag({ name, bubbleSrc, className }: { name: string; bubbleSrc: string; className?: string }) {
  return (
    <div className={className}>
      <img src={bubbleSrc} alt={`${name} chat bubble`} width={138} height={44} className="h-11 w-auto" />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative mt-[118px]">
      <div className="pointer-events-none absolute -left-[240px] -top-[210px] h-[625px] w-[1185px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.24)_0%,_rgba(180,115,255,0)_70%)]" />
      <div className="pointer-events-none absolute -right-[240px] top-[20px] h-[623px] w-[1376px] rounded-full bg-[radial-gradient(circle,_rgba(124,168,255,0.26)_0%,_rgba(124,168,255,0)_70%)]" />

      <div className="mx-auto flex max-w-[1376px] flex-col items-center text-center">
        <div className="relative w-full">
          <img src={hannahAvatar} alt="Hannah profile" width={120} height={120} className="absolute left-[240px] top-[-164px] w-[120px] rounded-[30px] shadow-[var(--shadow-soft)]" />
          <img src={julianAvatar} alt="Julian profile" width={126} height={126} className="absolute right-[162px] top-[160px] w-[126px] rounded-[30px] shadow-[var(--shadow-soft)]" />
          <FriendTag name="Hannah" bubbleSrc={hannahBubble} className="absolute left-[305px] top-[-70px]" />
          <FriendTag name="Christian" bubbleSrc={christianBubble} className="absolute left-[192px] top-[248px]" />
          <FriendTag name="Julian" bubbleSrc={julianBubble} className="absolute right-[126px] top-[248px]" />

          <h1 className="mx-auto max-w-[1376px] font-['Plus_Jakarta_Sans',sans-serif] text-[88px] font-extrabold leading-[97px] tracking-[-0.03em] text-[var(--color-heading)]">
            <span className="text-[var(--color-heading-soft)]">Find</span> time for friends <span className="text-[var(--color-heading-soft)]">between</span> busy schedules and excuses
          </h1>
        </div>
        <p className="mt-[34px] max-w-[460px] font-['Geist',sans-serif] text-[27px] leading-[1.3] tracking-[-0.03em] text-[var(--color-muted)]">
          We find the time. We pick the place. You just show up.
        </p>
        <div className="mt-[22px]">
          <PrimaryCtaButton label="Let’s go" />
        </div>
      </div>
    </section>
  )
}

function FriendsShowcaseCard() {
  const imageSource = friendsPicture || heroImage

  return (
    <section className="mt-[138px]">
      <article className="relative mx-auto w-full max-w-[1192px] overflow-hidden rounded-[var(--radius-hero-image)]">
        <img src={imageSource} alt="A group of friends smiling together" width={1192} height={662} className="h-auto w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.22)]" />
        <div className="absolute bottom-[84px] left-[96px] right-8 text-white">
          <img src={matchaiMarkInverted} alt="" aria-hidden width={62} height={62} className="mb-[38px] h-[62px] w-[62px]" />
          <p className="max-w-[873px] font-['Outfit',sans-serif] text-[38px] font-semibold leading-[45px]">
            Life gets busy, calendars fill up, and suddenly it’s been months. It doesn’t have to be that way.
          </p>
        </div>
      </article>
    </section>
  )
}

function HowItWorksSection() {
  const cards = [
    { title: 'Finds a time that works for everyone.', icon: googleCalendarLogo, alt: 'Google Calendar icon' },
    { title: 'Finds the perfect place for everyone.', icon: googleMapsPin, alt: 'Google Maps pin icon' },
    { title: 'All you have to do is show up.', icon: peopleGroup, alt: 'People group icon' },
  ]

  return (
    <section className="mt-[150px] pb-[224px]">
      <h2 className="text-center font-['Plus_Jakarta_Sans',sans-serif] text-[70px] font-extrabold leading-[97px] tracking-[-0.03em] text-[var(--color-heading)]">How it works</h2>
      <div className="mx-auto mt-[82px] grid max-w-[834px] grid-cols-3 gap-[38px]">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[22px] bg-white p-[31px] text-center shadow-[var(--shadow-soft)]">
            <img src={card.icon} alt={card.alt} width={97} height={97} className="mx-auto h-[97px] w-[97px]" />
          </article>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-[899px] items-center justify-between" aria-hidden>
        <span className="h-[2px] w-full bg-neutral-200" />
        <span className="mx-3 h-[17px] w-[17px] shrink-0 rounded-full bg-neutral-300" />
        <span className="mx-3 h-[17px] w-[17px] shrink-0 rounded-full bg-neutral-300" />
        <span className="h-[2px] w-full bg-neutral-200" />
      </div>
      <div className="mx-auto mt-8 grid max-w-[834px] grid-cols-3 gap-[38px] text-center">
        {cards.map((card) => (
          <p key={`${card.title}-copy`} className="px-3 font-['Geist',sans-serif] text-[24px] leading-[1.3] tracking-[-0.03em] text-[var(--color-muted)]">
            {card.title}
          </p>
        ))}
      </div>
      <div className="mt-[74px] text-center">
        <PrimaryCtaButton label="Get started" />
      </div>
    </section>
  )
}

function LandingFooterBrand() {
  return (
    <footer className="h-[233px] bg-[var(--color-primary)]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-center gap-5 px-6 text-[96px] font-extrabold leading-none text-[#d5afff]">
        <img src={matchaiMarkInverted} alt="" aria-hidden width={62} height={62} className="h-[74px] w-[74px]" />
        <span className="font-['Outfit',sans-serif] leading-none tracking-[-0.02em]">matcha</span>
      </div>
    </footer>
  )
}

function LandingPage() {
  return (
    <main>
      <section className="mx-auto max-w-[1728px] px-[94px] pb-0 pt-[158px]">
        <LandingHeaderNav />
        <HeroSection />
        <FriendsShowcaseCard />
        <HowItWorksSection />
      </section>
      <LandingFooterBrand />
    </main>
  )
}

export default LandingPage
