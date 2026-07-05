<template>
    <div class="px-6">
        <v-row class="py-0" no-gutters>
            <v-col class="pb-1">
                <strong>{{ board.name }}</strong>
                <v-chip small label class="float-right ml-2" :color="stateColor" text-color="white">
                    {{ stateText }}
                </v-chip>
            </v-col>
        </v-row>
        <v-row v-if="board.hw_version || board.fw_version || board.serial_number" class="py-0" no-gutters>
            <v-col class="pt-0 pb-1 text-body-2">
                <span v-if="board.hw_version" class="text-no-wrap mr-3">
                    {{ $t('Panels.OdrivePanel.HwVersion', { version: board.hw_version }) }}
                </span>
                <span v-if="board.fw_version" class="text-no-wrap mr-3">
                    {{ $t('Panels.OdrivePanel.FwVersion', { version: board.fw_version }) }}
                </span>
                <span v-if="board.serial_number" class="text-no-wrap">
                    {{ $t('Panels.OdrivePanel.SerialNumber', { serial: board.serial_number }) }}
                </span>
            </v-col>
        </v-row>
        <v-row v-if="board.vbus_voltage !== null" class="py-0" no-gutters>
            <v-col class="pt-0 pb-1 text-body-2 text-no-wrap">
                {{ $t('Panels.OdrivePanel.VbusVoltage', { voltage: formatNumber(board.vbus_voltage, 1) }) }}
            </v-col>
        </v-row>
        <v-row v-if="board.errors.length" class="py-0" no-gutters>
            <v-col class="pt-0 pb-1">
                <v-chip
                    v-for="error in board.errors"
                    :key="error"
                    small
                    label
                    color="error"
                    text-color="white"
                    class="mr-1 mb-1">
                    {{ convertName(error) }}
                </v-chip>
            </v-col>
        </v-row>
        <odrive-axis-status v-for="axis in board.axes" :key="axis.key" :axis="axis" class="mt-2" />
        <v-row v-if="board.axes.length === 0" class="py-0" no-gutters>
            <v-col class="pt-0 pb-1 text-body-2">
                {{ $t('Panels.OdrivePanel.NoAxes') }}
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import OdriveAxisStatus from '@/components/panels/Odrive/OdriveAxisStatus.vue'
import { convertName } from '@/plugins/helpers'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveAxisStatus },
})
export default class OdriveBoardStatus extends Mixins(BaseMixin) {
    convertName = convertName

    @Prop({ type: Object, required: true }) declare readonly board: PrinterStateOdrive

    formatNumber(value: number | null, decimals: number): string {
        if (value === null || value === undefined) return '–'

        return value.toFixed(decimals)
    }

    get stateColor(): string {
        if (this.board.errors.length) return 'error'

        switch (this.board.state) {
            case 'ready':
                return 'success'
            case 'probing':
            case 'configuring':
                return 'info'
            case 'reboot_pending':
                return 'warning'
            case 'lost':
                return 'error'
            case 'disconnected':
            default:
                return 'grey'
        }
    }

    get stateText() {
        switch (this.board.state) {
            case 'probing':
                return this.$t('Panels.OdrivePanel.State.Probing')
            case 'configuring':
                return this.$t('Panels.OdrivePanel.State.Configuring')
            case 'ready':
                return this.$t('Panels.OdrivePanel.State.Ready')
            case 'reboot_pending':
                return this.$t('Panels.OdrivePanel.State.RebootPending')
            case 'lost':
                return this.$t('Panels.OdrivePanel.State.Lost')
            case 'disconnected':
                return this.$t('Panels.OdrivePanel.State.Disconnected')
            default:
                return convertName(this.board.state)
        }
    }
}
</script>
