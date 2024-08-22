<script setup lang="ts">
import { ref } from "vue"
import type { Ref } from "vue"
import { useRoute } from "vue-router"
import golos from "golos-lib-js"

const DEF_CHAIN_ID = "782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12"

const defSettings = { chain_id: DEF_CHAIN_ID }

const GOLOS_NODES = [
  { url: "https://golos.lexai.host", ...defSettings },
  { url: "https://api-full.golos.id", ...defSettings },
  { url: "https://api.aleksw.space", ...defSettings },
  { url: "https://api-golos.blckchnd.com", ...defSettings },
  { url: "https://apibeta.golos.today", ...defSettings }
]

let currentNode: Ref<any> = ref("")

function setNode(node: any) {
  const url = node.url
  currentNode.value = node
  console.log("Node is set to ", url, node.chain_id)
  golos.config.set("websocket", url)
  golos.config.set("chain_id", node.chain_id)
  localStorage.setItem("node", url)
}

let loadedNode: any = localStorage.getItem("node")
loadedNode = loadedNode && GOLOS_NODES.find(n => n.url === loadedNode)
loadedNode = loadedNode || GOLOS_NODES[0]
setNode(loadedNode)

const route = useRoute()
</script>

<template>
  <b-navbar toggleable="lg" variant="info" v-b-color-mode="'dark'">
    <b-navbar-brand to="/">Golos Escrow UI</b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown :text="currentNode.url" right>
          <b-dropdown-item v-for="node in GOLOS_NODES" href="#" @click="setNode(node)">{{ node.url }}</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>

      <b-navbar-nav>
        <b-nav-item v-if="route.name !== 'transfer'" to="/transfer">Создать Escrow</b-nav-item>
         <b-nav-item v-else to="/">Проверить Escrow</b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>
