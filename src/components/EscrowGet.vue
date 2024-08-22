<script setup lang="ts">
import { ref } from "vue"
import type { Ref } from "vue"
import golos from "golos-lib-js"

let submitError = ref("")
let escrow: Ref<any> = ref(null)

const onSubmit = async (event: any, form: any) => {
  event.preventDefault()
        
  submitError.value = ""
  escrow.value = {}

  const obj = await golos.api.getEscrowAsync(form.from, form.escrow)
  if (!obj) { 
    submitError.value = "Такой Escrow не найдено."
  } else {
    escrow.value = obj
  }
}

const escrowStatus = (esc: any) => {
  if (esc.disputed) {
    return "открыт спор"
  }
  if (esc.to_approved) {
    if (esc.agent_approved) {
      return "одобрено (агентом и получателем)"
    }
    return "одобрено получателем"
  }
  if (esc.agent_approved) {
    return "одобрено агентом"
  }
  return "ждет одобрения"
}

</script>

<template>
<div class="content-view" style="max-width: 400px;">
    <h3>Проверить Escrow</h3>
    <b-form @submit="onSubmit($event, form)">
      <b-form-group id="ig-from" label="Аккаунт-отправитель:" label-for="i-from" class="input-block">
        <b-form-input
          id="i-from"
          v-model="form.from"
          placeholder="Имя"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group id="ig-escrow" label="# Номер escrow:" label-for="i-escrow" class="input-block">
        <b-form-input
          id="i-escrow"
          v-model="form.escrow"
          placeholder="#"
          required
        ></b-form-input>
      </b-form-group>

      <b-button type="submit" variant="primary">Найти</b-button>

      <b-alert :model-value="!!submitError" variant="danger" dismissible style="margin-top: 1rem;">
        {{ submitError }}
      </b-alert>

      <b-card style="margin-top: 1rem;" v-if="escrow && escrow.from" :title="'Получатель: @' + escrow.to">
        <b-card-text>
        <div v-if="parseFloat(escrow.steem_balance) !== 0">
          <b>Сумма GOLOS:</b>
          {{ escrow.steem_balance.split(" ")[0] }}
        </div>
        <div v-if="parseFloat(escrow.sbd_balance) !== 0">
          <b>Сумма GBG:</b>
          {{ escrow.sbd_balance.split(" ")[0] }}
        </div>
        <div style="margin-top: 1rem;">
          <b>Агент:</b>
          {{ "@" + escrow.agent }}
        </div>
        <div>
          <b>Комиссия агенту:</b>
          {{ escrow.pending_fee }}
        </div>
        <div style="margin-top: 1rem;">
          <div><b>Срок одобрения:</b></div>
          {{ new Date(escrow.ratification_deadline + ".000Z").toLocaleString() }}
        </div>
        <div style="margin-bottom: 1rem;">
          <div><b>Срок окончания:</b></div>
          {{ new Date(escrow.escrow_expiration + ".000Z").toLocaleString() }}
        </div>
        <div>
          <b>Статус:</b>
          {{ escrowStatus(escrow) }}
        </div>
        <b-alert :model-value="!!displayError" variant="danger" dismissible style="margin-top: 1rem;">
          {{ displayError }}
        </b-alert>
        <div v-if="!escrow.to_approved || !escrow.agent_approved" style="margin-top: 1rem;">
          <b-button variant="primary" @click="showApprove">Одобрить</b-button>
          <b-button variant="danger" @click="showCancel">Отменить</b-button>
        </div>
        <div v-if="escrow.to_approved && escrow.agent_approved" style="margin-top: 1rem;">
          <b-button v-if="!escrow.disputed" variant="danger" @click="showDispute">Откр. спор</b-button>
          <b-button variant="primary" @click="showRelease">Вывести средства</b-button>
        </div>
        </b-card-text>
        <EnterKeyModal title="Одобрить Escrow" :show="approveShow" :accounts="[escrow.agent, escrow.to]" @closed="hideApprove" @entered="(key: string, acc: string) => approveEntered(key, acc, true, escrow)" />
        <EnterKeyModal title="Отменить Escrow" :show="cancelShow" :accounts="[escrow.agent, escrow.to]" @closed="hideCancel" @entered="(key: string, acc: string) => approveEntered(key, acc, false, escrow)" />
        <EnterKeyModal title="Открыть спор по Escrow" :show="disputeShow" :accounts="[escrow.from, escrow.to]" @closed="hideDispute" @entered="(key: string, acc: string) => disputeEntered(key, acc, escrow)" />
        <ReleaseModal :show="releaseShow" :escrow="escrow" @closed="hideRelease" />
      </b-card>
    </b-form>
  </div>

</template>

<script lang="ts">
  export default {
    data() {
      return {
        form: {
          from: "bobik7",
          escrow: ""
        },
        approveShow: false,
        cancelShow: false,
        disputeShow: false,
        releaseShow: false,
        displayError: null as any,
      }
    },
    methods: {
      showApprove() {
        this.displayError = null
        this.approveShow = true
      },
      hideApprove() {
        this.approveShow = false
      },
      showCancel() {
        this.displayError = null
        this.cancelShow = true
      },
      hideCancel() {
        this.cancelShow = false
      },
      showDispute() {
        this.displayError = null
        this.disputeShow = true
      },
      hideDispute() {
        this.disputeShow = false
      },
      showRelease() {
        this.releaseShow = true
      },
      hideRelease() {
        this.releaseShow = false
      },
      async approveEntered(key: string, account: string, approve: boolean, escrow: any) {
        try {
          const { from, to, agent, escrow_id } = escrow
          await golos.broadcast.escrowApproveAsync(key, from, to, agent,
            account, escrow_id, approve)
          alert("Успешно!")
          window.location.reload()
        } catch (err) {
          const errorString = JSON.stringify(err)
          if (errorString.includes("has already approved the escrow.")) {
            this.displayError = "Вы уже одобрили эту escrow. Теперь вы не можете ни одобрить повторно, ни отменить ее."
            return
          }
          this.displayError = errorString
        }
      },
      async disputeEntered(key: string, account: string, escrow: any) {
        try {
          const { from, to, agent, escrow_id } = escrow
          await golos.broadcast.escrowDisputeAsync(key, from, to, agent,
            account, escrow_id)
          alert("Успешно!")
          window.location.reload()
        } catch (err) {
          const errorString = JSON.stringify(err)
          this.displayError = errorString
        }
      },
    }
  }
</script>
