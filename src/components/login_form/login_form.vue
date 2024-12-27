<template>
  <div class="login panel panel-default">
    <!-- Default panel contents -->

    <div class="panel-heading">
      <h1 class="title">
        {{ $t('login.login') }}
      </h1>
    </div>

    <div class="panel-body">
      <form
        class="login-form"
        @submit.prevent="submit"
      >
        <template v-if="isPasswordAuth">
          <div class="form-group">
            <label for="username">{{ $t('login.username') }}</label>
            <input
              id="username"
              ref="usernameInput"
              :disabled="loggingIn"
              class="input form-control"
              :placeholder="$t('login.placeholder')"
            >
          </div>
          <div class="form-group">
            <label for="password">{{ $t('login.password') }}</label>
            <input
              id="password"
              ref="passwordInput"
              :disabled="loggingIn"
              class="input form-control"
              type="password"
            >
          </div>
          <div class="form-group">
            <router-link :to="{name: 'password-reset'}">
              {{ $t('password_reset.forgot_password') }}
            </router-link>
          </div>
        </template>

        <div
          v-if="isTokenAuth"
          class="form-group"
        >
          <p>{{ $t('login.description') }}</p>
        </div>

        <div class="form-group">
          <div class="login-bottom">
            <div>
              <router-link
                v-if="registrationOpen"
                :to="{name: 'registration'}"
                class="register"
              >
                {{ $t('login.register') }}
              </router-link>
            </div>
            <button
              :disabled="loggingIn"
              type="submit"
              class="btn button-default"
            >
              {{ $t('login.login') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <div
      v-if="error"
      class="form-group"
    >
      <div class="alert error">
        {{ error }}
        <button
          class="button-unstyled"
          @click="clearError"
        >
          <FAIcon
            class="fa-scale-110 fa-old-padding"
            icon="times"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./login_form.js"></script>

<style lang="scss">
.login-form {
  display: flex;
  flex-direction: column;
  padding: 0.6em;

  .btn {
    min-height: 2em;
    width: 10em;
  }

  .register {
    flex: 1 1;
  }

  .login-bottom {
    margin-top: 1em;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    padding: 0.3em 0.5em 0.6em;
    line-height: 24px;
  }

  .form-bottom {
    display: flex;
    padding: 0.5em;
    height: 32px;

    button {
      width: 10em;
    }

    p {
      margin: 0.35em;
      padding: 0.35em;
      display: flex;
    }
  }

  .error {
    text-align: center;
    animation-name: shakeError;
    animation-duration: 0.4s;
    animation-timing-function: ease-in-out;
  }
}
</style>
