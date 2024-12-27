import * as DateUtils from 'src/services/date_utils/date_utils.js'
import { uniq } from 'lodash'

const pollFallbackValues = {
  pollType: 'single',
  options: ['', ''],
  expiryAmount: 10,
  expiryUnit: 'minutes'
}

const pollFallback = (object, attr) => {
  return object[attr] !== undefined ? object[attr] : pollFallbackValues[attr]
}

const pollFormToMasto = (poll) => {
  const expiresIn = DateUtils.unitToSeconds(
    pollFallback(poll, 'expiryUnit'),
    pollFallback(poll, 'expiryAmount')
  )

  const options = uniq(pollFallback(poll, 'options').filter(option => option !== ''))
  if (options.length < 2) {
    return { errorKey: 'polls.not_enough_options' }
  }

  return {
    options,
    multiple: pollFallback(poll, 'pollType') === 'multiple',
    expiresIn
  }
}

export {
  pollFallback,
  pollFormToMasto
}
