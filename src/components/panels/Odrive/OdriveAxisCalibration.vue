<template>
    <v-card outlined class="odrive-axis-calibration">
        <v-card-title class="text-body-1 py-2">
            <span class="text-no-wrap mr-2">{{ axis.name }}</span>
            <v-chip small label :color="statusColor" text-color="white">{{ statusText }}</v-chip>
        </v-card-title>
        <v-card-text class="pt-0">
            <v-stepper :value="stepperValue" flat class="odrive-calibration-stepper elevation-0">
                <v-stepper-header>
                    <v-stepper-step :complete="axis.pre_calibrated_motor" step="1">
                        {{ $t('Panels.OdrivePanel.Calibration.StepMotor') }}
                    </v-stepper-step>
                    <v-divider />
                    <v-stepper-step :complete="axis.pre_calibrated_encoder" step="2">
                        {{ $t('Panels.OdrivePanel.Calibration.StepEncoder') }}
                    </v-stepper-step>
                    <v-divider />
                    <v-stepper-step :complete="axis.calibrated" step="3">
                        {{ $t('Panels.OdrivePanel.Calibration.StepDone') }}
                    </v-stepper-step>
                </v-stepper-header>
            </v-stepper>

            <v-row no-gutters class="mt-2">
                <v-col>
                    <v-chip small outlined label class="mr-1 mb-1" :color="axis.pre_calibrated_motor ? 'success' : ''">
                        {{
                            axis.pre_calibrated_motor
                                ? $t('Panels.OdrivePanel.Calibration.MotorCalibrated')
                                : $t('Panels.OdrivePanel.Calibration.MotorNotCalibrated')
                        }}
                    </v-chip>
                    <v-chip
                        small
                        outlined
                        label
                        class="mr-1 mb-1"
                        :color="axis.pre_calibrated_encoder ? 'success' : ''">
                        {{
                            axis.pre_calibrated_encoder
                                ? $t('Panels.OdrivePanel.Calibration.EncoderCalibrated')
                                : $t('Panels.OdrivePanel.Calibration.EncoderNotCalibrated')
                        }}
                    </v-chip>
                    <v-chip small outlined label class="mb-1" :color="axis.index_found ? 'success' : ''">
                        {{
                            axis.index_found
                                ? $t('Panels.OdrivePanel.Calibration.IndexFound')
                                : $t('Panels.OdrivePanel.Calibration.IndexNotFound')
                        }}
                    </v-chip>
                </v-col>
            </v-row>

            <v-row v-if="flatErrors.length" no-gutters class="mt-1">
                <v-col>
                    <v-chip
                        v-for="error in flatErrors"
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

            <v-row no-gutters class="mt-2" align="center">
                <v-col class="col-auto">
                    <v-btn small color="primary" :disabled="startDisabled" @click="startCalibration">
                        <v-icon small class="mr-1">{{ mdiPlayCircleOutline }}</v-icon>
                        {{ $t('Panels.OdrivePanel.Calibration.Start') }}
                    </v-btn>
                </v-col>
                <v-col v-if="startDisabledReason" class="text-body-2 text--disabled">
                    {{ startDisabledReason }}
                </v-col>
            </v-row>

            <v-expansion-panels flat tile class="mt-3">
                <v-expansion-panel>
                    <v-expansion-panel-header class="px-0">
                        {{ $t('Panels.OdrivePanel.Calibration.ConsoleOutput') }}
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <console-table :events="consoleEvents" :is-mini="true" />
                        <div class="text-right mt-1">
                            <router-link to="/console">
                                {{ $t('Panels.OdrivePanel.Calibration.OpenConsole') }}
                            </router-link>
                        </div>
                    </v-expansion-panel-content>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import ControlMixin from '@/components/mixins/control'
import ConsoleTable from '@/components/console/ConsoleTable.vue'
import { convertName } from '@/plugins/helpers'
import { mdiPlayCircleOutline } from '@mdi/js'
import type { PrinterStateOdriveAxis } from '@/store/printer/types'
import type { ServerStateEvent } from '@/store/server/types'

@Component({
    components: { ConsoleTable },
})
export default class OdriveAxisCalibration extends Mixins(BaseMixin, ControlMixin) {
    mdiPlayCircleOutline = mdiPlayCircleOutline
    convertName = convertName

    @Prop({ type: Object, required: true }) declare readonly axis: PrinterStateOdriveAxis

    get flatErrors(): string[] {
        const errors = this.axis.errors ?? { axis: [], motor: [], encoder: [], controller: [] }

        return [...errors.axis, ...errors.motor, ...errors.encoder, ...errors.controller]
    }

    // the on-device axis_state is "idle" whenever the axis is neither armed nor
    // running a calibration sequence - anything else (calibration substates,
    // closed-loop control, homing, ...) means ODRIVE_CALIBRATE would currently be
    // refused server-side, so treat it as busy for the purposes of this button.
    get isBusy(): boolean {
        return !!this.axis.axis_state && this.axis.axis_state !== 'idle'
    }

    get startDisabled(): boolean {
        return this.isBusy || this.flatErrors.length > 0
    }

    get startDisabledReason() {
        if (this.flatErrors.length) return this.$t('Panels.OdrivePanel.Calibration.DisabledErrors')
        if (this.isBusy) return this.$t('Panels.OdrivePanel.Calibration.DisabledBusy')

        return null
    }

    get stepperValue(): number {
        if (this.axis.calibrated) return 3
        if (this.axis.pre_calibrated_motor) return 2

        return 1
    }

    get statusColor(): string {
        if (this.flatErrors.length) return 'error'
        if (this.axis.calibrated) return 'success'
        if (this.isBusy) return 'info'

        return 'warning'
    }

    get statusText() {
        if (this.axis.calibrated) return this.$t('Panels.OdrivePanel.Axis.Calibrated')
        if (this.isBusy) return convertName(this.axis.axis_state as string)

        return this.$t('Panels.OdrivePanel.Axis.NotCalibrated')
    }

    // fallback detail view for anyone who wants the raw progress lines - filters
    // the shared console log down to ODRIVE_* output and anything mentioning this
    // axis, so the wizard doesn't need its own separate log storage.
    get consoleEvents(): ServerStateEvent[] {
        const events: ServerStateEvent[] = this.$store.getters['server/getConsoleEvents'](true, 300)
        const needle = this.axis.name.toLowerCase()

        return events
            .filter((event) => {
                const message = event.message.toLowerCase()

                return message.includes('odrive') || message.includes(needle)
            })
            .slice(0, 50)
    }

    startCalibration() {
        this.doSend(`ODRIVE_CALIBRATE AXIS=${this.axis.name} TYPE=full`)
    }
}
</script>
