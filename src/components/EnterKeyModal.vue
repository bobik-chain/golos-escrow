<script lang="ts">
export async function checkAuth(acc: string, key: string) {
  if (!key) {
    alert("Авторизация обязательна.")
    return
  }

  let active
  try {
    const res = await golos.auth.login(acc, key)
    active = res.active
  } catch (err: any) {
    if (err === "No such account") {
      alert("Такого аккаунта не существует.")
    } else {
      alert(err.message || err)
    }
    return
  }

  if (!active) {
    alert("Неверный ключ/пароль.")
    return
  }

  return active
}
</script>
<script setup lang="ts">
import { ref, toRef, watch } from "vue"
import type { PropType, Ref } from "vue"
import golos from "golos-lib-js"

const props = defineProps({
  accounts: {
    type: Array as PropType<string[]>,
    required: true
  },
  show: Boolean
})

const showModal = toRef(props, "show")
const accounts: Ref<string[]> = toRef(() => props.accounts)
const account: Ref<string> = ref(accounts.value ? accounts.value[0] : "")
watch(() => props.accounts, (newAccs: string[] | undefined) => {
  if (newAccs) account.value = newAccs[0]
})
const key = ref("")

const emit = defineEmits(["closed", "entered"])

const onClose = () => {
  emit("closed")
}

const onSubmit = async (event?: any) => {
  if (event) event.preventDefault()

  const acc: string = account.value

  let active = await checkAuth(acc, key.value)
  if (!active) {
    return
  }

  key.value = ""
  onClose()

  emit("entered", active, acc)
}

const handleOk = (event: any) => {
  event.preventDefault()
  onSubmit()
}

</script>

<template>
  <b-modal title="Введите актив-ключ или пароль" v-model="showModal" v-on:hide="onClose" v-on:ok="handleOk">
    <form ref="form" @submit="onSubmit">
      <b-form-select class="input-block" v-model="account" :options="accounts" :disabled="accounts.length == 1">
      </b-form-select>
      <b-form-input
        id="key-input"
        v-model="key"
        type="password"
        placeholder="Пароль\active"
        required
        autofocus
      ></b-form-input>
    </form>
  </b-modal>
</template>