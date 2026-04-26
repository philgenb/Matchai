import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  AtSign,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LogOut,
  Globe2,
  Link2,
  LoaderCircle,
  MapPin,
  UsersRound,
} from 'lucide-react'
import matchaiLogo from '../../components/ui/matchai_logo.svg'
import googleCalendarIcon from '../../assets/icons/google-calendar-icon.svg'
import googleMapsIcon from '../../assets/icons/google-maps-icon.svg'
import { HannahPill, JulianPill } from '../../assets/icons/nametags/NamePill'
import matchParticipantsImage from '../../assets/images/match-participants.png'
import hannahAvatar from '../../components/ui/hannah_profile_icon.png'
import julianAvatar from '../../components/ui/julian_profile_icon.png'
import createGroupSymbol from '../../assets/images/create-a-group-symbol.png'
import { api, signOutFrontend } from '../../lib/api'
import { groupRoute, useAuthSession } from '../../lib/authSession'

const groupId = 'aral-chiller'
const chips = [
  'Café',
  'Bar',
  'Restaurant',
  'Brunch',
  'Walk',
  'Park',
  'Club',
  'Bowling',
  'Cinema',
  'Concert',
  'Museum',
  'Picnic',
  'Sports',
  'Hiking',
]
const cafeImage =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=780&q=80'
const LAST_GROUP_ID_KEY = 'matchai:lastGroupId'
const LAST_PROPOSAL_KEY = 'matchai:lastProposal'

function formatMeetingWindow(startsAt: Date, endsAt: Date) {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return 'To be confirmed'
  }

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(startsAt)
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${date}, ${time.format(startsAt)}-${time.format(endsAt)}`
}

function formatGoogleCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '')
}

function googleCalendarUrl(proposal, startsAt: Date, endsAt: Date) {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return 'https://calendar.google.com/calendar/u/0/r/eventedit'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: proposal.title || proposal.location_name,
    dates: `${formatGoogleCalendarDate(startsAt)}/${formatGoogleCalendarDate(endsAt)}`,
    details: [proposal.summary, proposal.rationale].filter(Boolean).join('\n\n'),
    location: [proposal.location_name, proposal.address].filter(Boolean).join(', '),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function FlowPageShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { clearSession } = useAuthSession()

  const handleLogout = async () => {
    await signOutFrontend()
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-[1728px] overflow-hidden bg-[#f7f7f7] px-[88px] pb-[24px] pt-[28px]">
      <div className="pointer-events-none absolute -left-[1060px] top-[438px] h-[728px] w-[1385px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.16)_0%,_rgba(180,115,255,0)_68%)]" />
      <div className="pointer-events-none absolute right-[-920px] top-[308px] h-[997px] w-[1265px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.12)_0%,_rgba(180,115,255,0)_70%)]" />
      <header className="relative z-10 flex items-start justify-between">
        <Link to="/" aria-label="MatchAI home">
          <img src={matchaiLogo} alt="" aria-hidden width={58} height={58} className="h-[58px] w-[58px]" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-[58px] w-[58px] items-center justify-center rounded-[19px] bg-white text-[#303030] shadow-[0_0_32px_rgba(0,0,0,0.08)] transition hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={22} strokeWidth={2.4} />
          </button>
        </div>
      </header>
      {children}
    </main>
  )
}

function IconButtonCircle({ className = '', iconSize = 22 }: { className?: string; iconSize?: number }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-[#7D3DC5] ${className || 'h-[50px] w-[50px]'}`}>
      <ArrowUpRight size={iconSize} strokeWidth={2.4} />
    </span>
  )
}

function AvatarStack() {
  return (
    <div className="relative mx-auto h-[170px] w-[430px]">
      <div className="absolute left-[16px] top-[12px] h-[108px] w-[108px] rotate-[-10deg] overflow-hidden rounded-[23px] bg-white p-3 shadow-[0_16px_36px_rgba(0,0,0,0.16)]">
        <img src={hannahAvatar} alt="" className="h-full w-full object-contain" />
      </div>
      <HannahPill className="z-20 left-[84px] top-[5px] scale-[0.92] origin-top-left" />
      <div className="absolute left-[172px] top-[18px] h-[126px] w-[102px] rounded-[16px] bg-white p-5 shadow-[0_16px_36px_rgba(0,0,0,0.14)]">
        <span className="mt-1 block h-4 w-12 rounded-full bg-[#e7e7e7]" />
        <span className="mt-4 block h-4 w-16 rounded-full bg-[#d8d8d8]" />
        <span className="mt-4 block h-4 w-7 rounded-full bg-[#d2d2d2]" />
      </div>
      <div className="absolute right-[7px] top-[69px] h-[102px] w-[102px] rotate-[9deg] overflow-hidden rounded-[23px] bg-white p-3 shadow-[0_16px_36px_rgba(0,0,0,0.16)]">
        <img src={julianAvatar} alt="" className="h-full w-full object-contain" />
      </div>
      <JulianPill className="right-[67px] top-[118px] scale-[0.86] origin-top-right" />
    </div>
  )
}

function WaitingAvatarStack() {
  return (
    <div className="relative mx-auto h-[126px] w-[340px]">
      <div className="absolute left-[26px] top-[11px] h-[78px] w-[78px] rotate-[-9deg] overflow-hidden rounded-[17px] bg-white p-[9px] shadow-[0_14px_34px_rgba(0,0,0,0.14)]">
        <img src={hannahAvatar} alt="" className="h-full w-full object-contain" />
      </div>
      <HannahPill className="z-20 left-[86px] top-[4px] scale-[0.7] origin-top-left" />
      <div className="absolute left-[158px] top-[22px] h-[92px] w-[78px] rounded-[13px] bg-white p-[16px] shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
        <span className="mt-1 block h-[11px] w-[38px] rounded-full bg-[#e7e7e7]" />
        <span className="mt-[12px] block h-[11px] w-[52px] rounded-full bg-[#d8d8d8]" />
        <span className="mt-[12px] block h-[11px] w-[23px] rounded-full bg-[#d2d2d2]" />
      </div>
      <div className="absolute right-[18px] top-[50px] h-[74px] w-[74px] rotate-[9deg] overflow-hidden rounded-[17px] bg-white p-[9px] shadow-[0_14px_34px_rgba(0,0,0,0.14)]">
        <img src={julianAvatar} alt="" className="h-full w-full object-contain" />
      </div>
      <JulianPill className="right-[70px] top-[98px] scale-[0.64] origin-top-right" />
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[34px] rounded-full px-5 py-2 font-['Outfit',sans-serif] text-[14px] font-bold transition ${
        active
          ? 'bg-[#d9b9ff] text-[#7639b1] hover:bg-[#cfa8fb]'
          : 'bg-[#d8d8d8] text-[#555] hover:bg-[#c9c9c9] hover:text-[#3e3e3e]'
      }`}
    >
      {label}
    </button>
  )
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-full bg-[#e4e4e4] blur-[0.6px] ${className}`} />
}

function WaitingGroupSkeleton() {
  return (
    <FlowPageShell>
      <section className="relative mx-auto mt-[28px] max-w-[1000px] text-center">
        <div className="pointer-events-none opacity-45 blur-[1px]">
          <WaitingAvatarStack />
        </div>

        <div className="mx-auto mt-[14px] flex max-w-[680px] flex-col items-center gap-[8px]">
          <SkeletonBlock className="h-[40px] w-[570px] max-w-full rounded-[14px]" />
          <SkeletonBlock className="h-[24px] w-[250px] max-w-[70%] rounded-[14px]" />
        </div>

        <div className="mx-auto mt-[24px] flex max-w-[720px] flex-col items-center gap-[8px]">
          <SkeletonBlock className="h-[16px] w-[680px] max-w-full rounded-[8px]" />
          <SkeletonBlock className="h-[16px] w-[500px] max-w-[82%] rounded-[8px]" />
        </div>

        <div className="mx-auto mt-[34px] flex h-[54px] w-[270px] animate-pulse items-center justify-between rounded-[27px] bg-[#d9c7ef] pl-9 pr-[7px] blur-[0.4px]">
          <span className="h-[15px] w-[140px] rounded-full bg-[#c6acd9]" />
          <span className="h-[40px] w-[40px] rounded-full bg-[rgba(120,54,199,0.22)]" />
        </div>
        <SkeletonBlock className="mx-auto mt-3 h-[12px] w-[160px] rounded-[7px]" />

        <section className="mt-[70px]">
          <SkeletonBlock className="mx-auto h-[20px] w-[220px] rounded-[8px]" />
          <div className="mt-[26px] flex flex-wrap justify-center gap-[16px]">
            <SkeletonBlock className="h-[44px] w-[216px] rounded-[9px]" />
            <SkeletonBlock className="h-[44px] w-[216px] rounded-[9px]" />
            <SkeletonBlock className="h-[44px] w-[216px] rounded-[9px]" />
          </div>
        </section>
      </section>
    </FlowPageShell>
  )
}

function MatchSkeleton() {
  return (
    <FlowPageShell>
      <section className="mx-auto mt-[36px] grid max-w-[1080px] grid-cols-[520px_340px] gap-[120px]">
        <div className="pt-[18px]">
          <SkeletonBlock className="h-[24px] w-[145px] rounded-[10px]" />
          <div className="mt-5 space-y-3">
            <SkeletonBlock className="h-[56px] w-[440px] rounded-[16px]" />
            <SkeletonBlock className="h-[42px] w-[300px] rounded-[16px]" />
          </div>
          <div className="mt-[30px] space-y-2">
            <SkeletonBlock className="h-[20px] w-[500px] rounded-[8px]" />
            <SkeletonBlock className="h-[20px] w-[450px] rounded-[8px]" />
            <SkeletonBlock className="h-[20px] w-[350px] rounded-[8px]" />
          </div>

          <div className="mt-[42px] w-[440px] overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white/65 blur-[0.3px]">
            {['w-[160px]', 'w-[120px]', 'w-[145px]'].map((width, index) => (
              <div key={width} className={`grid h-[48px] grid-cols-[1fr_1fr] items-center px-7 ${index < 2 ? 'border-b border-[#e9e9e9]' : ''}`}>
                <SkeletonBlock className="h-[15px] w-[100px] rounded-[8px]" />
                <SkeletonBlock className={`ml-auto h-[15px] ${width} rounded-[8px]`} />
              </div>
            ))}
          </div>

          <div className="mt-[56px] flex items-center gap-5">
            <div className="flex h-[60px] w-[230px] animate-pulse items-center justify-between rounded-[30px] bg-[#d9c7ef] pl-8 pr-[9px] blur-[0.4px]">
              <span className="h-[19px] w-[125px] rounded-full bg-[#c6acd9]" />
              <span className="h-[42px] w-[42px] rounded-full bg-[rgba(120,54,199,0.22)]" />
            </div>
            <div className="flex items-center blur-[0.5px]">
              <span className="z-30 h-[58px] w-[58px] rounded-full bg-[#eeeeee]" />
              <span className="z-20 -ml-4 h-[58px] w-[58px] rounded-full bg-[#eeeeee]" />
              <span className="-ml-3 h-[34px] w-[34px] rounded-full bg-[#eeeeee]" />
            </div>
          </div>
        </div>

        <aside className="pt-[60px]">
          <div className="relative h-[300px] w-[300px] animate-pulse overflow-hidden rounded-[12px] bg-[#dedede] blur-[0.6px]">
            <span className="absolute left-[20px] top-[22px] h-[50px] w-[74px] rounded-[25px] bg-white/80" />
            <span className="absolute right-[22px] top-[22px] h-[50px] w-[130px] rounded-[25px] bg-white/80" />
          </div>

          <div className="mt-[32px] flex items-center gap-5">
            <SkeletonBlock className="h-[54px] w-[245px] rounded-[27px]" />
            <SkeletonBlock className="h-[54px] w-[76px] rounded-[27px]" />
          </div>

          <SkeletonBlock className="mx-auto mt-[50px] h-[15px] w-[280px] rounded-[8px]" />
        </aside>
      </section>
    </FlowPageShell>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { ensureGroups, refreshSession } = useAuthSession()
  const [liked, setLiked] = useState(['Café', 'Bar'])
  const [homeCity, setHomeCity] = useState('Munich')
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarEmail, setCalendarEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [backendReady, setBackendReady] = useState(false)
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false)
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    const calendarResult = new URLSearchParams(location.search).get('calendar')
    const calendarErrorReason = new URLSearchParams(location.search).get('reason')

    if (calendarResult === 'connected') {
      setFeedback('')
      window.history.replaceState({}, '', '/onboarding')
    } else if (calendarResult === 'error') {
      setFeedback(calendarErrorReason ? `Google Calendar connection failed: ${calendarErrorReason}` : 'Google Calendar connection failed. Please try again.')
      window.history.replaceState({}, '', '/onboarding')
    }

    Promise.all([api.me(), api.getPreferences(), api.getCalendarStatus()])
      .then(([, preferences, calendar]) => {
        if (cancelled) return
        setLiked((preferences.interests || []).map((interest: string) => (interest === 'Cafe' ? 'Café' : interest)))
        setHomeCity(preferences.home_city || preferences.location_label || 'Munich')
        setCalendarConnected(Boolean(calendar.connected || preferences.calendar_connected))
        setCalendarEmail(calendar.google_email || '')
        setBackendReady(true)
        if (!calendarResult) setFeedback('')
      })
      .catch((error) => {
        if (cancelled) return
        setBackendReady(false)
        setFeedback(error instanceof Error ? error.message : 'Could not load your profile from the backend.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [location.search])

  const toggle = (list: string[], setter: (items: string[]) => void, chip: string) => {
    setter(list.includes(chip) ? list.filter((item) => item !== chip) : [...list, chip])
  }

  const connectCalendar = async () => {
    if (!backendReady || calendarConnected || isConnectingCalendar) return
    setIsConnectingCalendar(true)
    setFeedback('Opening Google Calendar connection...')
    try {
      const response = await api.connectCalendar()
      window.location.href = response.auth_url
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setFeedback(
        message === 'Google Calendar OAuth is not configured'
          ? 'Google Calendar setup is missing in the backend .env.'
          : message || 'Calendar connection is not ready yet.',
      )
      setIsConnectingCalendar(false)
    }
  }

  const disconnectCalendar = async () => {
    if (!backendReady || !calendarConnected || isDisconnectingCalendar) return
    setIsDisconnectingCalendar(true)
    setFeedback('')
    try {
      const calendar = await api.disconnectCalendar()
      setCalendarConnected(Boolean(calendar.connected))
      setCalendarEmail(calendar.google_email || '')
      setFeedback('Google Calendar disconnected.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not disconnect Google Calendar.')
    } finally {
      setIsDisconnectingCalendar(false)
    }
  }

  const savePreferences = async () => {
    if (!backendReady || isLoading) return
    setIsSaving(true)
    setFeedback('')
    try {
      await api.savePreferences({
        interests: liked.map((interest) => (interest === 'Café' ? 'Cafe' : interest)),
        home_city: homeCity,
        location_label: homeCity,
        calendar_connected: calendarConnected,
        onboarding_completed: true,
      })
      setIsSaving(false)
      await refreshSession()
      const groups = await ensureGroups()
      navigate(groups.length > 0 ? groupRoute(groups[0]) : '/groups/new')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not save preferences. Please try again.')
      setIsSaving(false)
    }
  }

  const sortedChips = [...chips].sort((left, right) => Number(liked.includes(right)) - Number(liked.includes(left)))

  return (
    <FlowPageShell>
      <section className="relative mx-auto mt-[10px] h-[592px] w-[932px] rounded-[28px] border-[2px] border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.65)] px-[58px] py-[52px] shadow-[0_0_40px_rgba(0,0,0,0.07)] [box-shadow:inset_0_0_16px_rgba(255,255,255,0.8),0_0_40px_rgba(0,0,0,0.07)]">
        <img src={matchaiLogo} alt="" aria-hidden className="absolute right-[58px] top-[48px] h-[56px] w-[56px]" />
        <div className="absolute left-[284px] top-[52px]">
          <div className="relative h-[86px] w-[168px]">
            <img
              src={julianAvatar}
              alt=""
              className="absolute left-[64px] top-[-4px] h-[90px] w-[90px] rotate-[8deg] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
            />
            <JulianPill className="-left-[10px] top-[48px] scale-[0.72] origin-top-left" />
          </div>
        </div>

        <h1 className="font-['Outfit',sans-serif] text-[38px] font-bold tracking-[-0.99px] text-[#232323]">Set your vibe</h1>

        <div className="mt-[34px] grid grid-cols-[268px_348px] gap-[94px]">
          <div>
            <p className="mb-4 font-['Outfit',sans-serif] text-[14px] font-bold text-[#2f2f2f]">Link Google Calendar</p>
            <button
              type="button"
              onClick={connectCalendar}
              disabled={!backendReady || isLoading || isConnectingCalendar}
              className={`flex h-[52px] w-[268px] items-center gap-3 rounded-[12px] px-5 font-['Outfit',sans-serif] text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                calendarConnected
                  ? 'cursor-default border border-[#d7d7d7] bg-white text-[#303030] hover:bg-[#f1f1f1]'
                  : 'bg-[#ededed] text-[#2f2f2f] hover:bg-[#dedede]'
              }`}
            >
              <img src={googleCalendarIcon} alt="" className="h-[34px] w-[34px] shrink-0" />
              <span className="flex items-center gap-3 whitespace-nowrap text-[14px] font-medium">
                {calendarConnected ? 'Connected' : isConnectingCalendar ? 'Opening...' : 'Google Calendar'}
                {calendarConnected && <span className="h-[7px] w-[7px] rounded-full bg-[#1fd66f] shadow-[0_0_0_4px_rgba(31,214,111,0.18)] animate-pulse" aria-hidden />}
              </span>
            </button>
            {calendarConnected && (
              <div className="mt-2 flex w-[268px] items-center justify-between gap-3">
                <p className="min-w-0 truncate font-['Outfit',sans-serif] text-[12px] font-medium text-[#7f7f7f]">
                  {calendarEmail || 'Calendar connected'}
                </p>
                <button
                  type="button"
                  onClick={disconnectCalendar}
                  disabled={isDisconnectingCalendar}
                  className="shrink-0 font-['Outfit',sans-serif] text-[12px] font-bold text-[#8650c1] disabled:opacity-50"
                >
                  {isDisconnectingCalendar ? '...' : 'Disconnect'}
                </button>
              </div>
            )}
          </div>
          <label className="block pt-[4px]">
            <span className="font-['Outfit',sans-serif] text-[14px] font-bold text-[#2f2f2f]">Home City / Location</span>
            <span className="mt-4 flex h-[52px] w-full items-center rounded-[12px] border border-[rgba(0,0,0,0.1)] bg-white px-5">
              <MapPin size={22} className="text-[#3d3d3d]" />
              <span aria-hidden className="mx-5 h-[31px] w-px bg-[#dddddd]" />
              <input
                value={homeCity}
                onChange={(event) => setHomeCity(event.target.value)}
                className="w-full bg-transparent font-['Outfit',sans-serif] text-[14px] font-medium text-[#3e3e3e] outline-none"
              />
            </span>
          </label>
        </div>

        <div className="mx-2 mt-[42px] h-[3px] bg-[#eeeeee]" />

        <div className="mt-[30px] px-2">
          <div>
            <p className="mb-[16px] font-['Outfit',sans-serif] text-[14px] font-bold text-[#2f2f2f]">Activities you like 👍</p>
            <div className="flex w-full flex-wrap gap-x-[8px] gap-y-[8px]">
              {sortedChips.map((chip) => (
                <Chip key={chip} label={chip} active={liked.includes(chip)} onClick={() => toggle(liked, setLiked, chip)} />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-[46px] right-[46px] flex justify-end px-2">
          <div className="flex flex-col items-end">
            <div className="relative mb-3 mr-[210px] h-[39px] w-[101px]" aria-hidden>
              <HannahPill className="left-0 top-0 scale-[0.72] origin-top-left" />
            </div>
            <button
              type="button"
              disabled={isSaving || !backendReady || isLoading}
              onClick={savePreferences}
              className="relative flex h-[52px] w-[220px] items-center overflow-hidden rounded-[26px] bg-[var(--color-primary)] pl-8 pr-[64px] font-['Outfit',sans-serif] text-[16px] font-normal text-white transition hover:bg-[#9b5df0] disabled:opacity-60"
            >
              {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Set Preferences'}
              <IconButtonCircle className="absolute right-[7px] top-1/2 h-[38px] w-[38px] -translate-y-1/2" iconSize={17} />
            </button>
            {feedback && <p className="mt-2 max-w-[280px] text-right font-['Outfit',sans-serif] text-[12px] font-bold text-[#979797]">{feedback}</p>}
          </div>
        </div>
      </section>

      <div className="mt-[24px] flex items-center justify-center gap-[8px] min-[1400px]:mt-[34px]" aria-hidden>
        <span className="h-[6px] w-[36px] rounded-l-[77px] bg-[var(--color-primary)]" />
        <span className="h-[6px] w-[36px] bg-[var(--color-primary)]" />
        <span className="h-[6px] w-[36px] rounded-r-[77px] bg-[#e3e3e3]" />
      </div>
    </FlowPageShell>
  )
}

export function CreateGroupPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuthSession()
  const [groupName, setGroupName] = useState('')
  const [createdGroup, setCreatedGroup] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const ensureGroup = async () => {
    if (createdGroup) {
      return createdGroup
    }

    setIsCreating(true)
    setError('')
    try {
      await api.me()
      const group = await api.createGroup({
        name: groupName.trim() || 'New group',
        description: 'We check calendars, locations, and preferences to suggest the best meetup.',
      })
      window.localStorage.setItem(LAST_GROUP_ID_KEY, group.id)
      setCreatedGroup(group)
      await refreshSession()
      return group
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the group. Please try again.')
      return null
    } finally {
      setIsCreating(false)
    }
  }

  const inviteLink = createdGroup ? `${window.location.origin}/groups/join/${createdGroup.id}` : ''

  const copyInviteLink = async () => {
    const group = await ensureGroup()
    if (!group) return

    const link = `${window.location.origin}/groups/join/${group.id}`
    try {
      await window.navigator.clipboard.writeText(link)
      setCopyStatus('Link copied.')
    } catch {
      setCopyStatus(link)
    }
  }

  const finishGroup = async () => {
    const group = await ensureGroup()
    if (group) {
      navigate(`/groups/${group.id}/waiting`)
    }
  }

  return (
    <FlowPageShell>
      <section className="relative mx-auto mt-[10px] h-[592px] w-[932px] rounded-[28px] border-[2px] border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.65)] px-[58px] py-[52px] shadow-[0_0_40px_rgba(0,0,0,0.07)] [box-shadow:inset_0_0_16px_rgba(255,255,255,0.8),0_0_40px_rgba(0,0,0,0.07)]">
        <img src={matchaiLogo} alt="" aria-hidden className="absolute right-[58px] top-[48px] h-[56px] w-[56px]" />
        <img
          src={createGroupSymbol}
          alt=""
          aria-hidden
          className="absolute right-[92px] top-[44px] h-auto w-[262px]"
        />

        <div className="max-w-[816px]">
          <h1 className="font-['Outfit',sans-serif] text-[38px] font-bold tracking-[-0.99px] text-[#232323]">Create a group</h1>

          <label className="mt-[40px] block w-[348px]">
            <span className="font-['Outfit',sans-serif] text-[14px] font-bold text-[#2f2f2f]">Give your group a name</span>
            <span className="mt-4 flex h-[52px] w-full items-center rounded-[12px] border border-[rgba(0,0,0,0.1)] bg-white px-5">
              <UsersRound size={22} className="text-[#3d3d3d]" />
              <span aria-hidden className="mx-5 h-[31px] w-px bg-[#dddddd]" />
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="New group"
                disabled={Boolean(createdGroup)}
                className="w-full bg-transparent font-['Outfit',sans-serif] text-[14px] font-medium text-[#3e3e3e] outline-none disabled:text-[#7b7b7b]"
              />
            </span>
          </label>

          <div className="mx-2 mt-[36px] h-[3px] bg-[#eeeeee]" />

          <h2 className="mt-[28px] font-['Outfit',sans-serif] text-[21px] font-bold tracking-[-0.03em] text-[#303030]">Invite your friends</h2>
          <div className="mt-[24px] grid grid-cols-[260px_1fr] gap-[42px]">
            <div>
              <p className="mb-[14px] font-['Outfit',sans-serif] text-[14px] font-bold text-[#2f2f2f]">Via Link</p>
              <button
                type="button"
                disabled={isCreating}
                onClick={copyInviteLink}
                className="ml-5 flex h-[50px] w-[164px] items-center justify-center gap-3 rounded-[14px] bg-[#eef3ff] font-['Outfit',sans-serif] text-[16px] font-bold text-[#7ca8ff] transition hover:bg-[#dfe9ff] hover:text-[#5f91f0] disabled:opacity-60"
              >
                <Link2 size={20} />
                {isCreating ? 'Creating...' : 'Copy Link'}
              </button>
              <p className="mt-[20px] max-w-[250px] break-words font-['Outfit',sans-serif] text-[12px] font-medium text-[#7f7f7f]">
                {copyStatus || inviteLink || 'Send this link to your friends to plan together.'}
              </p>
            </div>

            <div>
              <p className="mb-[14px] font-['Outfit',sans-serif] text-[14px] font-bold text-[#2f2f2f]">Via Email</p>
              <div className="flex items-center gap-[12px]">
                <span className="flex h-[52px] w-[312px] items-center rounded-[12px] border border-[#d7d7d7] bg-white px-5 opacity-80">
                  <AtSign size={19} className="text-[#3d3d3d]" />
                  <span aria-hidden className="mx-5 h-[31px] w-px bg-[#dddddd]" />
                  <span className="font-['Outfit',sans-serif] text-[14px] font-medium text-[#3e3e3e]">mustermann@gmail.com</span>
                  <CheckCircle2 size={17} className="ml-auto text-[#244c99]" />
                </span>
                <button
                  type="button"
                  disabled
                  className="h-[52px] w-[88px] rounded-[16px] bg-[var(--color-primary)] font-['Outfit',sans-serif] text-[16px] font-normal text-white opacity-60"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="mt-[28px] flex justify-end pb-[18px]">
            <button
              type="button"
              disabled={isCreating}
              onClick={finishGroup}
              className="relative flex h-[52px] w-[146px] items-center justify-center overflow-hidden rounded-[26px] bg-[var(--color-primary)] px-[50px] font-['Outfit',sans-serif] text-[16px] font-normal text-white transition hover:bg-[#9b5df0] disabled:opacity-60"
            >
              {isCreating ? 'Creating...' : 'Finish'}
              <IconButtonCircle className="absolute right-[7px] top-1/2 h-[38px] w-[38px] -translate-y-1/2" iconSize={17} />
            </button>
          </div>

          {error && <p className="mt-3 text-right font-['Outfit',sans-serif] text-[12px] font-bold text-[#979797]">{error}</p>}
        </div>
      </section>

      <div className="mt-[24px] flex items-center justify-center gap-[8px] min-[1400px]:mt-[34px]" aria-hidden>
        <span className="h-[6px] w-[36px] rounded-l-[77px] bg-[var(--color-primary)]" />
        <span className="h-[6px] w-[36px] bg-[var(--color-primary)]" />
        <span className="h-[6px] w-[36px] rounded-r-[77px] bg-[var(--color-primary)]" />
      </div>
    </FlowPageShell>
  )
}

export function WaitingForGroupMatchPage() {
  const navigate = useNavigate()
  const { groupId: routeGroupId } = useParams()
  const { refreshSession } = useAuthSession()
  const [groupDetail, setGroupDetail] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoadingGroup, setIsLoadingGroup] = useState(true)
  const [progress, setProgress] = useState(0)
  const [matchingStarted, setMatchingStarted] = useState(false)
  const [scheduleFinished, setScheduleFinished] = useState(false)
  const [scheduleBlocked, setScheduleBlocked] = useState(false)
  const [statusText, setStatusText] = useState('')

  useEffect(() => {
    const activeGroupId = routeGroupId || window.localStorage.getItem(LAST_GROUP_ID_KEY) || groupId
    let cancelled = false

    Promise.all([api.me(), api.getGroup(activeGroupId)])
      .then(([user, group]) => {
        if (cancelled) return
        setCurrentUser(user)
        setGroupDetail(group)
        window.localStorage.setItem(LAST_GROUP_ID_KEY, group.id)
        if (group.status === 'proposal_found' || group.status === 'confirmed') {
          navigate(`/groups/${group.id}/match`, { replace: true })
        }
      })
      .catch((error) => {
        if (cancelled) return
        setStatusText(error instanceof Error ? error.message : 'Could not load this group.')
        setScheduleBlocked(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGroup(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate, routeGroupId])

  useEffect(() => {
    if (!matchingStarted) return undefined

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (scheduleBlocked) {
          window.clearInterval(interval)
          return current
        }

        if (current >= 100 && scheduleFinished) {
          window.clearInterval(interval)
          window.setTimeout(() => navigate(`/groups/${routeGroupId || window.localStorage.getItem(LAST_GROUP_ID_KEY) || groupId}/match`), 500)
          return 100
        }

        return Math.min(scheduleFinished ? 100 : 90, current + 10)
      })
    }, 320)

    return () => window.clearInterval(interval)
  }, [matchingStarted, navigate, routeGroupId, scheduleBlocked, scheduleFinished])

  const startMatching = async () => {
    const activeGroupId = routeGroupId || groupDetail?.id || window.localStorage.getItem(LAST_GROUP_ID_KEY) || groupId
    if (!canStartMatching) {
      setStatusText(
        hasEnoughMembers
          ? 'Only the group creator can start matching.'
          : 'Invite at least one more person before starting location matching.',
      )
      return
    }

    setMatchingStarted(true)
    setScheduleBlocked(false)
    setScheduleFinished(false)
    setProgress(0)
    setStatusText('Starting backend match...')

    try {
      const proposal = await api.scheduleGroup(activeGroupId)
      window.localStorage.setItem(LAST_PROPOSAL_KEY, JSON.stringify(proposal))
      setStatusText('Proposal found.')
      setScheduleFinished(true)
      await refreshSession()
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Could not start matching.')
      setScheduleBlocked(true)
    }
  }

  const isOwner = Boolean(
    groupDetail?.participants?.some((participant) => participant.role === 'owner' && participant.user.id === currentUser?.id),
  )
  const memberCount = groupDetail?.member_count ?? groupDetail?.participants?.length ?? 0
  const hasEnoughMembers = memberCount >= 2
  const canStartMatching = isOwner && hasEnoughMembers

  if (isLoadingGroup) {
    return <WaitingGroupSkeleton />
  }

  if (!groupDetail) {
    return (
      <FlowPageShell>
        <section className="mx-auto mt-[220px] max-w-[820px] text-center">
          <h1 className="font-['Outfit',sans-serif] text-[64px] font-bold tracking-[-0.04em] text-[#303030]">
            Group unavailable
          </h1>
          <p className="mx-auto mt-8 max-w-[640px] font-['Geist',sans-serif] text-[24px] font-medium leading-[1.3] tracking-[-0.03em] text-[#979797]">
            {statusText || 'Could not load this group.'}
          </p>
        </section>
      </FlowPageShell>
    )
  }

  return (
    <FlowPageShell>
      <section className="relative mx-auto mt-[28px] max-w-[1000px] text-center">
        <WaitingAvatarStack />
        <h1 className="mt-[14px] font-['Outfit',sans-serif] text-[48px] font-bold leading-[1.04] tracking-[-0.045em] text-[#303030]">
          {matchingStarted ? 'Finding your group match.' : `${groupDetail.name} is all set.`}
        </h1>
        <p className="mx-auto mt-[32px] max-w-[760px] font-['Geist',sans-serif] text-[20px] font-medium leading-[1.24] tracking-[-0.035em] text-[#979797]">
          {matchingStarted
            ? 'We check your calendars, look at your locations, and suggest meetups that match your preferences.'
            : isOwner
              ? 'We check your calendars, look at your locations, and suggest meetups that match your preferences. You’ll get a WhatsApp from us, just sit back.'
              : 'You joined the group. The creator can start matching when everyone is ready.'}
        </p>
        {matchingStarted ? (
          <div className="mx-auto mt-[42px] flex h-[54px] w-[270px] items-center justify-between rounded-[27px] bg-[var(--color-primary)] pl-9 pr-[7px] font-['Outfit',sans-serif] text-[16px] font-semibold tracking-[-0.03em] text-white">
            Matching {progress}%
            <span className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[rgba(120,54,199,0.34)]">
              <LoaderCircle className="animate-spin" size={20} />
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canStartMatching}
            onClick={startMatching}
            className="mx-auto mt-[42px] flex h-[54px] w-[270px] items-center justify-between rounded-[27px] bg-[var(--color-primary)] pl-9 pr-[7px] font-['Outfit',sans-serif] text-[16px] font-semibold tracking-[-0.03em] text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            title={
              hasEnoughMembers
                ? isOwner
                  ? 'Start location matching'
                  : 'Only the group creator can start matching'
                : 'Invite at least one more person before starting location matching'
            }
          >
            Find a meeting ASAP
            <IconButtonCircle className="h-[40px] w-[40px]" iconSize={19} />
          </button>
        )}
        <p className="mt-3 font-['Outfit',sans-serif] text-[12px] font-semibold text-[#979797]">
          {statusText || (!hasEnoughMembers ? 'Location matching starts once at least 2 people are in this group.' : '')}
        </p>

        <section className="mt-[70px]">
          <h2 className="font-['Outfit',sans-serif] text-[19px] font-bold tracking-[-0.045em] text-[#303030]">Members of {groupDetail.name}</h2>
          <div className="mt-[26px] flex flex-wrap justify-center gap-[16px]">
            {groupDetail.participants.map((participant) => (
              <span
                key={participant.user.id}
                className={`flex h-[44px] w-[216px] items-center justify-between rounded-[9px] px-[20px] font-['Outfit',sans-serif] text-[15px] font-semibold tracking-[-0.02em] ${
                  participant.role === 'owner' ? 'bg-[var(--color-primary)] text-white' : 'bg-[#f1f1f1] text-[#666]'
                }`}
              >
                <span className="truncate">{participant.user.email}</span>
                {participant.role === 'owner' ? <CheckCircle2 size={17} /> : <Clock3 size={18} className="text-[#111]" />}
              </span>
            ))}
          </div>
        </section>
      </section>
    </FlowPageShell>
  )
}

export function GroupMatchPage() {
  const { groupId: routeGroupId } = useParams()
  const [confirmed, setConfirmed] = useState(false)
  const [proposal, setProposal] = useState(null)
  const [isLoadingProposal, setIsLoadingProposal] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const activeGroupId = routeGroupId || window.localStorage.getItem(LAST_GROUP_ID_KEY)
    if (!activeGroupId) {
      setLoadError('No group selected. Create a group before opening a match.')
      setIsLoadingProposal(false)
      return
    }

    api.getProposal(activeGroupId)
      .then((latestProposal) => {
        setProposal(latestProposal)
        window.localStorage.setItem(LAST_PROPOSAL_KEY, JSON.stringify(latestProposal))
        setLoadError('')
      })
      .catch((error) => {
        setProposal(null)
        setLoadError(error instanceof Error ? error.message : 'Could not load the proposal from the backend.')
      })
      .finally(() => {
        setIsLoadingProposal(false)
      })
  }, [routeGroupId])

  const countMeIn = async () => {
    if (!proposal) return
    setFeedback('Saving RSVP...')
    try {
      const updated = await api.rsvp(proposal.id, 'accept')
      setProposal(updated)
      window.localStorage.setItem(LAST_PROPOSAL_KEY, JSON.stringify(updated))
      setConfirmed(true)
      setFeedback('RSVP saved.')
    } catch (error) {
      setConfirmed(false)
      setFeedback(error instanceof Error ? error.message : 'Could not save RSVP. Please try again.')
    }
  }

  if (isLoadingProposal) {
    return <MatchSkeleton />
  }

  if (loadError || !proposal) {
    return (
      <FlowPageShell>
        <section className="mx-auto mt-[220px] max-w-[820px] text-center">
          <h1 className="font-['Outfit',sans-serif] text-[64px] font-bold tracking-[-0.04em] text-[#303030]">
            Match unavailable
          </h1>
          <p className="mx-auto mt-8 max-w-[640px] font-['Geist',sans-serif] text-[24px] font-medium leading-[1.3] tracking-[-0.03em] text-[#979797]">
            {loadError}
          </p>
          <Link
            to="/groups/new"
            className="mx-auto mt-12 flex h-[59px] w-[250px] items-center justify-center rounded-[29px] bg-[var(--color-primary)] font-['Outfit',sans-serif] text-[18px] font-bold text-white"
          >
            Back to group
          </Link>
        </section>
      </FlowPageShell>
    )
  }

  const startsAt = new Date(proposal.starts_at)
  const endsAt = new Date(proposal.ends_at)
  const meetingWindowLabel = formatMeetingWindow(startsAt, endsAt)
  const openStatusLabel =
    proposal.opens_at ||
    proposal.opening_hours ||
    (proposal.open_now === true ? 'Open now' : proposal.open_now === false ? 'Currently closed' : 'Unavailable')
  const rawPriceLevel =
    typeof proposal.price_level === 'number'
      ? proposal.price_level
      : typeof proposal.priceLevel === 'number'
        ? proposal.priceLevel
        : null
  const priceLevel = Number.isInteger(rawPriceLevel) ? Math.max(0, Math.min(4, rawPriceLevel)) : 0
  const mapsUrl = proposal.source_url || '#'
  const websiteUrl = proposal.website_url || ''
  const calendarUrl = googleCalendarUrl(proposal, startsAt, endsAt)

  return (
    <FlowPageShell>
      <section className="mx-auto mt-[36px] grid max-w-[1080px] grid-cols-[520px_340px] gap-[120px]">
        <div className="pt-[18px]">
          <p className="font-['Outfit',sans-serif] text-[22px] font-bold tracking-[-0.04em] text-[#b5b5b5]">What about</p>
          <h1 className="mt-5 font-['Outfit',sans-serif] text-[58px] font-bold leading-[0.98] tracking-[-0.05em] text-[#303030]">
            {proposal.location_name}
          </h1>
          <p className="mt-[30px] max-w-[520px] font-['Geist',sans-serif] text-[18px] font-medium leading-[1.24] tracking-[-0.03em] text-[#979797]">
            {proposal.summary}
          </p>

          <div className="mt-[42px] w-[440px] overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white font-['Outfit',sans-serif] text-[16px] font-semibold text-[#303030]">
            <div className="grid h-[48px] grid-cols-[1fr_1fr] items-center border-b border-[#e9e9e9] px-7">
              <span>Date</span>
              <span className="whitespace-nowrap text-right text-[#858585]">{meetingWindowLabel}</span>
            </div>
            <div className="grid h-[48px] grid-cols-[1fr_1fr] items-center border-b border-[#e9e9e9] px-7">
              <span>Opened</span>
              <span className="text-right text-[#858585]">{openStatusLabel}</span>
            </div>
            <div className="grid h-[48px] grid-cols-[1fr_1fr] items-center px-7">
              <span>Price</span>
              <span className="flex justify-end gap-[6px] text-[var(--color-primary)]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <CircleDollarSign key={index} size={18} className={index >= priceLevel ? 'opacity-20' : ''} />
                ))}
              </span>
            </div>
          </div>

          <div className="mt-[56px] flex items-center gap-5">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-[60px] w-[230px] items-center justify-between rounded-[30px] bg-[var(--color-primary)] pl-8 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold tracking-[-0.03em] text-white transition hover:bg-[var(--color-primary-strong)]"
            >
              Add to Calendar
              <IconButtonCircle className="h-[42px] w-[42px]" iconSize={19} />
            </a>
            <img src={matchParticipantsImage} alt="Two friends and two more participants" className="h-[88px] w-auto shrink-0" />
          </div>
        </div>

        <aside className="pt-[60px]">
          <div className="relative h-[300px] w-[300px] overflow-hidden rounded-[12px]">
            <img src={proposal.image_url || cafeImage} alt={proposal.location_name} className="h-full w-full object-cover" />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute left-[20px] top-[22px] flex h-[50px] w-[74px] items-center justify-center rounded-[25px] bg-white"
              aria-label="Open location in Google Maps"
            >
              <img src={googleMapsIcon} alt="" className="h-7 w-7" />
            </a>
          </div>

          <div className="mt-[32px] flex items-center gap-5">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[54px] w-[245px] items-center gap-3 rounded-[27px] bg-[#eeeeee] px-4 py-2 font-['Outfit',sans-serif] text-[14px] font-bold leading-[1.25] text-[#747474]"
            >
              <MapPin size={19} className="shrink-0 text-[#303030]" />
              <span className="min-w-0 break-words">{proposal.address}</span>
            </a>
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-[54px] w-[76px] items-center justify-center rounded-[27px] bg-[#eeeeee]"
                aria-label="Open venue website"
              >
                <Globe2 size={25} className="text-[#303030]" />
              </a>
            ) : null}
          </div>

          <p className="mt-[50px] text-center font-['Outfit',sans-serif] text-[14px] font-bold text-[#c0c4d8]">
            {feedback || 'We’ll notify you once everyone has set their availability.'}
          </p>
        </aside>
      </section>
    </FlowPageShell>
  )
}
