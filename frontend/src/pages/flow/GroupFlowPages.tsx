import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Globe2,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Phone,
} from 'lucide-react'
import matchaiLogo from '../../components/ui/matchai_logo.svg'
import googleCalendarIcon from '../../assets/icons/google-calendar-icon.svg'
import googleMapsIcon from '../../assets/icons/google-maps-icon.svg'
import hannahAvatar from '../../components/ui/hannah_profile_icon.png'
import julianAvatar from '../../components/ui/julian_profile_icon.png'

const groupId = 'aral-chiller'
const chips = ['Café', 'Bar', 'Restaurant', 'Brunch', 'Walk', 'Park', 'Club', 'Bowling']
const cafeImage =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=780&q=80'

function FlowPageShell({ children, showHome = false }: { children: React.ReactNode; showHome?: boolean }) {
  return (
    <main className="relative mx-auto min-h-screen max-w-[1728px] overflow-hidden bg-[#f7f7f7] px-[88px] py-[84px]">
      <div className="pointer-events-none absolute -left-[1060px] top-[438px] h-[728px] w-[1385px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.16)_0%,_rgba(180,115,255,0)_68%)]" />
      <div className="pointer-events-none absolute right-[-920px] top-[308px] h-[997px] w-[1265px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.12)_0%,_rgba(180,115,255,0)_70%)]" />
      <header className="relative z-10 flex items-start justify-between">
        <Link to="/" aria-label="MatchAI home">
          <img src={matchaiLogo} alt="" aria-hidden width={69} height={69} className="h-[69px] w-[69px]" />
        </Link>
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
      <div className="absolute left-[88px] top-[25px] h-[92px] w-[92px] rotate-[-8deg] overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
        <img src={hannahAvatar} alt="" className="h-full w-full object-contain" />
      </div>
      <span className="absolute left-[158px] top-[18px] rounded-full bg-[#b473df] px-6 py-2 font-['Outfit',sans-serif] text-[16px] font-medium text-white">
        Hannah
      </span>
      <div className="absolute left-[250px] top-[40px] h-[125px] w-[104px] rounded-[16px] bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,0.09)]">
        <span className="block h-4 w-12 rounded-full bg-[#e7e7e7]" />
        <span className="mt-4 block h-4 w-16 rounded-full bg-[#d8d8d8]" />
        <span className="mt-4 block h-4 w-7 rounded-full bg-[#d2d2d2]" />
      </div>
      <div className="absolute right-[6px] top-[73px] h-[90px] w-[90px] rotate-[10deg] overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
        <img src={julianAvatar} alt="" className="h-full w-full object-contain" />
      </div>
      <span className="absolute right-[80px] top-[146px] rounded-full bg-[#7ca8ff] px-7 py-2 font-['Outfit',sans-serif] text-[16px] font-medium text-white">
        Julian
      </span>
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

function LocationInput({ className = '' }: { className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Home City / Location</span>
      <span className="mt-5 flex h-[61px] w-full items-center rounded-[13px] border border-[rgba(0,0,0,0.1)] bg-white px-6">
        <MapPin size={25} className="text-[#3d3d3d]" />
        <span aria-hidden className="mx-6 h-[37px] w-px bg-[#dddddd]" />
        <input
          defaultValue="Munich"
          className="w-full bg-transparent font-['Outfit',sans-serif] text-[22px] font-medium text-[#3e3e3e] outline-none"
        />
      </span>
    </label>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(['Café', 'Bar'])
  const [disliked, setDisliked] = useState(['Café', 'Bar'])

  const toggle = (list: string[], setter: (items: string[]) => void, chip: string) => {
    setter(list.includes(chip) ? list.filter((item) => item !== chip) : [...list, chip])
  }

  return (
    <FlowPageShell>
      <section className="relative mx-auto mt-[35px] h-[741px] w-[1046px] rounded-[32px] border-[2px] border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.65)] px-[80px] py-[86px] shadow-[0_0_40px_rgba(0,0,0,0.07)] [box-shadow:inset_0_0_16px_rgba(255,255,255,0.8),0_0_40px_rgba(0,0,0,0.07)]">
        <img src={matchaiLogo} alt="" aria-hidden className="absolute right-[88px] top-[68px] h-[65px] w-[65px]" />
        <div className="absolute left-[430px] top-[77px]">
          <div className="relative h-[100px] w-[190px]">
            <div className="absolute left-[74px] top-0 h-[86px] w-[86px] rotate-[8deg] overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
              <img src={julianAvatar} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="absolute left-0 top-[62px] rounded-full bg-[#7ca8ff] px-7 py-2 font-['Outfit',sans-serif] text-[15px] font-medium text-white">
              Julian
            </span>
          </div>
        </div>

        <h1 className="font-['Outfit',sans-serif] text-[45px] font-bold tracking-[-0.99px] text-[#232323]">Set your vibe</h1>

        <div className="mt-[44px] grid grid-cols-[247px_378px] gap-[196px]">
          <div>
            <p className="mb-5 font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Link Google Calendar</p>
            <button className="flex h-[61px] w-[247px] items-center gap-6 rounded-[13px] bg-[#ededed] px-8 font-['Outfit',sans-serif] text-[17px] font-bold text-[#2f2f2f]">
              <img src={googleCalendarIcon} alt="" className="h-[28px] w-[28px]" />
              Google Calendar
            </button>
          </div>
          <LocationInput />
        </div>

        <div className="mx-2 mt-[58px] h-[3px] bg-[#eeeeee]" />

        <div className="mt-[41px] grid grid-cols-2 gap-[72px] px-2">
          <div>
            <p className="mb-[22px] font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Activities you like 👍</p>
            <div className="flex max-w-[380px] flex-wrap gap-x-[10px] gap-y-[10px]">
              {chips.map((chip) => (
                <Chip key={chip} label={chip} active={liked.includes(chip)} onClick={() => toggle(liked, setLiked, chip)} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-[22px] font-['Outfit',sans-serif] text-[16px] font-bold text-[#2f2f2f]">Activities you don’t like 👎</p>
            <div className="flex max-w-[380px] flex-wrap gap-x-[10px] gap-y-[10px]">
              {chips.map((chip) => (
                <Chip key={chip} label={chip} active={disliked.includes(chip)} onClick={() => toggle(disliked, setDisliked, chip)} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[57px] grid grid-cols-[378px_1fr] items-end gap-[180px] px-2">
          <LocationInput />
          <div className="flex flex-col items-end">
            <span className="mb-4 mr-[218px] rounded-full bg-[#b473df] px-6 py-2 font-['Outfit',sans-serif] text-[15px] font-medium text-white">Hannah</span>
            <button
              type="button"
              onClick={() => navigate('/groups/new')}
              className="flex h-[59px] w-[237px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-9 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white"
            >
              Create a group
              <IconButtonCircle />
            </button>
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

  return (
    <FlowPageShell showHome>
      <section className="relative mx-auto mt-[40px] max-w-[1000px] text-center">
        <AvatarStack />
        <h1 className="mt-[46px] font-['Outfit',sans-serif] text-[74px] font-bold leading-[1.05] tracking-[-0.04em] text-[#303030]">
          Aral-Chiller is all set.
        </h1>
        <p className="mx-auto mt-[56px] max-w-[970px] font-['Geist',sans-serif] text-[27px] font-medium leading-[1.25] tracking-[-0.03em] text-[#979797]">
          We check your calendars, look at your locations, and suggest meetups that match your preferences. You’ll get a WhatsApp from us, just sit back.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/groups/${groupId}/waiting`)}
          className="mx-auto mt-[68px] flex h-[59px] w-[290px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-10 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white"
        >
          Find a meeting ASAP
          <IconButtonCircle />
        </button>

        <section className="mt-[118px]">
          <h2 className="font-['Outfit',sans-serif] text-[21px] font-bold text-[#303030]">Members of Aral-Chiller</h2>
          <div className="mt-[34px] flex justify-center gap-[25px]">
            <span className="flex h-[49px] w-[232px] items-center justify-between rounded-[9px] bg-[var(--color-primary)] px-6 font-['Outfit',sans-serif] text-[18px] font-bold text-white">
              johannes@gmail.com
              <CheckCircle2 size={18} />
            </span>
            {[1, 2].map((item) => (
              <span key={item} className="flex h-[49px] w-[232px] items-center justify-between rounded-[9px] bg-[#f1f1f1] px-6 font-['Outfit',sans-serif] text-[18px] font-bold text-[#666]">
                johannes@gmail.com
                <Clock3 size={19} className="text-[#111]" />
              </span>
            ))}
          </div>
        </section>
      </section>
    </FlowPageShell>
  )
}

export function WaitingForGroupMatchPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(interval)
          window.setTimeout(() => navigate(`/groups/${groupId}/match`), 500)
          return 100
        }

        return current + 10
      })
    }, 320)

    return () => window.clearInterval(interval)
  }, [navigate])

  return (
    <FlowPageShell showHome>
      <section className="relative mx-auto mt-[80px] max-w-[1000px] text-center">
        <AvatarStack />
        <h1 className="mt-[46px] font-['Outfit',sans-serif] text-[74px] font-bold leading-[1.05] tracking-[-0.04em] text-[#303030]">
          Finding your group match.
        </h1>
        <p className="mx-auto mt-[56px] max-w-[970px] font-['Geist',sans-serif] text-[27px] font-medium leading-[1.25] tracking-[-0.03em] text-[#979797]">
          We check your calendars, look at your locations, and suggest meetups that match your preferences. You’ll get a WhatsApp from us, just sit back.
        </p>
        <div className="mx-auto mt-[68px] flex h-[59px] w-[290px] items-center justify-between rounded-[29px] bg-[var(--color-primary)] pl-10 pr-[9px] font-['Outfit',sans-serif] text-[18px] font-bold text-white">
          Matching {progress}%
          <span className="inline-flex h-[41px] w-[41px] items-center justify-center rounded-full bg-[rgba(120,54,199,0.34)]">
            <LoaderCircle className="animate-spin" size={22} />
          </span>
        </div>

        <section className="mt-[118px]">
          <h2 className="font-['Outfit',sans-serif] text-[21px] font-bold text-[#303030]">Members of Aral-Chiller</h2>
          <div className="mt-[34px] flex justify-center gap-[25px]">
            <span className="flex h-[49px] w-[232px] items-center justify-between rounded-[9px] bg-[var(--color-primary)] px-6 font-['Outfit',sans-serif] text-[18px] font-bold text-white">
              johannes@gmail.com
              <CheckCircle2 size={18} />
            </span>
            {[1, 2].map((item) => (
              <span key={item} className="flex h-[49px] w-[232px] items-center justify-between rounded-[9px] bg-[#f1f1f1] px-6 font-['Outfit',sans-serif] text-[18px] font-bold text-[#666]">
                johannes@gmail.com
                <Clock3 size={19} className="text-[#111]" />
              </span>
            ))}
          </div>
        </section>
      </section>
    </FlowPageShell>
  )
}

export function GroupMatchPage() {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <FlowPageShell showHome>
      <section className="mx-auto mt-[64px] grid max-w-[1200px] grid-cols-[560px_420px] gap-[170px]">
        <div className="pt-[45px]">
          <p className="font-['Outfit',sans-serif] text-[27px] font-bold tracking-[-0.04em] text-[#b5b5b5]">What about</p>
          <h1 className="mt-7 font-['Outfit',sans-serif] text-[70px] font-bold leading-[1] tracking-[-0.05em] text-[#303030]">
            Location einfügen
          </h1>
          <p className="mt-[50px] max-w-[600px] font-['Geist',sans-serif] text-[21px] font-medium leading-[1.25] tracking-[-0.03em] text-[#979797]">
            We check your calendars, look at your locations, and suggest meetups that match your preferences. You’ll get a WhatsApp from us, just sit back.
          </p>

          <div className="mt-[72px] w-[500px] overflow-hidden rounded-[14px] border border-[#e3e3e3] bg-white font-['Outfit',sans-serif] text-[18px] font-bold text-[#303030]">
            <div className="grid h-[57px] grid-cols-[1fr_1fr] items-center border-b border-[#e9e9e9] px-8">
              <span>Zeitraum</span>
              <span className="text-right text-[#858585]">17:00 - 19:30 Uhr</span>
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
              <span className="text-right text-[#858585]">hektisch, lebendig</span>
            </div>
          </div>

          <div className="mt-[117px] flex items-center gap-6">
            <button
              type="button"
              onClick={() => setConfirmed(true)}
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
            <img src={cafeImage} alt="Cafe interior" className="h-full w-full object-cover" />
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
              +49 1234 567891
            </span>
            <span className="flex h-[60px] w-[90px] items-center justify-center rounded-[30px] bg-[#eeeeee]">
              <Globe2 size={29} className="text-[#303030]" />
            </span>
          </div>

          <p className="mt-[107px] text-center font-['Outfit',sans-serif] text-[17px] font-bold text-[#c0c4d8]">
            We’ll notify you once everyone has set their availability.
          </p>
        </aside>
      </section>
    </FlowPageShell>
  )
}
