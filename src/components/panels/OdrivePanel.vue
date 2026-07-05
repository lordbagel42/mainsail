<template>
    <panel
        v-if="showPanel"
        :title="$t('Panels.OdrivePanel.Headline')"
        :icon="mdiEngineOutline"
        :collapsible="true"
        card-class="odrive-panel">
        <v-card-text class="px-0 py-2">
            <odrive-board-list :boards="boards" />
        </v-card-text>
    </panel>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '../mixins/base'
import Panel from '@/components/ui/Panel.vue'
import OdriveBoardList from '@/components/panels/Odrive/OdriveBoardList.vue'
import { mdiEngineOutline } from '@mdi/js'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveBoardList, Panel },
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
}
</script>
