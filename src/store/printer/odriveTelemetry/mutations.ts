import Vue from 'vue'
import { MutationTree } from 'vuex'
import { PrinterOdriveTelemetryState, PrinterOdriveTelemetrySample } from '@/store/printer/odriveTelemetry/types'
import { odriveTelemetryWindow } from '@/store/variables'

// hard cap on top of the rolling time window, as a safety net in case the
// stream ever sends unexpectedly dense or out-of-order batches
const odriveTelemetryMaxSamples = 4000

const ensureAxis = (state: PrinterOdriveTelemetryState, axis: string) => {
    if (!(axis in state.axes)) Vue.set(state.axes, axis, { subscribed: false, samples: [] })

    return state.axes[axis]
}

export const mutations: MutationTree<PrinterOdriveTelemetryState> = {
    reset(state) {
        Vue.set(state, 'axes', {})
    },

    setSubscribed(state, payload: { axis: string; subscribed: boolean }) {
        const axisState = ensureAxis(state, payload.axis)
        axisState.subscribed = payload.subscribed
    },

    addSamples(state, payload: { axis: string; samples: PrinterOdriveTelemetrySample[] }) {
        const axisState = ensureAxis(state, payload.axis)
        const merged = [...axisState.samples, ...payload.samples]

        // keep only the trailing rolling time window (plus a hard cap as a
        // safety net in case very old/duplicate timestamps ever show up)
        const newestTime = merged.length ? merged[merged.length - 1].time : 0
        const trimmed = merged
            .filter((sample) => sample.time >= newestTime - odriveTelemetryWindow)
            .slice(-odriveTelemetryMaxSamples)

        Vue.set(axisState, 'samples', trimmed)
    },

    clearAxis(state, axis: string) {
        if (axis in state.axes) Vue.set(state.axes, axis, { subscribed: state.axes[axis].subscribed, samples: [] })
    },
}
