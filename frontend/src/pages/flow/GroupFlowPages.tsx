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
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  MapPin,
  Phone,
  UsersRound,
} from 'lucide-react'
import matchaiLogo from '../../components/ui/matchai_logo.svg'
import googleCalendarIcon from '../../assets/icons/google-calendar-icon.svg'
import googleMapsIcon from '../../assets/icons/google-maps-icon.svg'
import { HannahPill, JulianPill } from '../../assets/icons/nametags/NamePill'
import hannahAvatar from '../../components/ui/hannah_profile_icon.png'
import julianAvatar from '../../components/ui/julian_profile_icon.png'
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

function FlowPageShell({ children, showHome = false }: { children: ReactNode; showHome?: boolean }) {
  const navigate = useNavigate()
  const { clearSession } = useAuthSession()

  const handleLogout = async () => {
    await signOutFrontend()
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-[1728px] overflow-hidden bg-[#f7f7f7] px-[88px] py-[84px]">
      <div className="pointer-events-none absolute -left-[1060px] top-[438px] h-[728px] w-[1385px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.16)_0%,_rgba(180,115,255,0)_68%)]" />
      <div className="pointer-events-none absolute right-[-920px] top-[308px] h-[997px] w-[1265px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.12)_0%,_rgba(180,115,255,0)_70%)]" />
      <header className="relative z-10 flex items-start justify-between">
        <Link to="/" aria-label="MatchAI home">
          <img src={matchaiLogo} alt="" aria-hidden width={69} height={69} className="h-[69px] w-[69px]" />
        </Link>
        <div className="flex items-center gap-3">
          {showHome && (
            <Link
              to="/"
              className="flex h-[70px] w-[182px] items-center justify-center rounded-[23px] bg-white shadow-[0_0_32px_rgba(0,0,0,0.08)]"
            >
              <span className="flex h-[43px] w-[156px] items-center justify-center rounded-[23px] bg-[#7ca8ff] font-['Outfit',sans-serif] text-[20px] font-bold text-white">
                Home
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-[70px] w-[70px] items-center justify-center rounded-[23px] bg-white text-[#303030] shadow-[0_0_32px_rgba(0,0,0,0.08)] transition hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={25} strokeWidth={2.4} />
          </button>
        </div>
      </header>
      {children}
    </main>
  )
}

function IconButtonCircle() {
  return (
    <span className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[rgba(120,54,199,0.34)]">
      <ArrowUpRight size={22} strokeWidth={2.4} />
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
      className={`h-[39px] rounded-full px-5 font-['Outfit',sans-serif] text-[15px] font-bold transition ${
        active ? 'bg-[#e8d1ff] text-[#8650c1]' : 'bg-[#e5e5e5] text-[#666]'
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
    <FlowPageShell showHome>
      <section className="relative mx-auto mt-[32px] max-w-[1000px] text-center">
        <div className="pointer-events-none opacity-45 blur-[1px]">
          <AvatarStack />
        </div>

        <div className="mx-auto mt-[30px] flex max-w-[760px] flex-col items-center gap-[10px]">
          <SkeletonBlock className="h-[54px] w-[610px] max-w-full rounded-[16px]" />
          <SkeletonBlock className="h-[34px] w-[280px] max-w-[70%] rounded-[16px]" />
        </div>

        <div className="mx-auto mt-[34px] flex max-w-[820px] flex-col items-center gap-[9px]">
          <SkeletonBlock className="h-[21px] w-[760px] max-w-full rounded-[9px]" />
          <SkeletonBlock className="h-[21px] w-[570px] max-w-[82%] rounded-[9px]" />
        </div>

        <div className="mx-auto mt-[42px] flex h-[59px] w-[290px] animate-pulse items-center justify-between rounded-[29px] bg-[#d9c7ef] pl-10 pr-[9px] blur-[0.4px]">
          <span className="h-[18px] w-[150px] rounded-full bg-[#c6acd9]" />
          <span className="h-[41px] w-[41px] rounded-full bg-[rgba(120,54,199,0.22)]" />
        </div>
        <SkeletonBlock className="mx-auto mt-4 h-[14px] w-[170px] rounded-[7px]" />

        <section className="mt-[64px]">
          <SkeletonBlock className="mx-auto h-[24px] w-[260px] rounded-[8px]" />
          <div className="mt-[34px] flex justify-center gap-[25px]">
            <SkeletonBlock className="h-[49px] w-[232px] rounded-[9px]" />
            <SkeletonBlock className="h-[49px] w-[232px] rounded-[9px]" />
            <SkeletonBlock className="h-[49px] w-[232px] rounded-[9px]" />
          </div>
        </section>
      </section>
    </FlowPageShell>
  )
}

function MatchSkeleton() {
  return (
    <FlowPageShell showHome>
      <section className="mx-auto mt-[64px] grid max-w-[1200px] grid-cols-[560px_420px] gap-[170px]">
        <div className="pt-[45px]">
          <SkeletonBlock className="h-[32px] w-[170px] rounded-[10px]" />
          <div className="mt-7 space-y-4">
            <SkeletonBlock className="h-[72px] w-[470px] rounded-[18px]" />
            <SkeletonBlock className="h-[58px] w-[330px] rounded-[18px]" />
          </div>
          <div className="mt-[50px] space-y-3">
            <SkeletonBlock className="h-[26px] w-[560px] rounded-[9px]" />
            <SkeletonBlock className="h-[26px] w-[500px] rounded-[9px]" />
            <SkeletonBlock className="h-[26px] w-[390px] rounded-[9px]" />
          </div>

          <div className="mt-[72px] w-[500px] overflow-hidden rounded-[14px] border border-[#e3e3e3] bg-white/65 blur-[0.3px]">
            {['w-[160px]', 'w-[120px]', 'w-[145px]'].map((width, index) => (
              <div key={width} className={`grid h-[57px] grid-cols-[1fr_1fr] items-center px-8 ${index < 2 ? 'border-b border-[#e9e9e9]' : ''}`}>
                <SkeletonBlock className="h-[18px] w-[110px] rounded-[8px]" />
                <SkeletonBlock className={`ml-auto h-[18px] ${width} rounded-[8px]`} />
              </div>
            ))}
          </div>

          <div className="mt-[117px] flex items-center gap-6">
            <div className="flex h-[76px] w-[272px] animate-pulse items-center justify-between rounded-[38px] bg-[#d9c7ef] pl-10 pr-[12px] blur-[0.4px]">
              <span className="h-[24px] w-[145px] rounded-full bg-[#c6acd9]" />
              <span className="h-[52px] w-[52px] rounded-full bg-[rgba(120,54,199,0.22)]" />
            </div>
            <div className="flex items-center blur-[0.5px]">
              <span className="z-30 h-[76px] w-[76px] rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]" />
              <span className="z-20 -ml-4 h-[76px] w-[76px] rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]" />
              <span className="-ml-4 h-[76px] w-[76px] rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]" />
            </div>
          </div>
        </div>

        <aside className="pt-[115px]">
          <div className="relative h-[366px] w-[367px] animate-pulse overflow-hidden rounded-[13px] bg-[#dedede] blur-[0.6px]">
            <span className="absolute left-[24px] top-[30px] h-[61px] w-[91px] rounded-[31px] bg-white/80" />
            <span className="absolute right-[26px] top-[30px] h-[61px] w-[157px] rounded-[31px] bg-white/80" />
          </div>

          <div className="mt-[60px] flex items-center gap-7">
            <SkeletonBlock className="h-[60px] w-[284px] rounded-[30px]" />
            <SkeletonBlock className="h-[60px] w-[90px] rounded-[30px]" />
          </div>

          <SkeletonBlock className="mx-auto mt-[107px] h-[18px] w-[310px] rounded-[8px]" />
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
      setFeedback('Google Calendar connected.')
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

  return (
    <FlowPageShell>
      <section className="relative mx-auto mt-[35px] h-[741px] w-[1046px] rounded-[32px] border-[2px] border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.65)] px-[80px] py-[86px] shadow-[0_0_40px_rgba(0,0,0,0.07)] [box-shadow:inset_0_0_16px_rgba(255,255,255,0.8),0_0_40px_rgba(0,0,0,0.07)]">
        <img src={matchaiLogo} alt="" aria-hidden className="absolute right-[88px] top-[68px] h-[65px] w-[65px]" />
        <div className="absolute left-[430px] top-[77px]">
          <div className="relative h-[100px] w-[190px]">
            <img
              src={julianAvatar}
              alt=""
              className="absolute left-[70px] top-[-4px] h-[104px] w-[104px] rotate-[8deg] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
            />
            <JulianPill className="-left-[10px] top-[56px] scale-[0.82] origin-top-left" />
          </div>
        </div>

        <h1 className="font-['Outfit',sans-serif] text-[45px] font-bold tracking-[-0.99px] text-[#232323]">Set your vibe</h1>

        <div className="mt-[44px] grid grid-cols-[286px_378px] gap-[157px]">
          <div>
            <p className="mb-5 font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Link Google Calendar</p>
            <button
              type="button"
              onClick={connectCalendar}
              disabled={!backendReady || isLoading || calendarConnected || isConnectingCalendar}
              className={`flex h-[61px] w-[286px] items-center gap-4 rounded-[13px] px-6 font-['Outfit',sans-serif] text-[17px] font-bold text-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-50 ${calendarConnected ? 'bg-[#e8d1ff]' : 'bg-[#ededed]'}`}
            >
              <img src={googleCalendarIcon} alt="" className="h-[40px] w-[40px] shrink-0" />
              <span className="whitespace-nowrap">{calendarConnected ? 'Connected' : isConnectingCalendar ? 'Opening...' : 'Google Calendar'}</span>
            </button>
            {calendarConnected && (
              <div className="mt-3 flex w-[286px] items-center justify-between gap-3">
                <p className="min-w-0 truncate font-['Outfit',sans-serif] text-[13px] font-bold text-[#7f7f7f]">
                  {calendarEmail || 'Calendar connected'}
                </p>
                <button
                  type="button"
                  onClick={disconnectCalendar}
                  disabled={isDisconnectingCalendar}
                  className="shrink-0 font-['Outfit',sans-serif] text-[13px] font-bold text-[#8650c1] disabled:opacity-50"
                >
                  {isDisconnectingCalendar ? '...' : 'Disconnect'}
                </button>
              </div>
            )}
          </div>
          <label className="block">
            <span className="font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Home City / Location</span>
            <span className="mt-5 flex h-[61px] w-full items-center rounded-[13px] border border-[rgba(0,0,0,0.1)] bg-white px-6">
              <MapPin size={25} className="text-[#3d3d3d]" />
              <span aria-hidden className="mx-6 h-[37px] w-px bg-[#dddddd]" />
              <input
                value={homeCity}
                onChange={(event) => setHomeCity(event.target.value)}
                className="w-full bg-transparent font-['Outfit',sans-serif] text-[22px] font-medium text-[#3e3e3e] outline-none"
              />
            </span>
          </label>
        </div>

        <div className="mx-2 mt-[58px] h-[3px] bg-[#eeeeee]" />

        <div className="mt-[41px] px-2">
          <div>
            <p className="mb-[22px] font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Activities you like 👍</p>
            <div className="flex w-full flex-wrap gap-x-[10px] gap-y-[10px]">
              {chips.map((chip) => (
                <Chip key={chip} label={chip} active={liked.includes(chip)} onClick={() => toggle(liked, setLiked, chip)} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[57px] flex justify-end px-2">
          <div className="flex flex-col items-end">
            <div className="relative mb-4 mr-[218px] h-[53px] w-[140px]" aria-hidden>
              <HannahPill className="left-0 top-0" />
            </div>
            <button
              type="button"
              disabled={isSaving || !backendReady || isLoading}
              onClick={savePreferences}
              className="flex h-[59px] w-[237px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-9 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white disabled:opacity-60"
            >
              {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Create a group'}
              <IconButtonCircle />
            </button>
            {feedback && <p className="mt-3 max-w-[280px] text-right font-['Outfit',sans-serif] text-[13px] font-bold text-[#979797]">{feedback}</p>}
          </div>
        </div>
      </section>

      <div className="mt-[56px] flex items-center justify-center gap-[8px]" aria-hidden>
        <span className="h-[7px] w-[46px] rounded-l-[77px] bg-[var(--color-primary)]" />
        <span className="h-[7px] w-[46px] bg-[var(--color-primary)]" />
        <span className="h-[7px] w-[46px] rounded-r-[77px] bg-[#e3e3e3]" />
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
    <FlowPageShell showHome>
      <section className="relative mx-auto mt-[35px] h-[741px] w-[1046px] rounded-[32px] border-[2px] border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.65)] px-[80px] py-[86px] shadow-[0_0_40px_rgba(0,0,0,0.07)] [box-shadow:inset_0_0_16px_rgba(255,255,255,0.8),0_0_40px_rgba(0,0,0,0.07)]">
        <img src={matchaiLogo} alt="" aria-hidden className="absolute right-[88px] top-[68px] h-[65px] w-[65px]" />
        <div className="absolute right-[170px] top-[70px]">
          <AvatarStack />
        </div>

        <div className="max-w-[878px]">
          <h1 className="font-['Outfit',sans-serif] text-[45px] font-bold tracking-[-0.99px] text-[#232323]">Create a group</h1>

          <label className="mt-[54px] block w-[378px]">
            <span className="font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Give your group a name</span>
            <span className="mt-5 flex h-[61px] w-full items-center rounded-[13px] border border-[rgba(0,0,0,0.1)] bg-white px-6">
              <UsersRound size={25} className="text-[#3d3d3d]" />
              <span aria-hidden className="mx-6 h-[37px] w-px bg-[#dddddd]" />
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="New group"
                disabled={Boolean(createdGroup)}
                className="w-full bg-transparent font-['Outfit',sans-serif] text-[22px] font-medium text-[#3e3e3e] outline-none disabled:text-[#7b7b7b]"
              />
            </span>
          </label>

          <div className="mx-2 mt-[47px] h-[3px] bg-[#eeeeee]" />

          <h2 className="mt-[41px] font-['Outfit',sans-serif] text-[24px] font-bold tracking-[-0.03em] text-[#303030]">Invite your friends</h2>
          <div className="mt-[34px] grid grid-cols-[300px_1fr] gap-[80px]">
            <div>
              <p className="mb-[20px] font-['Outfit',sans-serif] text-[16px] font-bold text-[#979797]">Via Link</p>
              <button
                type="button"
                disabled={isCreating}
                onClick={copyInviteLink}
                className="flex h-[59px] w-[186px] items-center justify-center gap-3 rounded-[16px] bg-[#eef3ff] font-['Outfit',sans-serif] text-[18px] font-bold text-[#7ca8ff] disabled:opacity-60"
              >
                <Link2 size={23} />
                {isCreating ? 'Creating...' : 'Copy Link'}
              </button>
              <p className="mt-[32px] max-w-[290px] break-words font-['Outfit',sans-serif] text-[14px] font-bold text-[#c0c4d8]">
                {copyStatus || inviteLink || 'Send this link to your friends to plan together.'}
              </p>
            </div>

            <div>
              <p className="mb-[20px] font-['Outfit',sans-serif] text-[16px] font-bold text-[#979797]">Via Email</p>
              <div className="flex items-center gap-[14px]">
                <span className="flex h-[61px] w-[370px] items-center rounded-[13px] border border-[rgba(180,115,255,0.25)] bg-white px-5 opacity-70">
                  <AtSign size={22} className="text-[#3d3d3d]" />
                  <span aria-hidden className="mx-6 h-[37px] w-px bg-[#dddddd]" />
                  <span className="font-['Outfit',sans-serif] text-[17px] font-bold text-[#3e3e3e]">mustermann@gmail.com</span>
                  <CheckCircle2 size={19} className="ml-auto text-[#244c99]" />
                </span>
                <button
                  type="button"
                  disabled
                  className="h-[61px] w-[111px] rounded-[18px] bg-[var(--color-primary)] font-['Outfit',sans-serif] text-[18px] font-bold text-white opacity-60"
                >
                  Add
                </button>
              </div>
              <span className="mt-[12px] inline-flex h-[38px] items-center rounded-[9px] bg-[#f3e8ff] px-4 font-['Outfit',sans-serif] text-[13px] font-bold text-[#9f56f3] opacity-70">
                johannes@gmail.com
              </span>
            </div>
          </div>

          <div className="mt-[48px] flex justify-end">
            <button
              type="button"
              disabled={isCreating}
              onClick={finishGroup}
              className="flex h-[59px] w-[160px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-8 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white disabled:opacity-60"
            >
              {isCreating ? 'Creating...' : 'Finish'}
              <IconButtonCircle />
            </button>
          </div>

          {error && <p className="mt-4 text-right font-['Outfit',sans-serif] text-[14px] font-bold text-[#979797]">{error}</p>}
        </div>
      </section>

      <div className="mt-[56px] flex items-center justify-center gap-[8px]" aria-hidden>
        <span className="h-[7px] w-[46px] rounded-l-[77px] bg-[var(--color-primary)]" />
        <span className="h-[7px] w-[46px] bg-[var(--color-primary)]" />
        <span className="h-[7px] w-[46px] rounded-r-[77px] bg-[var(--color-primary)]" />
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

  if (isLoadingGroup) {
    return <WaitingGroupSkeleton />
  }

  if (!groupDetail) {
    return (
      <FlowPageShell showHome>
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
    <FlowPageShell showHome>
      <section className="relative mx-auto mt-[32px] max-w-[1000px] text-center">
        <AvatarStack />
        <h1 className="mt-[30px] font-['Outfit',sans-serif] text-[56px] font-bold leading-[1.05] tracking-[-0.04em] text-[#303030]">
          {matchingStarted ? 'Finding your group match.' : `${groupDetail.name} is all set.`}
        </h1>
        <p className="mx-auto mt-[34px] max-w-[820px] font-['Geist',sans-serif] text-[21px] font-medium leading-[1.22] tracking-[-0.03em] text-[#979797]">
          {matchingStarted
            ? 'We check your calendars, look at your locations, and suggest meetups that match your preferences.'
            : isOwner
              ? 'We check your calendars, look at your locations, and suggest meetups that match your preferences. You’ll get a WhatsApp from us, just sit back.'
              : 'You joined the group. The creator can start matching when everyone is ready.'}
        </p>
        {matchingStarted ? (
          <div className="mx-auto mt-[42px] flex h-[59px] w-[290px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-10 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white">
            Matching {progress}%
            <span className="inline-flex h-[41px] w-[41px] items-center justify-center rounded-full bg-[rgba(120,54,199,0.34)]">
              <LoaderCircle className="animate-spin" size={22} />
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!isOwner}
            onClick={startMatching}
            className="mx-auto mt-[42px] flex h-[59px] w-[290px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-10 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Find a meeting ASAP
            <IconButtonCircle />
          </button>
        )}
        <p className="mt-4 font-['Outfit',sans-serif] text-[14px] font-bold text-[#979797]">{statusText}</p>

        <section className="mt-[64px]">
          <h2 className="font-['Outfit',sans-serif] text-[21px] font-bold text-[#303030]">Members of {groupDetail.name}</h2>
          <div className="mt-[34px] flex justify-center gap-[25px]">
            {groupDetail.participants.map((participant) => (
              <span
                key={participant.user.id}
                className={`flex h-[49px] w-[232px] items-center justify-between rounded-[9px] px-6 font-['Outfit',sans-serif] text-[18px] font-bold ${
                  participant.role === 'owner' ? 'bg-[var(--color-primary)] text-white' : 'bg-[#f1f1f1] text-[#666]'
                }`}
              >
                <span className="truncate">{participant.user.email}</span>
                {participant.role === 'owner' ? <CheckCircle2 size={18} /> : <Clock3 size={19} className="text-[#111]" />}
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
      <FlowPageShell showHome>
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
  const timeLabel = Number.isNaN(startsAt.getTime())
    ? '17:00 - 19:30 Uhr'
    : `${startsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${endsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`

  return (
    <FlowPageShell showHome>
      <section className="mx-auto mt-[64px] grid max-w-[1200px] grid-cols-[560px_420px] gap-[170px]">
        <div className="pt-[45px]">
          <p className="font-['Outfit',sans-serif] text-[27px] font-bold tracking-[-0.04em] text-[#b5b5b5]">What about</p>
          <h1 className="mt-7 font-['Outfit',sans-serif] text-[70px] font-bold leading-[1] tracking-[-0.05em] text-[#303030]">
            {proposal.location_name}
          </h1>
          <p className="mt-[50px] max-w-[600px] font-['Geist',sans-serif] text-[21px] font-medium leading-[1.25] tracking-[-0.03em] text-[#979797]">
            {proposal.summary}
          </p>

          <div className="mt-[72px] w-[500px] overflow-hidden rounded-[14px] border border-[#e3e3e3] bg-white font-['Outfit',sans-serif] text-[18px] font-bold text-[#303030]">
            <div className="grid h-[57px] grid-cols-[1fr_1fr] items-center border-b border-[#e9e9e9] px-8">
              <span>Zeitraum</span>
              <span className="text-right text-[#858585]">{timeLabel}</span>
            </div>
            <div className="grid h-[57px] grid-cols-[1fr_1fr] items-center border-b border-[#e9e9e9] px-8">
              <span>Preis</span>
              <span className="flex justify-end gap-2 text-[var(--color-primary)]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <CircleDollarSign key={index} size={20} className={index > 2 ? 'opacity-20' : ''} />
                ))}
              </span>
            </div>
            <div className="grid h-[57px] grid-cols-[1fr_1fr] items-center px-8">
              <span>Vibe</span>
              <span className="text-right text-[#858585]">{proposal.rationale || 'hektisch, lebendig'}</span>
            </div>
          </div>

          <div className="mt-[117px] flex items-center gap-6">
            <button
              type="button"
              onClick={countMeIn}
              className="flex h-[76px] w-[272px] items-center justify-between rounded-[38px] bg-[var(--color-primary)] pl-10 pr-[12px] font-['Outfit',sans-serif] text-[24px] font-bold text-white"
            >
              {confirmed ? 'Counted in' : 'Count me in'}
              <IconButtonCircle />
            </button>
            <div className="flex items-center">
              <span className="z-30 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <img src={hannahAvatar} alt="" className="h-12 w-12 object-contain" />
              </span>
              <span className="z-20 -ml-4 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <img src={julianAvatar} alt="" className="h-12 w-12 object-contain" />
              </span>
              <span className="-ml-4 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white font-['Outfit',sans-serif] text-[25px] font-bold text-[#858585] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                +2
              </span>
            </div>
          </div>
        </div>

        <aside className="pt-[115px]">
          <div className="relative h-[366px] w-[367px] overflow-hidden rounded-[13px]">
            <img src={proposal.image_url || cafeImage} alt={proposal.location_name} className="h-full w-full object-cover" />
            <div className="absolute left-[24px] top-[30px] flex h-[61px] w-[91px] items-center justify-center rounded-[31px] bg-white">
              <img src={googleMapsIcon} alt="" className="h-8 w-8" />
            </div>
            <div className="absolute right-[26px] top-[30px] flex h-[61px] w-[157px] items-center justify-center gap-3 rounded-[31px] bg-white font-['Outfit',sans-serif] text-[18px] font-bold text-[#303030]">
              <ImageIcon size={23} className="text-[#858585]" />
              Images
            </div>
          </div>

          <div className="mt-[60px] flex items-center gap-7">
            <span className="flex h-[60px] w-[284px] items-center justify-center gap-6 rounded-[30px] bg-[#eeeeee] font-['Outfit',sans-serif] text-[19px] font-bold text-[#747474]">
              <Phone size={22} className="text-[#303030]" />
              {proposal.address}
            </span>
            <a href={proposal.source_url || '#'} className="flex h-[60px] w-[90px] items-center justify-center rounded-[30px] bg-[#eeeeee]" aria-label="Open source">
              <Globe2 size={29} className="text-[#303030]" />
            </a>
          </div>

          <p className="mt-[107px] text-center font-['Outfit',sans-serif] text-[17px] font-bold text-[#c0c4d8]">
            {feedback || 'We’ll notify you once everyone has set their availability.'}
          </p>
        </aside>
      </section>
    </FlowPageShell>
  )
}
