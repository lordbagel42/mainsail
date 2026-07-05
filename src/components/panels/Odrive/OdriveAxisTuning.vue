<template>
    <v-card outlined class="odrive-axis-tuning">
        <v-card-title class="text-body-1 py-2">
            <span class="text-no-wrap mr-2">{{ axis.name }}</span>
            <v-spacer />
            <v-btn small text color="primary" @click="save">
                <v-icon small class="mr-1">{{ mdiContentSave }}</v-icon>
                {{ $t('Panels.OdrivePanel.Tuning.Save') }}
            </v-btn>
        </v-card-title>
        <v-card-text class="pt-0">
            <v-row dense>
                <v-col cols="12" sm="6" md="4">
                    <number-input
                        :label="$t('Panels.OdrivePanel.Tuning.PosGain')"
                        param="POS_GAIN"
                        :target="posGain"
                        :min="0.1"
                        :max="null"
                        :step="0.1"
                        :dec="2"
                        @submit="sendTune" />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                    <number-input
                        :label="$t('Panels.OdrivePanel.Tuning.VelGain')"
                        param="VEL_GAIN"
                        :target="velGain"
                        :min="0.001"
                        :max="null"
                        :step="0.001"
                        :dec="4"
                        @submit="sendTune" />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                    <number-input
                        :label="$t('Panels.OdrivePanel.Tuning.VelIntegratorGain')"
                        param="VEL_INTEGRATOR_GAIN"
                        :target="velIntegratorGain"
                        :min="0"
                        :max="null"
                        :step="0.001"
                        :dec="4"
                        @submit="sendTune" />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                    <number-input
                        :label="$t('Panels.OdrivePanel.Tuning.FilterBandwidth')"
                        param="FILTER_BANDWIDTH"
                        :target="filterBandwidth"
                        :min="1"
                        :max="null"
                        :step="1"
                        :dec="1"
                        unit="Hz"
                        @submit="sendTune" />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                    <number-input
                        :label="$t('Panels.OdrivePanel.Tuning.CurrentLim')"
                        param="CURRENT_LIM"
                        :target="currentLim"
                        :min="0.1"
                        :max="null"
                        :step="0.1"
                        :dec="1"
                        unit="A"
                        @submit="sendTune" />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                    <number-input
                        :label="$t('Panels.OdrivePanel.Tuning.VelLimit')"
                        param="VEL_LIMIT"
                        :target="velLimit"
                        :min="0.1"
                        :max="null"
                        :step="0.1"
                        :dec="2"
                        unit="mm/s"
                        @submit="sendTune" />
                </v-col>
            </v-row>

            <v-divider class="my-3" />

            <odrive-axis-telemetry-chart :axis="axis" />
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import BaseMixin from '@/components/mixins/base'
import ControlMixin from '@/components/mixins/control'
import NumberInput from '@/components/inputs/NumberInput.vue'
import OdriveAxisTelemetryChart from '@/components/panels/Odrive/OdriveAxisTelemetryChart.vue'
import { mdiContentSave } from '@mdi/js'
import type { PrinterStateOdriveAxis } from '@/store/printer/types'

@Component({
    components: { NumberInput, OdriveAxisTelemetryChart },
})
export default class OdriveAxisTuning extends Mixins(BaseMixin, ControlMixin) {
    mdiContentSave = mdiContentSave

    @Prop({ type: Object, required: true }) declare readonly axis: PrinterStateOdriveAxis

    get posGain(): number {
        return this.axis.pos_gain ?? 0
    }

    get velGain(): number {
        return this.axis.vel_gain ?? 0
    }

    get velIntegratorGain(): number {
        return this.axis.vel_integrator_gain ?? 0
    }

    get filterBandwidth(): number {
        return this.axis.filter_bandwidth ?? 0
    }

    get currentLim(): number {
        return this.axis.current_lim ?? 0
    }

    get velLimit(): number {
        return this.axis.vel_limit ?? 0
    }

    // debounced so rapid spinner clicks (or several fields edited in quick
    // succession) don't each fire their own ODRIVE_TUNE round-trip - the same
    // granularity Panels/Extruder/PressureAdvanceSettings.vue already uses
    // for its own gain-tuning inputs.
    @Debounce(400)
    sendTune(params: { name: string; value: number }) {
        this.doSend(`ODRIVE_TUNE AXIS=${this.axis.name} ${params.name}=${params.value}`)
    }

    // persists whatever is currently live-applied on this axis into
    // printer.cfg via configfile.set - surfaces Mainsail's existing
    // save_config_pending banner, same as the M2 calibration wizard.
    save() {
        const gcode =
            `ODRIVE_TUNE AXIS=${this.axis.name}` +
            ` POS_GAIN=${this.posGain}` +
            ` VEL_GAIN=${this.velGain}` +
            ` VEL_INTEGRATOR_GAIN=${this.velIntegratorGain}` +
            ` FILTER_BANDWIDTH=${this.filterBandwidth}` +
            ` CURRENT_LIM=${this.currentLim}` +
            ` VEL_LIMIT=${this.velLimit}` +
            ` SAVE=1`

        this.doSend(gcode)
    }
}
</script>
