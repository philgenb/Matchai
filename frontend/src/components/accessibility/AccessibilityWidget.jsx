import { Accessibility, Contrast, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

const HIGH_CONTRAST_STORAGE_KEY = 'matchai:accessibility:highContrast'

function applyHighContrastClass(enabled) {
  document.body.classList.toggle('a11y-high-contrast', enabled)
  document.documentElement.classList.toggle('a11y-high-contrast', enabled)
}

function getStoredHighContrastValue() {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY)
  return stored === 'true'
}

function AccessibilityWidget() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(() => getStoredHighContrastValue())
  const [ttsStatus, setTtsStatus] = useState('idle')
  const [ttsError, setTtsError] = useState('')
  const panelRef = useRef(null)
  const audioRef = useRef(null)
  const objectUrlRef = useRef('')

  useEffect(() => {
    window.localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(isHighContrastEnabled))
    applyHighContrastClass(isHighContrastEnabled)
  }, [isHighContrastEnabled])

  useEffect(() => {
    if (!isMenuOpen) return undefined

    function onPointerDown(event) {
      if (!panelRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  async function startTtsPlayback() {
    setTtsError('')
    setTtsStatus('loading')

    audioRef.current?.pause()

    const rootText = document.querySelector('main')?.innerText?.trim() || document.body?.innerText?.trim() || ''
    if (!rootText) {
      setTtsError('No readable text found on this page yet.')
      setTtsStatus('idle')
      return
    }

    try {
      const text = rootText.replace(/\s+/g, ' ').slice(0, 5000)
      const audioBlob = await api.tts({
        text,
        voice_id: 'YTpq7expH9539ERJ',
        output_format: 'wav',
      })

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Empty audio response from TTS provider.')
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }

      objectUrlRef.current = URL.createObjectURL(audioBlob)
      const player = new Audio(objectUrlRef.current)
      player.onended = () => setTtsStatus('idle')
      player.onerror = () => {
        setTtsStatus('idle')
        setTtsError('Could not play generated audio.')
      }
      audioRef.current = player
      await player.play()
      setTtsStatus('playing')
    } catch (error) {
      setTtsStatus('idle')
      const raw = error instanceof Error ? error.message : 'Could not generate audio.'
      const friendly =
        raw === 'Not Found'
          ? 'TTS endpoint not available. Restart the backend so it picks up the accessibility route.'
          : raw
      setTtsError(friendly)
    }
  }

  function stopTtsPlayback() {
    audioRef.current?.pause()
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    setTtsStatus('idle')
  }

  return (
    <div ref={panelRef} className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
      {isMenuOpen && (
        <div className="w-72 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="mb-2 text-sm font-semibold text-slate-900">Accessibility</p>

          <button
            type="button"
            className="mb-2 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            onClick={() => setIsHighContrastEnabled((currentValue) => !currentValue)}
            aria-pressed={isHighContrastEnabled}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Contrast className="h-4 w-4" aria-hidden="true" />
              High contrast mode
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {isHighContrastEnabled ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            onClick={ttsStatus === 'playing' ? stopTtsPlayback : startTtsPlayback}
            aria-pressed={ttsStatus === 'playing'}
            disabled={ttsStatus === 'loading'}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              Read page aloud
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {ttsStatus === 'loading' ? 'Loading...' : ttsStatus === 'playing' ? 'Stop' : 'Play'}
            </span>
          </button>

          {ttsError && <p className="mt-2 text-xs text-rose-700">{ttsError}</p>}
        </div>
      )}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? 'Close accessibility menu' : 'Open accessibility menu'}
      >
        {isMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Accessibility className="h-4 w-4" aria-hidden="true" />}
        Accessibility
      </button>
    </div>
  )
}

export default AccessibilityWidget
