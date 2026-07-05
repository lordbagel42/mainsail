<template>
    <div>
        <div v-for="(board, index) of boards" :key="board.key">
            <v-divider v-if="index" class="my-2" />
            <div class="px-6">
                <strong v-if="boards.length > 1" class="d-block mb-2">{{ board.name }}</strong>
                <odrive-repl :board="board" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import OdriveRepl from '@/components/panels/Odrive/OdriveRepl.vue'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveRepl },
})
export default class OdriveReplList extends Mixins(BaseMixin) {
    @Prop({ type: Array, required: true }) declare readonly boards: PrinterStateOdrive[]
}
</script>
