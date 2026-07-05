import Vue from 'vue'
import { ActionTree } from 'vuex'
import { PrinterOdriveTelemetryPushPayload, PrinterOdriveTelemetryState } from '@/store/printer/odriveTelemetry/types'
import { RootState } from '@/store/types'

export const actions: ActionTree<PrinterOdriveTelemetryState, RootState> = {
    reset({ commit }) {
        commit('reset')
    },

    // subscribes the fast-rate telemetry stream for one odrive_axis - a no-op
    // if this axis is already subscribed. see the caveats documented in
    // src/types/moonraker/OdriveRPC.ts about the exact call shape.
    async subscribe({ commit, state }, axis: string) {
        if (state.axes[axis]?.subscribed) return

        try {
            await Vue.$socket.emitAndWait('odrive/telemetry', {
                axis,
                response_template: { method: 'notify_odrive_telemetry', axis },
            })

            commit('setSubscribed', { axis, subscribed: true })
        } catch (e) {
            // older Kalico versions (pre Phase 6 telemetry) or a board-less
            // printer won't have this endpoint at all - degrade gracefully,
            // the tuning sliders/save button work independently of the chart.
            window.console.debug(`odrive/telemetry subscribe for axis "${axis}" failed`, e)
        }
    },

    // best-effort unsubscribe - see src/types/moonraker/OdriveRPC.ts
    unsubscribe({ commit, state }, axis: string) {
        if (!state.axes[axis]?.subscribed) return

        commit('setSubscribed', { axis, subscribed: false })
        commit('clearAxis', axis)

        Vue.$socket.emit('odrive/telemetry', { axis, response_template: {} })
    },

    // dispatched from store/socket/actions.ts on every notify_odrive_telemetry push
    handlePush({ commit }, payload: PrinterOdriveTelemetryPushPayload) {
        if (!payload?.axis || !Array.isArray(payload.data)) return

        const samples = payload.data
            .filter((row) => Array.isArray(row) && row.length >= 5)
            .map((row) => ({
                time: row[0],
                input_pos: row[1],
                pos_estimate: row[2],
                vel_estimate: row[3],
                iq_measured: row[4],
            }))

        if (samples.length) commit('addSamples', { axis: payload.axis, samples })
    },
}
