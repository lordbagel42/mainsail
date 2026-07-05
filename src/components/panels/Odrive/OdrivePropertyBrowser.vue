<template>
    <div class="odrive-property-browser">
        <v-row no-gutters align="center" class="mb-1">
            <v-col class="text-body-2 text--disabled">
                {{ $t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.Hint') }}
            </v-col>
            <v-col class="col-auto">
                <v-btn small text color="primary" :loading="refreshingAll" @click="refreshAll">
                    <v-icon small class="mr-1">{{ mdiRefresh }}</v-icon>
                    {{ $t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.RefreshAll') }}
                </v-btn>
            </v-col>
        </v-row>
        <v-simple-table dense class="odrive-property-browser-table">
            <thead>
                <tr>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.ColumnCategory') }}</th>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.ColumnProperty') }}</th>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.ColumnValue') }}</th>
                    <th class="text-right">&nbsp;</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="row.property">
                    <td class="text-no-wrap">{{ categoryLabel(row) }}</td>
                    <td class="text-no-wrap">
                        <code>{{ row.property }}</code>
                    </td>
                    <td class="text-no-wrap">{{ displayValue(row) }}</td>
                    <td class="text-right">
                        <v-btn icon small :loading="row.loading" @click="refreshRow(row)">
                            <v-icon small>{{ mdiRefresh }}</v-icon>
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiRefresh } from '@mdi/js'
import type { PrinterStateOdrive } from '@/store/printer/types'

type OdrivePropertyCategory = 'board' | 'motor' | 'encoder' | 'controller' | 'safety' | 'state'

interface OdrivePropertyRow {
    property: string
    category: OdrivePropertyCategory
    axisIndex: number | null
    value: string | null
    connected: boolean | null
    loading: boolean
    failed: boolean
}

// Raw ODrive firmware property suffixes (dotted, relative to "axisN.") to read
// for each configured axis, one call per row via odrive/property_read (see
// src/types/moonraker/OdriveRPC.ts) - there is no bulk/enumeration endpoint,
// so this is deliberately a hand-picked subset covering each config category
// rather than an exhaustive dump. Paths mirror what
// klippy/extras/odrive/axis.py itself reads/writes during calibration and
// tuning (motor/encoder/controller config) plus a couple of live-state
// fields, cross-referenced against the "[odrive_axis]" config reference in
// docs/ODrive_Implementation_Spec.md.
const AXIS_PROPERTY_SUFFIXES: { category: OdrivePropertyCategory; suffix: string }[] = [
    { category: 'motor', suffix: 'motor.config.pole_pairs' },
    { category: 'motor', suffix: 'motor.config.current_lim' },
    { category: 'motor', suffix: 'motor.config.motor_type' },
    { category: 'encoder', suffix: 'encoder.config.cpr' },
    { category: 'encoder', suffix: 'encoder.config.use_index' },
    { category: 'controller', suffix: 'controller.config.pos_gain' },
    { category: 'controller', suffix: 'controller.config.vel_gain' },
    { category: 'controller', suffix: 'controller.config.vel_limit' },
    { category: 'safety', suffix: 'motor.fet_thermistor.temperature' },
    { category: 'state', suffix: 'current_state' },
    { category: 'state', suffix: 'motor.current_control.Iq_measured' },
]

// Board-scope (no "axisN." prefix) raw properties.
const BOARD_PROPERTIES: { category: OdrivePropertyCategory; property: string }[] = [
    { category: 'board', property: 'vbus_voltage' },
    { category: 'board', property: 'error' },
]

@Component
export default class OdrivePropertyBrowser extends Mixins(BaseMixin) {
    mdiRefresh = mdiRefresh

    @Prop({ type: Object, required: true }) declare readonly board: PrinterStateOdrive

    rows: OdrivePropertyRow[] = []
    refreshingAll = false

    created() {
        this.rows = this.buildRows()
    }

    // ODrive v3.6 boards expose at most two motors (M0/M1, i.e. "axis0"/
    // "axis1" in the firmware's own property tree). The axis_index chosen
    // per [odrive_axis] section isn't surfaced through get_status(), so
    // this can't be derived from board.axes - it shows axis0 always, and
    // axis1 only when a second axis is configured on this board (a
    // reasonable proxy, since almost nobody configures axis1 without axis0).
    buildRows(): OdrivePropertyRow[] {
        const rows: OdrivePropertyRow[] = BOARD_PROPERTIES.map((entry) => ({
            property: entry.property,
            category: entry.category,
            axisIndex: null,
            value: null,
            connected: null,
            loading: false,
            failed: false,
        }))

        const axisCount = Math.min(Math.max(this.board.axes.length, 1), 2)

        for (let axisIndex = 0; axisIndex < axisCount; axisIndex++) {
            AXIS_PROPERTY_SUFFIXES.forEach((entry) => {
                rows.push({
                    property: `axis${axisIndex}.${entry.suffix}`,
                    category: entry.category,
                    axisIndex,
                    value: null,
                    connected: null,
                    loading: false,
                    failed: false,
                })
            })
        }

        return rows
    }

    categoryLabel(row: OdrivePropertyRow): string {
        const category = this.$t(`Panels.OdrivePanel.Diagnostics.Category.${this.capitalize(row.category)}`)
        if (row.axisIndex === null) return category as string

        return `${this.$t('Panels.OdrivePanel.Diagnostics.AxisLabel', { index: row.axisIndex })} · ${category}`
    }

    capitalize(value: string): string {
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    displayValue(row: OdrivePropertyRow): string {
        if (row.loading) return '…'
        if (row.failed) return this.$t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.ReadFailed') as string
        if (row.connected === null) return '–'
        if (!row.connected) return '–'
        if (row.value === null) return '–'

        return row.value
    }

    async refreshRow(row: OdrivePropertyRow) {
        row.loading = true
        row.failed = false

        try {
            const result = await this.$store.dispatch('printer/readOdriveProperty', {
                board: this.board.name,
                property: row.property,
            })

            row.value = result.value
            row.connected = result.connected
        } catch {
            row.failed = true
            row.value = null
            row.connected = null
        } finally {
            row.loading = false
        }
    }

    async refreshAll() {
        this.refreshingAll = true

        try {
            await Promise.all(this.rows.map((row) => this.refreshRow(row)))
        } finally {
            this.refreshingAll = false
        }
    }
}
</script>

<style scoped>
.odrive-property-browser-table code {
    background: transparent;
    padding: 0;
    box-shadow: none;
}
</style>
