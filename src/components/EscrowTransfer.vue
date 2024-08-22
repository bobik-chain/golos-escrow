<script setup lang="ts">
import DatePicker from "vue-datepicker-next"
import "vue-datepicker-next/index.css"
import "vue-datepicker-next/locale/ru.es"
import golos from "golos-lib-js"

import EnterKeyModal from "./EnterKeyModal.vue"

const localizeProcess = (process: any) => {
  if (!process) return
  if (process[0] === "submit")
    return "Отправляем..."
  if (process[0] === "id")
    return "Подбираем номер escrow..."
  if (process[0] === "placing")
    return "Создаем escrow #" + process[1] + "..."
}

</script>

<template>
<div class="content-view" style="max-width: 400px;">
    <b-form @submit="onSubmit">
    <h3>Создать Escrow</h3>
      <b-form-group id="ig-from" label="От кого:" label-for="i-from" class="input-block">
        <b-form-input
          id="i-from"
          v-model="form.from"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group id="ig-to" label="Кому:" label-for="i-to" class="input-block">
        <b-form-input
          id="i-to"
          v-model="form.to"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group id="ig-agent" label="Агент:" label-for="i-agent" class="input-block">
        <b-form-input
          id="i-agent"
          v-model="form.agent"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group id="ig-steem" label="Сумма:" label-for="i-steem" class="input-block">
        <b-row>
          <b-col sm="8" class="left-input">
            <b-form-input
              id="i-steem"
              v-model="form.amount"
              placeholder="0.000"
              required
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-select v-model="form.amount_cur">
              <b-form-select-option value="GOLOS">GOLOS</b-form-select-option>
              <b-form-select-option value="GBG">GBG</b-form-select-option>
            </b-form-select>
          </b-col>
        </b-row>
      </b-form-group>

      <b-form-group id="ig-fee" label="Комиссия агента (необязательно):" label-for="i-fee" class="input-block">
        <b-row>
          <b-col sm="8" class="left-input">
            <b-form-input
              id="i-fee"
              v-model="form.fee"
              placeholder="0.000"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-select v-model="form.fee_cur">
              <b-form-select-option value="GOLOS">GOLOS</b-form-select-option>
              <b-form-select-option value="GBG">GBG</b-form-select-option>
            </b-form-select>
          </b-col>
        </b-row>
      </b-form-group>

      <b-form-group id="ig-deadline" label="Срок на одобрение (после - сделка автоматически отменяется):" label-for="i-deadline" class="input-block">
        <b-row>
          <b-col sm="6" class="left-input">
            <date-picker v-model:value="form.deadline" :placeholder="form.d_plac"></date-picker>
          </b-col>
          <b-col sm="6">
            <date-picker v-model:value="form.deadline" type="time" format="H:mm"></date-picker>
          </b-col>
        </b-row>
      </b-form-group>

      <b-form-group id="ig-expiration" label="Срок на вывод средств (или открытие спора, даже если одобрено):" label-for="i-expiration" class="input-block">
        <b-row>
          <b-col sm="6" class="left-input">
            <date-picker v-model:value="form.expiration" :placeholder="form.e_plac"></date-picker>
          </b-col>
          <b-col sm="6">
            <date-picker v-model:value="form.expiration" type="time" format="H:mm"></date-picker>
          </b-col>
        </b-row>
      </b-form-group>

      <b-alert :model-value="!!displayError" variant="danger" dismissible style="margin-top: 1rem;">
        {{ displayError }}
      </b-alert>
      <b-button :disabled="process" type="submit" variant="primary">
         <b-spinner v-if="process" small></b-spinner>
         {{ process ? localizeProcess(process) : "Отправить" }}
      </b-button>
    </b-form>
    <EnterKeyModal :show="modalShow" :accounts="[form.from]" @closed="hideModal" @entered="keyEntered" />
  </div>

</template>

<script lang="ts">
  export default {
    components: { DatePicker },
    data() {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 1)
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + 8)
      const d_plac = deadline.toISOString().split("T")[0]
      const e_plac = expiration.toISOString().split("T")[0]
      return {
        form: {
          from: "",
          to: "",
          agent: "",
          amount: "10",
          amount_cur: "GOLOS",
          fee: "1",
          fee_cur: "GOLOS",
          json_meta: "",
          deadline,
          d_plac,
          expiration,
          e_plac,
        },
        modalShow: false,
        process: false as boolean | any[],
        displayError: "",
      }
    },
    methods: {
      onSubmit(event: any) {
        event.preventDefault()
        this.displayError = ""
        this.modalShow = true
        this.process = ["submit"]
      },
      hideModal() {
        this.modalShow = false
        this.process = false
      },
      async keyEntered(key: string) {
        const { form } = this
        this.displayError = ""
        this.process = ["id"]
        let id = 1
        for (; id < 200; id < 10 ? ++id : id += 10) {
          try {
            const escrow = await golos.api.getEscrowAsync(form.from, id)
            if (escrow == null) break
          } catch (err) {
            alert("Не могу подключиться к ноде.")
            this.process = false
            return
          }
        }

        this.process = ["placing", id]

        try {
          let sbd_amount = "0.000 GBG"
          let steem_amount = "0.000 GOLOS"
          if (form.amount_cur === "GBG") {
            sbd_amount = parseFloat(form.amount).toFixed(3) + " GBG"
          } else {
            steem_amount = parseFloat(form.amount).toFixed(3) + " GOLOS"
          }

          let fee = "0.000 GOLOS"
          if (form.fee && parseFloat(form.fee)) {
             fee = parseFloat(form.fee).toFixed(3) + " " + form.fee_cur
          }

          await golos.broadcast.escrowTransferAsync(key, form.from, form.to, form.agent, id, sbd_amount, steem_amount,
            fee, form.deadline, form.expiration, form.json_meta)

          this.process = false
          alert("Успешно создано! Запомните ID вашей escrow: " + id + ". НЕ ПОТЕРЯЙТЕ ЕГО. Лучше запишите.")
        } catch (err) {
          console.error("trx", err)
          this.process = false
          const errorString = JSON.stringify(err)
          if (errorString.includes("agent must be a third party")) {
            this.displayError = "agent должен быть другим лицом, а не from или to."
            return
          }
          if (errorString.includes("Account does not have sufficient funds")) {
            this.displayError = "Недостаточно средств. Сумма (плюс Комиссия) должна быть на вашем балансе, чтобы Блокчейн заморозил ее сейчас."
            return
          }
          this.displayError = errorString
        }
      }
    }
  }
</script>
