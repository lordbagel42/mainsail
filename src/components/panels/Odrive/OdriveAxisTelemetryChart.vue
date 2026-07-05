<template>
    <div>
        <e-chart
            v-if="hasSamples"
            ref="odriveTelemetryChart"
            :option="chartOptions"
            :init-options="{ renderer: 'svg' }"
            :autoresize="true"
            style="height: 220px"
            class="w-100" />
        <v-alert v-else dense text type="info" class="mb-0">
            {{ $t('Panels.OdrivePanel.Tuning.ChartWaitingForData') }}
        </v-alert>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import ThemeMixin from '@/components/mixins/theme'
import { colorArray } from '@/store/variables'
import type { ECBasicOption } from 'echarts/types/dist/shared.d'
import type { PrinterOdriveTelemetrySample } from '@/store/printer/odriveTelemetry/types'

@Component
export default class OdriveAxisTelemetryChart extends Mixins(BaseMixin, ThemeMixin) {
    @Prop({ type: String, required: true }) declare readonly axis: string

    mounted() {
        this.$store.dispatch('printer/odriveTelemetry/subscribe', this.axis)
    }

    beforeDestroy() {
        this.$store.dispatch('printer/odriveTelemetry/unsubscribe', this.axis)
    }

    get samples(): PrinterOdriveTelemetrySample[] {
        return this.$store.getters['printer/odriveTelemetry/getSamples'](this.axis)
    }

    get hasSamples(): boolean {
        return this.samples.length > 0
    }

    get source() {
        return this.samples.map((sample) => ({
            time: sample.time * 1000,
            input_pos: sample.input_pos,
            pos_estimate: sample.pos_estimate,
            iq_measured: sample.iq_measured,
        }))
    }

    get chartOptions(): ECBasicOption {
        return {
            renderer: 'svg',
            animation: false,
            tooltip: {
                trigger: 'axis',
                backgroundColor: this.bgColor(1),
                textStyle: { color: this.fgColorHi },
            },
            legend: {
                show: true,
                textStyle: { color: this.fgColorMid },
                top: 0,
            },
            grid: {
                top: 35,
                right: 45,
                bottom: 30,
                left: 45,
            },
            xAxis: {
                type: 'time',
                splitLine: { show: true, lineStyle: { color: this.fgColorFaint } },
                axisLabel: { color: this.fgColorLow },
            },
            yAxis: [
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartPositionAxis'),
                    type: 'value',
                    nameTextStyle: { color: this.fgColorMid },
                    splitLine: { lineStyle: { color: this.fgColorFaint } },
                    axisLabel: { color: this.fgColorMid },
                },
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartCurrentAxis'),
                    type: 'value',
                    position: 'right',
                    nameTextStyle: { color: this.fgColorMid },
                    splitLine: { show: false },
                    axisLabel: { color: this.fgColorMid },
                },
            ],
            dataset: { source: this.source },
            series: [
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartInputPos'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 0,
                    encode: { x: 'time', y: 'input_pos' },
                    lineStyle: { color: colorArray[0], width: 1.5, type: 'dashed' },
                    itemStyle: { color: colorArray[0] },
                },
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartPosEstimate'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 0,
                    encode: { x: 'time', y: 'pos_estimate' },
                    lineStyle: { color: colorArray[1], width: 2 },
                    itemStyle: { color: colorArray[1] },
                },
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartIqMeasured'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 1,
                    encode: { x: 'time', y: 'iq_measured' },
                    lineStyle: { color: colorArray[2], width: 1.5 },
                    itemStyle: { color: colorArray[2] },
                },
            ],
        }
    }
}
</script>
