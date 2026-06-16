// These functions stand in for the LLM-driven "neural fatigue model" described
// in the product spec. They're plain, explainable rules so the app is fully
// functional today — swap the body of any function here for a real model call
// (e.g. an Anthropic API request) without touching the UI that consumes it.

import { mean } from './format'

/**
 * % difference between today's reaction mean and a baseline mean.
 * Positive = slower than baseline (less ready). Negative = faster (sharper).
 */
export function reactionDeltaPct(todayMeanMs, baselineMeanMs) {
  if (!todayMeanMs || !baselineMeanMs) return 0
  return ((todayMeanMs - baselineMeanMs) / baselineMeanMs) * 100
}

export function readinessLabel(deltaPct) {
  if (deltaPct >= 15) return { label: 'Reduced readiness', tone: 'alert' }
  if (deltaPct >= 8) return { label: 'Slightly below baseline', tone: 'signal' }
  if (deltaPct <= -5) return { label: 'Sharper than baseline', tone: 'gate' }
  return { label: 'At baseline', tone: 'gate' }
}

/**
 * Suggests a rest duration for the next rep based on how reaction time has
 * drifted from personal baseline, plus a plain-language reason. The athlete
 * or coach always makes the final call — this never auto-applies.
 */
export function recommendRest({ intendedRestSec, deltaPct, heartRate, restingHeartRate }) {
  let factor = 1
  let reason = 'Reaction time is tracking at baseline — intended rest looks right.'

  if (deltaPct >= 20) {
    factor = 1.5
    reason = `Reaction time is ${Math.round(deltaPct)}% slower than baseline — CNS fatigue is building. Recommend extending rest.`
  } else if (deltaPct >= 10) {
    factor = 1.25
    reason = `Reaction time is ${Math.round(deltaPct)}% slower than baseline. A short extension should let neural readiness recover before the next rep.`
  } else if (deltaPct <= -8) {
    factor = 0.9
    reason = 'Reaction time is sharper than baseline — readiness is high, intended rest can hold or trim slightly.'
  }

  if (heartRate && restingHeartRate && heartRate > restingHeartRate * 1.7) {
    factor += 0.1
    reason += ' Elevated heart rate also supports a longer recovery window.'
  }

  const recommendedSec = Math.round((intendedRestSec || 60) * factor)
  return { recommendedSec, reason, factor }
}

/**
 * Looks at recent rep-level reaction deltas to flag whether the session
 * should continue or wrap up. Supported by the actual numbers, not a black box.
 */
export function continueOrStopSignal(repLogs) {
  const recentDeltas = repLogs
    .slice(-3)
    .map((r) => r.reactionDeltaPct)
    .filter((v) => typeof v === 'number')

  if (recentDeltas.length < 2) {
    return { signal: 'continue', message: 'Neural readiness sufficient to continue.', evidence: recentDeltas }
  }

  const degradedCount = recentDeltas.filter((d) => d >= 15).length
  const avgRecent = mean(recentDeltas) ?? 0

  if (degradedCount >= 2) {
    return {
      signal: 'stop',
      message: `Reaction time has been ${Math.round(avgRecent)}% above baseline across the last ${recentDeltas.length} reps. Recommend ending the session.`,
      evidence: recentDeltas,
    }
  }

  return {
    signal: 'continue',
    message: 'Neural readiness sufficient to continue.',
    evidence: recentDeltas,
  }
}

/**
 * 7-day rolling average of baseline reaction means, optionally scoped to a
 * context tag (e.g. "on caffeine"). Returns null when there isn't enough data.
 */
export function rollingBaseline(baselineTests, { contextTag = null, days = 7 } = {}) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const scoped = baselineTests.filter((t) => {
    const inWindow = new Date(t.timestamp).getTime() >= cutoff
    const matchesTag = !contextTag || (t.contextTag || '').toLowerCase() === contextTag.toLowerCase()
    return inWindow && matchesTag
  })
  if (scoped.length === 0) return null
  return mean(scoped.map((t) => t.meanMs))
}

export function overallBaseline(baselineTests) {
  if (!baselineTests || baselineTests.length === 0) return null
  return mean(baselineTests.map((t) => t.meanMs))
}
