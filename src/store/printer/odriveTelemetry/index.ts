import { Module } from 'vuex'
import { PrinterOdriveTelemetryState } from '@/store/printer/odriveTelemetry/types'
import { actions } from '@/store/printer/odriveTelemetry/actions'
import { mutations } from '@/store/printer/odriveTelemetry/mutations'
import { getters } from '@/store/printer/odriveTelemetry/getters'
import { RootState } from '@/store/types'

export const getDefaultState = (): PrinterOdriveTelemetryState => {
    return {
        axes: {},
    }
}

// initial state
const state = getDefaultState()

export const odriveTelemetry: Module<PrinterOdriveTelemetryState, RootState> = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
