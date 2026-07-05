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
            </div>
        </v-card-text>
    </panel>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '../mixins/base'
import Panel from '@/components/ui/Panel.vue'
import { mdiEngineOutline } from '@mdi/js'
import { convertName } from '@/plugins/helpers'
import type { PrinterStateOdrive } from '@/store/printer/types'

/**
 * Dashboard summary card for configured ODrive boards.
 *
 * This intentionally shows only a per-board connection-state badge - board
 * name plus a single color-coded chip. Full per-axis detail (fw/hw version,
 * bus voltage, decoded errors, temperatures, per-axis state) belongs on the
 * dedicated ODrive page (see pages/Odrive.vue + OdriveBoardStatus.vue /
 * OdriveAxisStatus.vue), not on the glanceable dashboard.
 */
@Component({
    components: { Panel },
})
export default class OdrivePanel extends Mixins(BaseMixin) {
    mdiEngineOutline = mdiEngineOutline

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
}
</script>
