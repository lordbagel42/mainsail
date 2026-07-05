<template>
    <div>
        <v-row v-if="klipperReadyForGui && boards.length">
            <v-col>
                <v-card>
                    <v-card-text class="px-0 py-2">
                        <odrive-board-list :boards="boards" />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row v-else>
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
import OdriveBoardList from '@/components/panels/Odrive/OdriveBoardList.vue'
import { mdiLockOutline } from '@mdi/js'
import type { PrinterStateOdrive } from '@/store/printer/types'

@Component({
    components: { OdriveBoardList },
})
export default class PageOdrive extends Mixins(BaseMixin) {
    mdiLockOutline = mdiLockOutline

    get boards(): PrinterStateOdrive[] {
        return this.$store.getters['printer/getOdriveBoards'] ?? []
    }
}
</script>
