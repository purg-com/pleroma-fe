import { sortBy } from 'lodash'

// "Unrolls" a tree structure of item: { parent: { ...item2, parent: { ...item3, parent: {...} } }}
// into an array [item2, item3] for iterating
export const unroll = (item) => {
  const out = []
  let currentParent = item
  while (currentParent) {
    out.push(currentParent)
    currentParent = currentParent.parent
  }
  return out
}

// This gives you an array of arrays of all possible unique (i.e. order-insensitive) combinations
// Can only accept primitives. Duplicates are not supported and can cause unexpected behavior
export const getAllPossibleCombinations = (array) => {
  const combos = [array.map(x => [x])]
  for (let comboSize = 2; comboSize <= array.length; comboSize++) {
    const previous = combos[combos.length - 1]
    const newCombos = previous.map(self => {
      const selfSet = new Set()
      self.forEach(x => selfSet.add(x))
      const nonSelf = array.filter(x => !selfSet.has(x))
      return nonSelf.map(x => [...self, x])
    })
    const flatCombos = newCombos.reduce((acc, x) => [...acc, ...x], [])
    const uniqueComboStrings = new Set()
    const uniqueCombos = flatCombos.map(sortBy).filter(x => {
      if (uniqueComboStrings.has(x.join())) {
        return false
      } else {
        uniqueComboStrings.add(x.join())
        return true
      }
    })
    combos.push(uniqueCombos)
  }
  return combos.reduce((acc, x) => [...acc, ...x], [])
}

/**
 * Converts rule, parents and their criteria into a CSS (or path if ignoreOutOfTreeSelector == true)
 * selector.
 *
 * "path" here refers to "fake" selector that cannot be actually used in UI but is used for internal
 * purposes
 *
 * @param {Object} components - object containing all components definitions
 *
 * @returns {Function}
 * @param {Object} rule - rule in question to convert to CSS selector
 * @param {boolean} ignoreOutOfTreeSelector - wthether to ignore aformentioned field in
 *   component definition and use selector
 * @param {boolean} isParent - (mostly) internal argument used when recursing
 *
 * @returns {String} CSS selector (or path)
 */
export const genericRuleToSelector = components => (rule, ignoreOutOfTreeSelector, isParent) => {
  if (!rule && !isParent) return null
  const component = components[rule.component]
  const { states = {}, variants = {}, selector, outOfTreeSelector } = component

  const applicableStates = ((rule.state || []).filter(x => x !== 'normal')).map(state => states[state])

  const applicableVariantName = (rule.variant || 'normal')
  let applicableVariant = ''
  if (applicableVariantName !== 'normal') {
    applicableVariant = variants[applicableVariantName]
  } else {
    applicableVariant = variants?.normal ?? ''
  }

  let realSelector
  if (selector === ':root') {
    realSelector = ''
  } else if (isParent) {
    realSelector = selector
  } else {
    if (outOfTreeSelector && !ignoreOutOfTreeSelector) realSelector = outOfTreeSelector
    else realSelector = selector
  }

  const selectors = [realSelector, applicableVariant, ...applicableStates]
    .sort((a, b) => {
      if (a.startsWith(':')) return 1
      if (/^[a-z]/.exec(a)) return -1
      else return 0
    })
    .join('')

  if (rule.parent) {
    return (genericRuleToSelector(components)(rule.parent, ignoreOutOfTreeSelector, true) + ' ' + selectors).trim()
  }
  return selectors.trim()
}

/**
 * Check if combination matches
 *
 * @param {Object} criteria - criteria to match against
 * @param {Object} subject - rule/combination to check match
 * @param {boolean} strict - strict checking:
 *   By default every variant and state inherits from "normal" state/variant
 *   so when checking if combination matches, it WILL match against "normal"
 *   state/variant. In strict mode inheritance is ignored an "normal" does
 *   not match
 */
export const combinationsMatch = (criteria, subject, strict) => {
  if (criteria.component !== subject.component) return false

  // All variants inherit from normal
  if (subject.variant !== 'normal' || strict) {
    if (criteria.variant !== subject.variant) return false
  }

  // Subject states > 1 essentially means state is "normal" and therefore matches
  if (subject.state.length > 1 || strict) {
    const subjectStatesSet = new Set(subject.state)
    const criteriaStatesSet = new Set(criteria.state)

    const setsAreEqual =
      [...criteriaStatesSet].every(state => subjectStatesSet.has(state)) &&
      [...subjectStatesSet].every(state => criteriaStatesSet.has(state))

    if (!setsAreEqual) return false
  }
  return true
}

/**
 * Search for rule that matches `criteria` in set of rules
 * meant to be used in a ruleset.filter() function
 *
 * @param {Object} criteria - criteria to search for
 * @param {boolean} strict - whether search strictly or not (see combinationsMatch)
 *
 * @return function that returns true/false if subject matches
 */
export const findRules = (criteria, strict) => subject => {
  // If we searching for "general" rules - ignore "specific" ones
  if (criteria.parent === null && !!subject.parent) return false
  if (!combinationsMatch(criteria, subject, strict)) return false

  if (criteria.parent !== undefined && criteria.parent !== null) {
    if (!subject.parent && !strict) return true
    const pathCriteria = unroll(criteria)
    const pathSubject = unroll(subject)
    if (pathCriteria.length < pathSubject.length) return false

    // Search: .a .b .c
    // Matches: .a .b .c; .b .c; .c; .z .a .b .c
    // Does not match .a .b .c .d, .a .b .e
    for (let i = 0; i < pathCriteria.length; i++) {
      const criteriaParent = pathCriteria[i]
      const subjectParent = pathSubject[i]
      if (!subjectParent) return true
      if (!combinationsMatch(criteriaParent, subjectParent, strict)) return false
    }
  }
  return true
}

// Pre-fills 'normal' state/variant if missing
export const normalizeCombination = rule => {
  rule.variant = rule.variant ?? 'normal'
  rule.state = [...new Set(['normal', ...(rule.state || [])])]
}