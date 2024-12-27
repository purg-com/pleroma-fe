import * as DateUtils from 'src/services/date_utils/date_utils.js'
import { pollFallback } from 'src/services/poll/poll.service.js'
import { library } from '@fortawesome/fontawesome-svg-core'
import Select from '../select/select.vue'
import {
  faTimes,
  faPlus
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faTimes,
  faPlus
)

export default {
  components: {
    Select
  },
  name: 'PollForm',
  props: {
    visible: {},
    params: {
      type: Object,
      required: true
    }
  },
  computed: {
    pollType: {
      get () { return pollFallback(this.params, 'pollType') },
      set (newVal) { this.params.pollType = newVal }
    },
    options () {
      const hasOptions = !!this.params.options
      if (!hasOptions) {
        this.params.options = pollFallback(this.params, 'options')
      }
      return this.params.options
    },
    expiryAmount: {
      get () { return pollFallback(this.params, 'expiryAmount') },
      set (newVal) { this.params.expiryAmount = newVal }
    },
    expiryUnit: {
      get () { return pollFallback(this.params, 'expiryUnit') },
      set (newVal) { this.params.expiryUnit = newVal }
    },
    pollLimits () {
      return this.$store.state.instance.pollLimits
    },
    maxOptions () {
      return this.pollLimits.max_options
    },
    maxLength () {
      return this.pollLimits.max_option_chars
    },
    expiryUnits () {
      const allUnits = ['minutes', 'hours', 'days']
      const expiry = this.convertExpiryFromUnit
      return allUnits.filter(
        unit => this.pollLimits.max_expiration >= expiry(unit, 1)
      )
    },
    minExpirationInCurrentUnit () {
      return Math.ceil(
        this.convertExpiryToUnit(
          this.expiryUnit,
          this.pollLimits.min_expiration
        )
      )
    },
    maxExpirationInCurrentUnit () {
      return Math.floor(
        this.convertExpiryToUnit(
          this.expiryUnit,
          this.pollLimits.max_expiration
        )
      )
    }
  },
  methods: {
    clear () {
      this.pollType = 'single'
      this.options = ['', '']
      this.expiryAmount = 10
      this.expiryUnit = 'minutes'
    },
    nextOption (index) {
      const element = this.$el.querySelector(`#poll-${index + 1}`)
      if (element) {
        element.focus()
      } else {
        // Try adding an option and try focusing on it
        const addedOption = this.addOption()
        if (addedOption) {
          this.$nextTick(function () {
            this.nextOption(index)
          })
        }
      }
    },
    addOption () {
      if (this.options.length < this.maxOptions) {
        this.options.push('')
        return true
      }
      return false
    },
    deleteOption (index, event) {
      if (this.options.length > 2) {
        this.options.splice(index, 1)
      }
    },
    convertExpiryToUnit (unit, amount) {
      // Note: we want seconds and not milliseconds
      return DateUtils.secondsToUnit(unit, amount)
    },
    convertExpiryFromUnit (unit, amount) {
      return DateUtils.unitToSeconds(unit, amount)
    },
    expiryAmountChange () {
      this.expiryAmount =
        Math.max(this.minExpirationInCurrentUnit, this.expiryAmount)
      this.expiryAmount =
        Math.min(this.maxExpirationInCurrentUnit, this.expiryAmount)
    }
  }
}
