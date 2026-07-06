<template>
    <div>
        <panel
            v-if="klipperReadyForGui && boards.length"
            :icon="mdiEngineOutline"
            :title="$t('Panels.OdrivePanel.BoardStatus.Headline')"
            :collapsible="true"
            card-class="odrive-board-status-panel">
            <v-card-text class="px-0 py-2">
                <odrive-board-list :boards="boards" />
            </v-card-text>
        </panel>
        <panel
            v-if="klipperReadyForGui && hasAxes"
            :icon="mdiWrenchCog"
            :title="$t('Panels.OdrivePanel.Calibration.Headline')"
            :collapsible="true"
            card-class="odrive-calibration-panel">
            <v-card-text class="px-0 py-2">
                <odrive-calibration-list :boards="boards" />
            </v-card-text>
        </panel>
        <panel
            v-if="klipperReadyForGui && hasAxes"
            :icon="mdiTuneVariant"
            :title="$t('Panels.OdrivePanel.Tuning.Headline')"
            :collapsible="true"
            card-class="odrive-tuning-panel">
            <v-card-text class="px-0 py-2">
                <odrive-tuning-list :boards="boards" />
            </v-card-text>
        </panel>
        <panel
            v-if="klipperReadyForGui && boards.length"
            :icon="mdiClipboardPulseOutline"
            :title="$t('Panels.OdrivePanel.Diagnostics.Headline')"
            :collapsible="true"
            card-class="odrive-diagnostics-panel">
            <v-card-text class="px-0 py-2">
                <odrive-diagnostics-list :boards="boards" />
            </v-card-text>
        </panel>
        <panel
            v-if="klipperReadyForGui && boards.length"
            :icon="mdiConsoleLine"
            :title="$t('Panels.OdrivePanel.Repl.Headline')"
            :collapsible="true"
            card-class="odrive-repl-panel">
            <v-card-text class="px-0 py-2">
                <odrive-repl-list :boards="boards" />
            </v-card-text>
        </panel>
        <v-row v-if="!klipperReadyForGui || !boards.length">
            <v-col>
                <v-alert
                    dense
                    text
                    type="warning"
                    elevation="2"
                    class="mx-auto mt-6"
                    max-width="500"
                    :icon="mdiLockOutline">
                    {{ $t('Panels.OdrivePanel.NoBoards') }}
                </v-alert>
            </v-col>
        </v-row>
    </div>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import Panel from '@/components/ui/Panel.vue'
import OdriveBoardList from '@/components/panels/Odrive/OdriveBoardList.vue'
import OdriveCalibrationList from '@/components/panels/Odrive/OdriveCalibrationList.vue'
import OdriveTuningList from '@/components/panels/Odrive/OdriveTuningList.vue'
import OdriveDiagnosticsList from '@/components/panels/Odrive/OdriveDiagnosticsList.vue'
import OdriveReplList from '@/components/panels/Odrive/OdriveReplList.vue'
import {
    mdiClipboardPulseOutline,
    mdiConsoleLine,
    mdiEngineOutline,
    mdiLockOutline,
    mdiTuneVariant,
    mdiWrenchCog,
} from '@mdi/js'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: {
        Panel,
        OdriveBoardList,
        OdriveCalibrationList,
        OdriveTuningList,
        OdriveDiagnosticsList,
        OdriveReplList,
    },
})
export default class PageOdrive extends Mixins(BaseMixin) {
    mdiLockOutline = mdiLockOutline
    mdiEngineOutline = mdiEngineOutline
    mdiWrenchCog = mdiWrenchCog
    mdiTuneVariant = mdiTuneVariant
    mdiClipboardPulseOutline = mdiClipboardPulseOutline
    mdiConsoleLine = mdiConsoleLine

    get boards(): PrinterStateOdrive[] {
        return this.$store.getters['printer/getOdriveBoards'] ?? []
    }

    get hasAxes(): boolean {
        return this.boards.some((board) => board.axes.length > 0)
    }
}
</script>
