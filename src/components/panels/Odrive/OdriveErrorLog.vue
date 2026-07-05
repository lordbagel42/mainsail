<template>
    <div class="odrive-error-log">
        <v-row no-gutters align="center" class="mb-1">
            <v-col class="text-body-2 text--disabled">
                {{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.Hint') }}
            </v-col>
            <v-col class="col-auto">
                <v-btn small text color="error" :disabled="!entries.length" @click="clearLog">
                    <v-icon small class="mr-1">{{ mdiDeleteSweep }}</v-icon>
                    {{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.ClearLog') }}
                </v-btn>
            </v-col>
        </v-row>

        <v-alert v-if="!entries.length" dense text type="info" class="mb-0">
            {{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.Empty') }}
        </v-alert>
        <v-simple-table v-else dense class="odrive-error-log-table">
            <thead>
                <tr>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.ColumnTime') }}</th>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.ColumnLocation') }}</th>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.ColumnError') }}</th>
                    <th>{{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.ColumnEvent') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="entry in entries" :key="entry.key">
                    <td class="text-no-wrap">{{ formatTime(entry.time, true) }}</td>
                    <td class="text-no-wrap">{{ entry.location }}</td>
                    <td class="text-no-wrap">{{ convertName(entry.error) }}</td>
                    <td class="text-no-wrap">
                        <v-chip x-small label :color="entry.appeared ? 'error' : 'success'" text-color="white">
                            {{
                                entry.appeared
                                    ? $t('Panels.OdrivePanel.Diagnostics.ErrorLog.Appeared')
                                    : $t('Panels.OdrivePanel.Diagnostics.ErrorLog.Cleared')
                            }}
                        </v-chip>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>

        <div class="text-caption text--disabled mt-1">
            {{
                $t('Panels.OdrivePanel.Diagnostics.ErrorLog.ClearLogHint', {
                    command: 'ODRIVE_CLEAR_ERRORS',
                })
            }}
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { convertName } from '@/plugins/helpers'
import { mdiDeleteSweep } from '@mdi/js'
import type { PrinterStateOdrive, PrinterStateOdriveAxisErrors } from '@/store/printer/types'

// Rolling client-side, session-scoped occurrence log. There is no
// server-side error-history storage anywhere in the ODrive backend --
// get_status() only ever reports the *current* error snapshot, and
// ODRIVE_CLEAR_ERRORS/ODRIVE_ERRORS only read/clear that same current
// state (see klippy/extras/odrive/*.py). So instead of a real history
// endpoint, this samples the already-subscribed board/axis status
// reactively (exactly like OdriveAxisTelemetryChart.vue's client-side
// telemetry buffer) and appends an entry whenever a decoded error name
// appears or disappears. Capped at a fixed entry count rather than a
// time window, since a flappy error could otherwise fill an hour-long
// window with hundreds of near-duplicate entries.
const MAX_ENTRIES = 100

const ERROR_CATEGORIES: (keyof PrinterStateOdriveAxisErrors)[] = ['axis', 'motor', 'encoder', 'controller']

interface OdriveErrorLogEntry {
    key: string
    time: number
    location: string
    error: string
    appeared: boolean
}

@Component
export default class OdriveErrorLog extends Mixins(BaseMixin) {
    mdiDeleteSweep = mdiDeleteSweep
    convertName = convertName

    @Prop({ type: Object, required: true }) declare readonly board: PrinterStateOdrive

    entries: OdriveErrorLogEntry[] = []

    private entrySeq = 0
    private prevBoardErrors: string[] = []
    private prevAxisErrors: Record<string, PrinterStateOdriveAxisErrors> = {}

    mounted() {
        this.syncErrors()
    }

    // fires whenever any subscribed field of the board (including nested
    // axes) changes - same reactive-sampling approach as
    // OdriveAxisTelemetryChart.vue, no polling timer of its own.
    @Watch('board', { deep: true })
    boardChanged() {
        this.syncErrors()
    }

    syncErrors() {
        this.diffAndLog(this.board.name, this.prevBoardErrors, this.board.errors)
        this.prevBoardErrors = [...this.board.errors]

        this.board.axes.forEach((axis) => {
            const prev = this.prevAxisErrors[axis.key] ?? { axis: [], motor: [], encoder: [], controller: [] }
            const next = axis.errors ?? { axis: [], motor: [], encoder: [], controller: [] }

            ERROR_CATEGORIES.forEach((category) => {
                this.diffAndLog(`${axis.name} (${category})`, prev[category], next[category])
            })

            this.prevAxisErrors[axis.key] = {
                axis: [...next.axis],
                motor: [...next.motor],
                encoder: [...next.encoder],
                controller: [...next.controller],
            }
        })
    }

    diffAndLog(location: string, prev: string[], next: string[]) {
        const now = Date.now()

        next.filter((error) => !prev.includes(error)).forEach((error) => this.pushEntry(location, error, true, now))
        prev.filter((error) => !next.includes(error)).forEach((error) => this.pushEntry(location, error, false, now))
    }

    pushEntry(location: string, error: string, appeared: boolean, time: number) {
        this.entrySeq++

        const entries = [{ key: `${time}-${this.entrySeq}`, time, location, error, appeared }, ...this.entries]

        this.entries = entries.slice(0, MAX_ENTRIES)
    }

    clearLog() {
        this.entries = []
    }
}
</script>
