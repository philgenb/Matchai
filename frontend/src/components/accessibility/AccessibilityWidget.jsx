import { Accessibility, Contrast, MousePointer2, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

const HIGH_CONTRAST_STORAGE_KEY = 'matchai:accessibility:highContrast'
const HOVER_READ_STORAGE_KEY = 'matchai:accessibility:hoverRead'

const TTS_VOICE_ID = 'YTpq7expH9539ERJ'
const TTS_OUTPUT_FORMAT = 'wav'
const HOVER_DWELL_MS = 450
const HOVER_TEXT_MIN_LENGTH = 2
const HOVER_TEXT_MAX_LENGTH = 1500
const HOVER_CACHE_LIMIT = 30
const HOVER_TARGET_SELECTOR = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'li', 'label', 'dt', 'dd', 'figcaption', 'blockquote',
  'button', 'a',
  '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]',
  'input', 'textarea', 'select',
].join(',')

function applyHighContrastClass(enabled) {
  document.body.classList.toggle('a11y-high-contrast', enabled)
  document.documentElement.classList.toggle('a11y-high-contrast', enabled)
}

function getStoredBoolean(key) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(key) === 'true'
}

function getReadableText(element) {
  if (!element) return ''

  const ariaLabel = element.getAttribute('aria-label')?.trim()
  if (ariaLabel) return ariaLabel

  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelText = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText?.trim())
      .filter(Boolean)
      .join(' ')
    if (labelText) return labelText
  }

  if (element.matches('input, textarea, select')) {
    if (element.id) {
      const associatedLabel = document.querySelector(`label[for="${CSS.escape(element.id)}"]`)
      const text = associatedLabel?.innerText?.trim()
      if (text) return text
    }
    const placeholder = element.getAttribute?.('placeholder')?.trim()
    if (placeholder) return placeholder
    const value = typeof element.value === 'string' ? element.value.trim() : ''
    if (value) return value
    return ''
  }

  return element.innerText?.trim() || ''
}

function AccessibilityWidget() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(() =>
    getStoredBoolean(HIGH_CONTRAST_STORAGE_KEY),
  )
  const [isHoverReadEnabled, setIsHoverReadEnabled] = useState(() =>
    getStoredBoolean(HOVER_READ_STORAGE_KEY),
  )
  const [ttsStatus, setTtsStatus] = useState('idle')
  const [ttsError, setTtsError] = useState('')
  const [hoverPreview, setHoverPreview] = useState('')
  const [hoverState, setHoverState] = useState('idle')

  const panelRef = useRef(null)
  const audioRef = useRef(null)
  const objectUrlRef = useRef('')
  const hoverAudioRef = useRef(null)
  const hoverObjectUrlRef = useRef('')
  const dwellTimerRef = useRef(null)
  const ttsCacheRef = useRef(new Map())
  const currentHoverTargetRef = useRef(null)
  const hoverRequestIdRef = useRef(0)

  useEffect(() => {
    window.localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(isHighContrastEnabled))
    applyHighContrastClass(isHighContrastEnabled)
  }, [isHighContrastEnabled])

  useEffect(() => {
    window.localStorage.setItem(HOVER_READ_STORAGE_KEY, String(isHoverReadEnabled))
  }, [isHoverReadEnabled])

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
      hoverAudioRef.current?.pause()
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      if (hoverObjectUrlRef.current) {
        URL.revokeObjectURL(hoverObjectUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isHoverReadEnabled) {
      clearHoverHighlight({ resetTarget: true })
      stopHoverAudio()
      setHoverPreview('')
      setHoverState('idle')
      return undefined
    }

    document.documentElement.classList.add('a11y-hover-read-active')

    function findReadableTarget(node) {
      if (!(node instanceof Element)) return null
      if (node.closest('[data-a11y-widget]')) return null
      const target = node.closest(HOVER_TARGET_SELECTOR)
      if (!target) return null
      if (target.closest('[data-a11y-widget]')) return null
      if (target.getAttribute?.('aria-hidden') === 'true') return null
      return target
    }

    function handlePointerOver(event) {
      const target = findReadableTarget(event.target)
      handleEnter(target)
    }

    function handleFocusIn(event) {
      const target = findReadableTarget(event.target)
      handleEnter(target)
    }

    function handlePointerLeaveDocument() {
      handleEnter(null)
    }

    function handleEnter(target) {
      if (target === currentHoverTargetRef.current) return

      clearHoverHighlight()
      stopHoverAudio()
      hoverRequestIdRef.current += 1

      if (!target) {
        currentHoverTargetRef.current = null
        setHoverPreview('')
        setHoverState('idle')
        return
      }

      const text = getReadableText(target)
      if (!text || text.length < HOVER_TEXT_MIN_LENGTH) {
        currentHoverTargetRef.current = null
        setHoverPreview('')
        setHoverState('idle')
        return
      }

      currentHoverTargetRef.current = target
      target.classList.add('a11y-hover-target')
      setHoverPreview(text.length > 90 ? `${text.slice(0, 87)}...` : text)
      setHoverState('dwelling')

      const requestId = hoverRequestIdRef.current
      dwellTimerRef.current = window.setTimeout(() => {
        playHoverText(target, text, requestId)
      }, HOVER_DWELL_MS)
    }

    document.addEventListener('pointerover', handlePointerOver)
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('pointerleave', handlePointerLeaveDocument)

    return () => {
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('pointerleave', handlePointerLeaveDocument)
      document.documentElement.classList.remove('a11y-hover-read-active')
      clearHoverHighlight({ resetTarget: true })
      stopHoverAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHoverReadEnabled])

  function clearHoverHighlight({ resetTarget = false } = {}) {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }
    const previous = currentHoverTargetRef.current
    if (previous) {
      previous.classList.remove(
        'a11y-hover-target',
        'a11y-hover-target-loading',
        'a11y-hover-target-active',
      )
    }
    if (resetTarget) {
      currentHoverTargetRef.current = null
    }
  }

  function stopHoverAudio() {
    hoverAudioRef.current?.pause()
    hoverAudioRef.current = null
    if (hoverObjectUrlRef.current) {
      URL.revokeObjectURL(hoverObjectUrlRef.current)
      hoverObjectUrlRef.current = ''
    }
  }

  async function fetchTtsBlob(text) {
    const cache = ttsCacheRef.current
    const cached = cache.get(text)
    if (cached) {
      cache.delete(text)
      cache.set(text, cached)
      return cached
    }

    const blob = await api.tts({
      text: text.replace(/\s+/g, ' ').slice(0, HOVER_TEXT_MAX_LENGTH),
      voice_id: TTS_VOICE_ID,
      output_format: TTS_OUTPUT_FORMAT,
    })

    if (!blob || blob.size === 0) {
      throw new Error('Empty audio response from TTS provider.')
    }

    if (cache.size >= HOVER_CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(text, blob)
    return blob
  }

  async function playHoverText(target, text, requestId) {
    if (requestId !== hoverRequestIdRef.current) return
    if (currentHoverTargetRef.current !== target) return

    target.classList.add('a11y-hover-target-loading')
    setHoverState('loading')

    try {
      const blob = await fetchTtsBlob(text)

      if (requestId !== hoverRequestIdRef.current) return
      if (currentHoverTargetRef.current !== target) return

      target.classList.remove('a11y-hover-target-loading')
      target.classList.add('a11y-hover-target-active')

      stopHoverAudio()
      const url = URL.createObjectURL(blob)
      hoverObjectUrlRef.current = url
      const player = new Audio(url)
      hoverAudioRef.current = player

      player.onended = () => {
        if (currentHoverTargetRef.current === target) {
          target.classList.remove('a11y-hover-target-active')
          setHoverState('dwelling')
        }
        if (hoverObjectUrlRef.current === url) {
          URL.revokeObjectURL(url)
          hoverObjectUrlRef.current = ''
        }
      }
      player.onerror = () => {
        target.classList.remove('a11y-hover-target-active')
        if (hoverObjectUrlRef.current === url) {
          URL.revokeObjectURL(url)
          hoverObjectUrlRef.current = ''
        }
      }

      setHoverState('playing')
      await player.play()
    } catch (error) {
      target.classList.remove('a11y-hover-target-loading', 'a11y-hover-target-active')
      if (currentHoverTargetRef.current === target) {
        setHoverState('error')
      }
    }
  }

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
        voice_id: TTS_VOICE_ID,
        output_format: TTS_OUTPUT_FORMAT,
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

  const hoverStatusLabel =
    hoverState === 'loading'
      ? 'Loading...'
      : hoverState === 'playing'
        ? 'Reading'
        : hoverState === 'dwelling'
          ? 'Hold to read'
          : hoverState === 'error'
            ? 'Could not read'
            : ''

  return (
    <div
      ref={panelRef}
      data-a11y-widget="true"
      className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6"
    >
      {isHoverReadEnabled && hoverPreview && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none max-w-xs rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-md backdrop-blur"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {hoverStatusLabel}
          </span>
          <span className="mt-0.5 block text-slate-900">{hoverPreview}</span>
        </div>
      )}

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
            className="mb-2 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            onClick={() => setIsHoverReadEnabled((currentValue) => !currentValue)}
            aria-pressed={isHoverReadEnabled}
          >
            <span className="flex flex-col gap-0.5 text-left">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <MousePointer2 className="h-4 w-4" aria-hidden="true" />
                Read on hover
              </span>
              <span className="text-[11px] text-slate-500">
                Hover or focus a paragraph or button to hear it aloud.
              </span>
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {isHoverReadEnabled ? 'On' : 'Off'}
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
              Read whole page
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
