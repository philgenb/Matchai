import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  AtSign,
  CheckCircle2,
  CircleX,
  Eye,
  Lock,
  UserRound,
} from 'lucide-react'
import matchaiLogo from '../../components/ui/matchai_logo.svg'
import appleIcon from '../../assets/icons/apple-icon.svg'
import facebookIcon from '../../assets/icons/facebook-icon.svg'
import googleIcon from '../../assets/icons/google-icon.svg'
import { api, setDevEmail } from '../../lib/api'
import {
  firebaseConfigured,
  persistFirebaseToken,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../../lib/firebase'
import friendsPictureTwo from '/friends_picture_2.png'

type FormMode = 'signup' | 'signin'
type FieldName = 'name' | 'email' | 'password' | 'confirmPassword'

type FormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type TextFieldRowProps = {
  name: FieldName
  value: string
  type?: 'text' | 'email' | 'password'
  placeholder: string
  leftIcon: ReactNode
  rightIcon?: ReactNode
  highlighted?: boolean
  onChange: (name: FieldName, value: string) => void
  onFocus: (name: FieldName) => void
  onBlur: () => void
}

function BrandBadge({ className }: { className?: string }) {
  return (
    <img
      src={matchaiLogo}
      alt=""
      aria-hidden
      width={69}
      height={69}
      className={`h-[69px] w-[69px] ${className ?? ''}`}
    />
  )
}

function AuthModeToggle({
  mode,
  onChangeMode,
}: {
  mode: FormMode
  onChangeMode: (mode: FormMode) => void
}) {
  return (
    <div className="inline-flex h-[56px] w-[199px] items-center rounded-full bg-white p-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        className={`h-full w-1/2 rounded-full text-[16px] font-bold tracking-[-0.03em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
          mode === 'signup'
            ? 'bg-[#f2f2f2] text-[#2d2d2d]'
            : 'text-[#8b8b8b] hover:text-[#595959]'
        }`}
        onClick={() => onChangeMode('signup')}
      >
        Sign up
      </button>
      <button
        type="button"
        className={`h-full w-1/2 rounded-full text-[16px] font-bold tracking-[-0.03em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
          mode === 'signin'
            ? 'bg-[#f2f2f2] text-[#2d2d2d]'
            : 'text-[#8b8b8b] hover:text-[#595959]'
        }`}
        onClick={() => onChangeMode('signin')}
      >
        Sign in
      </button>
    </div>
  )
}

function TextFieldRow({
  name,
  value,
  type = 'text',
  placeholder,
  leftIcon,
  rightIcon,
  highlighted = false,
  onChange,
  onFocus,
  onBlur,
}: TextFieldRowProps) {
  return (
    <label
      className={`flex h-[61px] w-[378px] items-center rounded-[13px] border px-[22px] ${
        highlighted
          ? 'border-[rgba(170,118,225,0.25)] bg-[rgba(170,118,225,0.07)]'
          : 'border-[rgba(0,0,0,0.08)] bg-white'
      }`}
    >
      <span className="text-[var(--color-primary)]">{leftIcon}</span>
      <span aria-hidden className="mx-[16px] h-[38px] w-px bg-[rgba(0,0,0,0.12)]" />
      <input
        name={name}
        value={value}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(name, event.target.value)}
        onFocus={() => onFocus(name)}
        onBlur={onBlur}
        className="w-full bg-transparent font-['Outfit',sans-serif] text-[19px] font-medium text-[#3e3e3e] outline-none placeholder:text-[#a6a6a6]"
      />
      <span className="ml-auto text-[#b7b7b7]">{rightIcon}</span>
    </label>
  )
}

function SocialIconButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-[56px] w-[114px] items-center justify-center rounded-[14px] bg-white text-[#3f3f3f] shadow-[0_8px_18px_rgba(0,0,0,0.06)] transition hover:bg-[#f8f8f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
      onClick={onClick}
      aria-label={label}
    >
      <img src={icon} alt="" aria-hidden width={25} height={25} className="h-[25px] w-[25px]" />
    </button>
  )
}

function SignUpPage({ initialMode = 'signup' }: { initialMode?: FormMode }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<FormMode>(initialMode)
  const [activeField, setActiveField] = useState<FieldName | null>('name')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [authError, setAuthError] = useState('')

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    setMode(initialMode)
    setSubmitStatus('idle')
  }, [initialMode])

  const emailIsValid = useMemo(() => /\S+@\S+\.\S+/.test(form.email), [form.email])
  const passwordIsValid = useMemo(() => form.password.length >= 8, [form.password])
  const confirmPasswordMatches = useMemo(
    () => form.confirmPassword.length > 0 && form.confirmPassword === form.password,
    [form.confirmPassword, form.password],
  )

  const formIsValid =
    mode === 'signin'
      ? emailIsValid && form.password.length > 0
      : form.name.trim().length > 0 &&
        emailIsValid &&
        passwordIsValid &&
        confirmPasswordMatches

  const handleFieldChange = (name: FieldName, value: string) => {
    setSubmitStatus('idle')
    setAuthError('')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formIsValid) return
    setDevEmail(form.email)
    setSubmitStatus('submitting')

    const authenticate = async () => {
      if (firebaseConfigured) {
        let credentials
        if (mode === 'signup') {
          credentials = await signUpWithEmail({
            name: form.name,
            email: form.email,
            password: form.password,
          })
        } else {
          credentials = await signInWithEmail(form.email, form.password)
        }
        await persistFirebaseToken(credentials?.user)
      }
      await api.me()
      setSubmitStatus('success')
      navigate('/app')
    }

    authenticate().catch((error) => {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed.')
      setSubmitStatus('idle')
    })
  }

  const handleSocialAuth = async (provider: 'apple' | 'google' | 'facebook') => {
    setDevEmail(form.email || 'johannes@gmail.com')
    setAuthError('')

    try {
      if (firebaseConfigured) {
        if (provider !== 'google') {
          setAuthError('Only Google sign-in is configured right now.')
          return
        }

        const credentials = await signInWithGoogle()
        await persistFirebaseToken(credentials?.user)
      }
      await api.me()
      navigate('/app')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed.')
    }
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-[1728px] overflow-hidden bg-[#efefef] px-[88px] py-[84px]">
      <div className="pointer-events-none absolute -left-[1129px] top-[296px] h-[728px] w-[1385px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.22)_0%,_rgba(180,115,255,0)_68%)]" />
      <div className="pointer-events-none absolute left-[256px] top-[-505px] h-[623px] w-[1376px] rounded-full bg-[radial-gradient(circle,_rgba(124,168,255,0.2)_0%,_rgba(124,168,255,0)_70%)]" />
      <div className="pointer-events-none absolute left-[1581px] top-[84px] h-[997px] w-[1265px] rounded-full bg-[radial-gradient(circle,_rgba(180,115,255,0.2)_0%,_rgba(180,115,255,0)_70%)]" />

      <header className="relative flex items-start justify-between">
        <BrandBadge />
      </header>

      <section className="relative mx-auto mt-[35px] w-[1046px] rounded-[32px] border-[2px] border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.48)] p-[56px_80px_68px] shadow-[0_16px_40px_rgba(0,0,0,0.05)] backdrop-blur-[2px] [box-shadow:inset_0_0_14px_rgba(255,255,255,0.78),0_16px_40px_rgba(0,0,0,0.05)]">
        <BrandBadge className="absolute right-[88px] top-[68px]" />

        <div className="grid grid-cols-[378px_1fr] gap-[83px]">
          <div>
            <div className="mb-[24px] flex items-start justify-between">
              <h1 className="font-['Outfit',sans-serif] text-[45px] font-bold tracking-[-0.99px] text-[#232323]">
                {mode === 'signup' ? 'Sign up' : 'Sign in'}
              </h1>
              <AuthModeToggle
                mode={mode}
                onChangeMode={(nextMode) => {
                  setMode(nextMode)
                  setSubmitStatus('idle')
                  navigate(nextMode === 'signup' ? '/signup' : '/signin')
                }}
              />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <TextFieldRow
                  name="name"
                  value={form.name}
                  placeholder="Your name"
                  highlighted={activeField === 'name'}
                  leftIcon={<UserRound size={20} strokeWidth={2} />}
                  rightIcon={
                    form.name.length === 0 ? (
                      <CircleX size={18} />
                    ) : (
                      <CheckCircle2 size={18} className="text-[var(--color-primary)]" />
                    )
                  }
                  onChange={handleFieldChange}
                  onFocus={setActiveField}
                  onBlur={() => setActiveField(null)}
                />
              )}
              <TextFieldRow
                name="email"
                type="email"
                value={form.email}
                placeholder="johannes@gmail.com"
                highlighted={activeField === 'email'}
                leftIcon={<AtSign size={20} strokeWidth={2} />}
                rightIcon={
                  form.email.length === 0 ? (
                    <CircleX size={18} />
                  ) : emailIsValid ? (
                    <CheckCircle2 size={18} className="text-[var(--color-primary)]" />
                  ) : (
                    <CircleX size={18} />
                  )
                }
                onChange={handleFieldChange}
                onFocus={setActiveField}
                onBlur={() => setActiveField(null)}
              />
              <TextFieldRow
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                placeholder="Password"
                highlighted={activeField === 'password'}
                leftIcon={<Lock size={20} strokeWidth={2} />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[#9b9b9b] hover:text-[#7d7d7d]"
                  >
                    <Eye size={18} />
                  </button>
                }
                onChange={handleFieldChange}
                onFocus={setActiveField}
                onBlur={() => setActiveField(null)}
              />
              {mode === 'signup' && (
                <TextFieldRow
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  placeholder="Confirm password"
                  highlighted={activeField === 'confirmPassword'}
                  leftIcon={<Lock size={20} strokeWidth={2} />}
                  rightIcon={
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="text-[#9b9b9b] hover:text-[#7d7d7d]"
                    >
                      <Eye size={18} />
                    </button>
                  }
                  onChange={handleFieldChange}
                  onFocus={setActiveField}
                  onBlur={() => setActiveField(null)}
                />
              )}

              <p className="pt-[2px] text-center font-['Outfit',sans-serif] text-[17px] font-medium tracking-[-0.37px] text-[#c0c4d8]">
                {mode === 'signup' ? 'Or sign-up with' : 'Or sign-in with'}
              </p>

              <div className="flex items-center justify-between gap-[18px]">
                <SocialIconButton icon={appleIcon} label={`${mode === 'signup' ? 'Sign up' : 'Sign in'} with Apple`} onClick={() => handleSocialAuth('apple')} />
                <SocialIconButton icon={googleIcon} label={`${mode === 'signup' ? 'Sign up' : 'Sign in'} with Google`} onClick={() => handleSocialAuth('google')} />
                <SocialIconButton icon={facebookIcon} label={`${mode === 'signup' ? 'Sign up' : 'Sign in'} with Facebook`} onClick={() => handleSocialAuth('facebook')} />
              </div>

              <button
                type="submit"
                disabled={!formIsValid || submitStatus === 'submitting'}
                className="mt-[6px] inline-flex h-[59px] w-full items-center justify-between rounded-[28px] bg-[var(--color-primary)] pl-[150px] pr-[10px] font-['Space_Grotesk',sans-serif] text-[18px] font-bold tracking-[-0.99px] text-[#f6f8ff] transition hover:bg-[var(--color-primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {submitStatus === 'submitting'
                    ? 'Please wait...'
                    : submitStatus === 'success'
                      ? mode === 'signup'
                        ? 'Signed up'
                        : 'Signed in'
                      : mode === 'signup'
                        ? 'Sign up'
                        : 'Sign in'}
                </span>
                <span className="inline-flex h-[41px] w-[41px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.25)]">
                  <ArrowUpRight size={18} />
                </span>
              </button>
              {!formIsValid && (
                <p className="text-center font-['Outfit',sans-serif] text-[13px] text-[#8b8b8b]">
                  {mode === 'signup'
                    ? 'Fill all fields, use a valid email, and make sure passwords match.'
                    : 'Enter a valid email and password to continue.'}
                </p>
              )}
              {authError && (
                <p className="text-center font-['Outfit',sans-serif] text-[13px] text-[#9f56f3]">
                  {authError}
                </p>
              )}
            </form>
          </div>

          <aside className="pt-[112px]">
            <img
              src={friendsPictureTwo}
              alt="Group of friends smiling outside"
              width={416}
              height={499}
              className="h-[499px] w-[416px] rounded-[24px] object-cover"
            />
          </aside>
        </div>
      </section>

      <div className="mt-[56px] flex items-center justify-center gap-[8px]" aria-hidden>
        <span className="h-[7px] w-[46px] rounded-l-[77px] bg-[var(--color-primary)]" />
        <span className="h-[7px] w-[46px] bg-[#e3e3e3]" />
        <span className="h-[7px] w-[46px] rounded-r-[77px] bg-[#e3e3e3]" />
      </div>
    </main>
  )
}

export default SignUpPage
