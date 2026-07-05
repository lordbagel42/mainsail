import { GetterTree } from 'vuex'
import { PrinterOdriveTelemetryState, PrinterOdriveTelemetrySample } from '@/store/printer/odriveTelemetry/types'
import { RootState } from '@/store/types'

export const getters: GetterTree<PrinterOdriveTelemetryState, RootState> = {
    getSamples:
        (state) =>
        (axis: string): PrinterOdriveTelemetrySample[] => {
            return state.axes[axis]?.samples ?? []
        },

    isSubscribed:
        (state) =>
        (axis: string): boolean => {
            return state.axes[axis]?.subscribed ?? false
        },
}
