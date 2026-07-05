<template>
    <div>
        <div v-for="(board, index) of boardsWithAxes" :key="board.key">
            <v-divider v-if="index" class="my-2" />
            <div class="px-6">
                <strong v-if="boardsWithAxes.length > 1" class="d-block mb-2">{{ board.name }}</strong>
                <odrive-axis-calibration v-for="axis in board.axes" :key="axis.key" :axis="axis" class="mb-3" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import OdriveAxisCalibration from '@/components/panels/Odrive/OdriveAxisCalibration.vue'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveAxisCalibration },
})
export default class OdriveCalibrationList extends Mixins(BaseMixin) {
    @Prop({ type: Array, required: true }) declare readonly boards: PrinterStateOdrive[]

    get boardsWithAxes(): PrinterStateOdrive[] {
        return this.boards.filter((board) => board.axes.length > 0)
    }
}
</script>
