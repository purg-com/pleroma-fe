const SharedComputedObject = () => ({
  user () {
    return this.$store.state.users.currentUser
  },
  expertLevel () {
    return this.$store.getters.mergedConfig.expertLevel > 0
  },
  mergedConfig () {
    return this.$store.getters.mergedConfig
  },
  adminConfig () {
    return this.$store.state.adminSettings.config
  }
})

export default SharedComputedObject
