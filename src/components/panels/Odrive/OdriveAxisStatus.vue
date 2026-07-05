<template>
    <div class="odrive-axis-status">
        <v-row class="py-0" no-gutters>
            <v-col class="pb-1">
                <span class="text-no-wrap mr-2">{{ axis.name }}</span>
                <v-chip small label class="mr-1 mb-1" :color="stateColor" text-color="white">
                    {{ stateText }}
                </v-chip>
                <v-chip small label outlined class="mr-1 mb-1" :color="axis.armed ? 'success' : ''">
                    {{ axis.armed ? $t('Panels.OdrivePanel.Axis.Armed') : $t('Panels.OdrivePanel.Axis.Disarmed') }}
                </v-chip>
                <v-chip small label outlined class="mb-1" :color="axis.calibrated ? 'success' : 'warning'">
                    {{
                        axis.calibrated
                            ? $t('Panels.OdrivePanel.Axis.Calibrated')
                            : $t('Panels.OdrivePanel.Axis.NotCalibrated')
                    }}
                </v-chip>
            </v-col>
        </v-row>
        <v-row class="py-0" no-gutters>
            <v-col class="pt-0 pb-1 text-body-2">
                <div class="text-no-wrap">
                    {{
                        $t('Panels.OdrivePanel.Axis.Position', {
                            pos: formatNumber(axis.pos_estimate, 3),
                            vel: formatNumber(axis.vel_estimate, 3),
                        })
                    }}
                </div>
                <div>
                    <span class="text-no-wrap mr-3">
                        {{ $t('Panels.OdrivePanel.Axis.PosError', { value: formatNumber(axis.pos_error, 3) }) }}
                    </span>
                    <span class="text-no-wrap mr-3">
                        {{
                            $t('Panels.OdrivePanel.Axis.Current', {
                                measured: formatNumber(axis.iq_measured, 2),
                                setpoint: formatNumber(axis.iq_setpoint, 2),
                            })
                        }}
                    </span>
                    <span class="text-no-wrap">
                        {{
                            $t('Panels.OdrivePanel.Axis.Temperature', {
                                fet: formatNumber(axis.fet_temp, 1),
                                motor: formatNumber(axis.motor_temp, 1),
                            })
                        }}
                    </span>
                </div>
            </v-col>
        </v-row>
        <v-row v-if="flatErrors.length" class="py-0" no-gutters>
            <v-col class="pt-0 pb-1">
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
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { convertName } from '@/plugins/helpers'
import type { PrinterStateOdriveAxis } from '@/store/printer/types'

@Component
export default class OdriveAxisStatus extends Mixins(BaseMixin) {
    convertName = convertName

    @Prop({ type: Object, required: true }) declare readonly axis: PrinterStateOdriveAxis

    formatNumber(value: number | null, decimals: number): string {
        if (value === null || value === undefined) return '–'

        return value.toFixed(decimals)
    }

    get flatErrors(): string[] {
        const errors = this.axis.errors ?? { axis: [], motor: [], encoder: [], controller: [] }

        return [...errors.axis, ...errors.motor, ...errors.encoder, ...errors.controller]
    }

    get stateColor(): string {
        if (this.flatErrors.length) return 'error'

        switch (this.axis.axis_state) {
            case 'closed_loop_control':
                return 'success'
            case 'idle':
                return 'grey'
            case null:
            case undefined:
                return 'grey'
            default:
                return 'info'
        }
    }

    get stateText() {
        if (!this.axis.axis_state) return this.$t('Panels.OdrivePanel.Axis.UnknownState')

        return convertName(this.axis.axis_state)
    }
}
</script>
