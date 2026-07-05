<template>
    <div>
        <div v-for="(board, index) of boards" :key="board.key">
            <v-divider v-if="index" class="my-2" />
            <odrive-board-diagnostics :board="board" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import OdriveBoardDiagnostics from '@/components/panels/Odrive/OdriveBoardDiagnostics.vue'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveBoardDiagnostics },
})
export default class OdriveDiagnosticsList extends Mixins(BaseMixin) {
    @Prop({ type: Array, required: true }) declare readonly boards: PrinterStateOdrive[]
}
</script>
