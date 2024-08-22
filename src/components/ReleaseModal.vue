<script setup lang="ts">
import { ref, toRef, watch } from "vue"
import type { Ref } from "vue"
import golos from "golos-lib-js"

import { checkAuth } from "./EnterKeyModal.vue"

const props = defineProps({
  escrow: {
    type: Object,
    required: true,
  },
  show: Boolean
})
const receivers : Ref<any[]> = ref([])
const receiver = ref("")
const whos : Ref<any[]> = ref([])
const who = ref("")
const key = ref("")
const amount = ref("")
const amountCurrs = ref(["GBG"])
const amountCur = ref("GBG")

const option = (item: string, hint: string) => {
  return { item, name: item + " " + hint }
}

watch(() => receiver.value, (rec) => {
  const agent = option(props.escrow.agent, " (агент)")
  if (props.escrow.disputed) {
    whos.value = [agent]
  } else if (rec == props.escrow.from) {
    whos.value = [option(props.escrow.to, " (получатель)"), agent]
  } else if (rec == props.escrow.to) {
    whos.value = [option(props.escrow.from, " (отправитель)"), agent]
  }
  who.value = whos.value[0].item
})

const getCurrencies = (escrow: any) => {
  return {
    GOLOS: parseFloat(escrow.steem_balance),
    GBG: parseFloat(escrow.sbd_balance)
  }
}

watch(() => props.show, (show) => {
  if (!show) return
  receivers.value = [
    option(props.escrow.to, " (получателю)"),
    option(props.escrow.from, " (вернуть отправителю)")
  ]
  receiver.value = receivers.value[0].item

  const currs = getCurrencies(props.escrow)
  amountCurrs.value = Object.keys(currs) //.filter(k => currs[k] != 0)
  if (amountCurrs.value.length) {
    amountCur.value = amountCurrs.value[0]
    amount.value = Object.values(currs)[0].toFixed(3)
  }
}, { immediate: true })

const printTotal = (escrow: any) => {
  const currs = getCurrencies(escrow)
  let total = ""
  for (const [sym, amount] of Object.entries(currs)) {
    if (amount == 0) continue
    if (total) total += ", "
    total += amount.toFixed(3) + " " + sym
  }
  return total
}

const process: Ref<boolean | any[]> = ref(false)

const localizeProcess = (process: boolean | any[]) => {
  if (!process) return
  if (Array.isArray(process) && process[0] === "auth")
    return "Авторизуемся..."
  return "Выводим..."
}

const showModal = toRef(props, "show")

const emit = defineEmits(["closed", "entered"])

const onClose = () => {
  if (process.value) return
  emit("closed")
}

const displayError = ref("")

const release = async (event: any) => {
  event.preventDefault()

  displayError.value = ""
  process.value = ["auth"]

  const active = await checkAuth(who.value, key.value)
  if (!active) {
    process.value = false
    return
  }

  key.value = ""

  process.value = ["release"]

  try {
    let steem = "0.000 GOLOS"
    let sbd = "0.000 GBG"
    if (amountCur.value == "GOLOS") {
      steem = parseFloat(amount.value).toFixed(3) + " GOLOS"
    } else {
      sbd = parseFloat(amount.value).toFixed(3) + " GBG"
    }

    const { from, to, agent, escrow_id } = props.escrow
    await golos.broadcast.escrowReleaseAsync(active, from, to, agent,
      who.value, receiver.value,
      escrow_id, sbd, steem)
    alert("Успешно!")
    process.value = false
    window.location.reload()
    return
  } catch (err) {
    const errorString = JSON.stringify(err)
    displayError.value = errorString
  }

  process.value = false
}

</script>

<template>
  <b-modal title="Вывести средства из Escrow" v-model="showModal" v-on:hide="onClose">
    <template #footer>
      <b-button variant="secondary" @click="onClose" :disabled="process">Отмена</b-button>
      <b-button type="submit" form="release" variant="primary">
        <b-spinner v-if="process" small></b-spinner>
        {{ process ? localizeProcess(process) : "Вывести" }}
      </b-button>
    </template>

  <form id="release" ref="form" @submit="release">
      <b-form-group id="ig-receiver" label="Кому:" label-for="i-receiver" class="input-block">
        <b-form-select class="input-block" v-model="receiver" :options="receivers" :disabled="receivers.length == 1"
          value-field="item" text-field="name">>
        </b-form-select>
      </b-form-group>
      <b-form-group id="ig-who" label="Кто вы:" label-for="i-who" class="input-block">
        <b-form-select class="input-block" v-model="who" :options="whos" :disabled="whos.length == 1"
          value-field="item" text-field="name">
        </b-form-select>
      </b-form-group>
     <b-form-group id="ig-key" label="Пароль\active:" label-for="i-key" class="input-block">
       <b-form-input
          id="i-key"
          v-model="key"
          type="password"
          required
          autofocus
        ></b-form-input>
      </b-form-group>
      <b-form-group id="ig-steem" label="Сумма:" label-for="i-steem" class="input-block">
        <b-row>
          <b-col sm="8" class="left-input">
            <b-form-input
              id="i-steem"
              v-model="amount"
              placeholder="0.000"
              required
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-select v-model="amountCur" :options="amountCurrs" :disabled="amountCurrs.length == 1">
            </b-form-select>
          </b-col>
        </b-row>
      </b-form-group>
      (всего в Escrow - {{ printTotal(escrow) }})
        <b-alert :model-value="!!displayError" variant="danger" dismissible style="margin-top: 1rem;">
          {{ displayError }}
        </b-alert>
  </form>
  </b-modal>
</template>