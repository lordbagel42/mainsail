<template>
    <div class="px-6">
        <strong class="d-block mb-2">{{ board.name }}</strong>

        <!-- text-overline is this codebase's existing idiom for a small caps-style
             sub-label (see DevicesDialogUsbDevice.vue, MmuGateSummary.vue) rather
             than a manually uppercased text-body-2 -->
        <div class="text-overline text--disabled mb-1">
            {{ $t('Panels.OdrivePanel.Diagnostics.PropertyBrowser.Headline') }}
        </div>
        <odrive-property-browser :board="board" class="mb-4" />

        <div class="text-overline text--disabled mb-1">
            {{ $t('Panels.OdrivePanel.Diagnostics.ErrorLog.Headline') }}
        </div>
        <odrive-error-log :board="board" />
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import OdrivePropertyBrowser from '@/components/panels/Odrive/OdrivePropertyBrowser.vue'
import OdriveErrorLog from '@/components/panels/Odrive/OdriveErrorLog.vue'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdrivePropertyBrowser, OdriveErrorLog },
})
export default class OdriveBoardDiagnostics extends Mixins(BaseMixin) {
    @Prop({ type: Object, required: true }) declare readonly board: PrinterStateOdrive
}
</script>
