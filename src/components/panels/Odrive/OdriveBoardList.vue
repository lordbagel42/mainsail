<template>
    <div>
        <div v-for="(board, index) of boards" :key="board.key">
            <v-divider v-if="index" class="my-2" />
            <odrive-board-status :board="board" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import OdriveBoardStatus from '@/components/panels/Odrive/OdriveBoardStatus.vue'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveBoardStatus },
})
export default class OdriveBoardList extends Mixins(BaseMixin) {
    @Prop({ type: Array, required: true }) declare readonly boards: PrinterStateOdrive[]
}
</script>
