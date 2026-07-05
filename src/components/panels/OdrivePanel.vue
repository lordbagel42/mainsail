<template>
    <panel
        v-if="showPanel"
        :title="$t('Panels.OdrivePanel.Headline')"
        :icon="mdiEngineOutline"
        :collapsible="true"
        card-class="odrive-panel">
        <v-card-text class="px-0 py-2">
            <div v-for="(board, index) of boards" :key="board.key">
                <v-divider v-if="index" class="my-2" />
                <v-row class="px-6 py-0" no-gutters>
                    <v-col class="pb-1">
                        <strong>{{ board.name }}</strong>
                        <v-chip small label class="float-right ml-2" :color="stateColor(board)" text-color="white">
                            {{ stateText(board) }}
                        </v-chip>
                    </v-col>
                </v-row>
                <v-row
                    v-if="board.fw_version || board.hw_version || board.vbus_voltage !== null"
                    class="px-6 py-0"
                    no-gutters>
                    <v-col class="pt-0 pb-1 text-body-2">
                        <span v-if="board.fw_version" class="text-no-wrap mr-3">
                            {{ $t('Panels.OdrivePanel.FwVersion', { version: board.fw_version }) }}
                        </span>
                        <span v-if="board.hw_version" class="text-no-wrap mr-3">
                            {{ $t('Panels.OdrivePanel.HwVersion', { version: board.hw_version }) }}
                        </span>
                        <span v-if="board.vbus_voltage !== null" class="text-no-wrap">
                            {{ $t('Panels.OdrivePanel.VbusVoltage', { voltage: formatNumber(board.vbus_voltage, 1) }) }}
                        </span>
                    </v-col>
                </v-row>
                <v-row v-for="axis in board.axes" :key="axis.key" class="px-6 py-0" no-gutters>
                    <v-col class="pt-0 pb-1 text-body-2 d-flex align-center flex-wrap">
                        <span class="text-no-wrap mr-2">{{ axis.name }}</span>
                        <v-chip small label class="mr-1 mb-1" :color="axisStateColor(axis)" text-color="white">
                            {{ axisStateText(axis) }}
                        </v-chip>
                        <v-tooltip top>
                            <template #activator="{ on, attrs }">
                                <v-icon
                                    small
                                    class="mr-1 mb-1"
                                    :color="axis.armed ? 'success' : 'grey'"
                                    v-bind="attrs"
                                    :aria-label="
                                        axis.armed
                                            ? $t('Panels.OdrivePanel.Axis.Armed')
                                            : $t('Panels.OdrivePanel.Axis.Disarmed')
                                    "
                                    v-on="on">
                                    {{ axis.armed ? mdiLockOutline : mdiLockOpenVariantOutline }}
                                </v-icon>
                            </template>
                            <span>
                                {{
                                    axis.armed
                                        ? $t('Panels.OdrivePanel.Axis.Armed')
                                        : $t('Panels.OdrivePanel.Axis.Disarmed')
                                }}
                            </span>
                        </v-tooltip>
                        <v-tooltip top>
                            <template #activator="{ on, attrs }">
                                <v-icon
                                    small
                                    class="mr-1 mb-1"
                                    :color="axis.calibrated ? 'success' : 'warning'"
                                    v-bind="attrs"
                                    :aria-label="
                                        axis.calibrated
                                            ? $t('Panels.OdrivePanel.Axis.Calibrated')
                                            : $t('Panels.OdrivePanel.Axis.NotCalibrated')
                                    "
                                    v-on="on">
                                    {{ axis.calibrated ? mdiCheckCircleOutline : mdiAlertCircleOutline }}
                                </v-icon>
                            </template>
                            <span>
                                {{
                                    axis.calibrated
                                        ? $t('Panels.OdrivePanel.Axis.Calibrated')
                                        : $t('Panels.OdrivePanel.Axis.NotCalibrated')
                                }}
                            </span>
                        </v-tooltip>
                        <v-chip v-if="axisErrorCount(axis)" small label color="error" text-color="white" class="mb-1">
                            {{
                                $tc('Panels.OdrivePanel.Axis.ErrorCount', axisErrorCount(axis), {
                                    count: axisErrorCount(axis),
                                })
                            }}
                        </v-chip>
                    </v-col>
                </v-row>
            </div>
        </v-card-text>
    </panel>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '../mixins/base'
import Panel from '@/components/ui/Panel.vue'
import {
    mdiAlertCircleOutline,
    mdiCheckCircleOutline,
    mdiEngineOutline,
    mdiLockOpenVariantOutline,
    mdiLockOutline,
} from '@mdi/js'
import { convertName } from '@/plugins/helpers'
import type { PrinterStateOdrive, PrinterStateOdriveAxis } from '@/store/printer/types'

/**
 * Dashboard summary card for configured ODrive boards.
 *
 * This is intentionally a high-level, glanceable summary - per board it shows
 * the connection-state badge, firmware/hardware version and bus voltage, and
 * a single line per configured axis with a compact state indicator (plus an
 * error-count badge when an axis has active errors). It deliberately omits
 * per-axis numeric telemetry (position/velocity/current/temperature/gains)
 * and the full decoded error list - that detail lives exclusively on the
 * dedicated ODrive page (see pages/Odrive.vue + OdriveBoardStatus.vue /
 * OdriveAxisStatus.vue).
 */
@Component({
    components: { Panel },
})
export default class OdrivePanel extends Mixins(BaseMixin) {
    mdiEngineOutline = mdiEngineOutline
    mdiLockOutline = mdiLockOutline
    mdiLockOpenVariantOutline = mdiLockOpenVariantOutline
    mdiCheckCircleOutline = mdiCheckCircleOutline
    mdiAlertCircleOutline = mdiAlertCircleOutline

    get boards(): PrinterStateOdrive[] {
        return this.$store.getters['printer/getOdriveBoards'] ?? []
    }

    // in addition to the dashboard layout gating (see gui/getAllPossiblePanels),
    // check the board list directly - this mirrors the pattern used by the mmu/afc
    // panels and keeps this component inert on its own if it is ever rendered
    // outside of the normal dashboard layout.
    get showPanel(): boolean {
        return this.klipperReadyForGui && this.boards.length > 0
    }

    formatNumber(value: number | null, decimals: number): string {
        if (value === null || value === undefined) return '–'

        return value.toFixed(decimals)
    }

    // Same state -> color mapping used by OdriveBoardStatus.vue on the full
    // detail page, kept in sync deliberately so the badge means the same
    // thing in both places.
    stateColor(board: PrinterStateOdrive): string {
        if (board.errors.length) return 'error'

        switch (board.state) {
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

    stateText(board: PrinterStateOdrive) {
        switch (board.state) {
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
                return convertName(board.state)
        }
    }

    // Flattened axis error list - same shape used by OdriveAxisStatus.vue on the
    // detail page. Only the count is surfaced here; the individual error names
    // stay on the dedicated ODrive page.
    flatErrors(axis: PrinterStateOdriveAxis): string[] {
        const errors = axis.errors ?? { axis: [], motor: [], encoder: [], controller: [] }

        return [...errors.axis, ...errors.motor, ...errors.encoder, ...errors.controller]
    }

    axisErrorCount(axis: PrinterStateOdriveAxis): number {
        return this.flatErrors(axis).length
    }

    // Same state -> color mapping used by OdriveAxisStatus.vue, kept in sync
    // deliberately so the badge means the same thing in both places.
    axisStateColor(axis: PrinterStateOdriveAxis): string {
        if (this.flatErrors(axis).length) return 'error'

        switch (axis.axis_state) {
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

    axisStateText(axis: PrinterStateOdriveAxis) {
        if (!axis.axis_state) return this.$t('Panels.OdrivePanel.Axis.UnknownState')

        return convertName(axis.axis_state)
    }
}
</script>
