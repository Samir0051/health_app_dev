export function groupIntoPhases(reps) {
  const groups = []
  let current = []
  reps.forEach((rep, i) => {
    current.push(rep)
    const next = reps[i + 1]
    const continuesToNext = Number(rep.restAfter) === 0 && next
    if (!continuesToNext) {
      groups.push(current)
      current = []
    }
  })
  if (current.length) groups.push(current)
  return groups
}
