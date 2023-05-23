import { defineStore } from 'pinia'

export const useShoutStore = defineStore('shout', {
  state: () => ({
    messages: [],
    channel: { state: '' },
    joined: false
  }),
  actions: {
    initializeShout (socket) {
      const channel = socket.channel('chat:public')
      channel.joinPush.receive('ok', () => {
        this.joined = true
      })
      channel.onClose(() => {
        this.joined = false
      })
      channel.onError(() => {
        this.joined = false
      })
      channel.on('new_msg', (msg) => {
        this.messages.push(msg)
        this.messages = this.messages.slice(-19, 20)
      })
      channel.on('messages', ({ messages }) => {
        this.messages = messages.slice(-19, 20)
      })
      channel.join()
      this.channel = channel
    }
  }
})
