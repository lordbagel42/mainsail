<template>
    <div>
        <e-chart
            v-if="hasSamples"
            ref="odriveBoardTelemetryChart"
            :option="chartOptions"
            :init-options="{ renderer: 'svg' }"
            :autoresize="true"
            style="height: 180px"
            class="w-100" />
        <v-alert v-else dense text type="info" class="mb-0">
            {{ $t('Panels.OdrivePanel.Tuning.ChartWaitingForData') }}
        </v-alert>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import ThemeMixin from '@/components/mixins/theme'
import { colorArray, odriveTelemetryChartWindow } from '@/store/variables'
import type { ECBasicOption } from 'echarts/types/dist/shared.d'
import type { PrinterStateOdrive } from '@/store/printer/types'

// one point in the chart's client-side rolling sample buffer, taken from the
// board's ordinary printer-object status (the same data OdriveBoardStatus.vue
// already reads via printer.objects.subscribe) - mirrors the exact pattern
// used by OdriveAxisTelemetryChart.vue: there is no push-style telemetry
// stream, so this component samples the live prop reactively on every store
// update instead of polling or subscribing to anything itself.
interface OdriveBoardTelemetrySample {
    time: number
    vbus_voltage: number | null
    jitter_ms: number | null
}

@Component
export default class OdriveBoardTelemetryChart extends Mixins(BaseMixin, ThemeMixin) {
    @Prop({ type: Object, required: true }) declare readonly board: PrinterStateOdrive

    samples: OdriveBoardTelemetrySample[] = []

    mounted() {
        this.pushSample()
    }

    // fires whenever any field of the subscribed board object changes
    // (vbus_voltage/streaming included) - Vue's normal reactivity, no
    // polling timer needed.
    @Watch('board', { deep: true })
    boardChanged() {
        this.pushSample()
    }

    pushSample() {
        const now = Date.now()

        const samples = [
            ...this.samples,
            {
                time: now,
                vbus_voltage: this.board.vbus_voltage,
                jitter_ms: this.board.streaming?.jitter_ms ?? null,
            },
        ]

        const cutoff = now - odriveTelemetryChartWindow
        this.samples = samples.filter((sample) => sample.time >= cutoff)
    }

    get hasSamples(): boolean {
        return this.samples.length > 0
    }

    get source() {
        return this.samples.map((sample) => ({
            time: sample.time,
            vbus_voltage: sample.vbus_voltage,
            jitter_ms: sample.jitter_ms,
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
                right: 55,
                bottom: 30,
                left: 55,
            },
            xAxis: {
                type: 'time',
                splitLine: { show: true, lineStyle: { color: this.fgColorFaint } },
                axisLabel: { color: this.fgColorLow },
            },
            yAxis: [
                {
                    name: this.$t('Panels.OdrivePanel.BoardTelemetry.ChartVbusVoltageAxis'),
                    type: 'value',
                    nameTextStyle: { color: this.fgColorMid },
                    splitLine: { lineStyle: { color: this.fgColorFaint } },
                    axisLabel: { color: this.fgColorMid },
                },
                {
                    name: this.$t('Panels.OdrivePanel.BoardTelemetry.ChartJitterAxis'),
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
                    name: this.$t('Panels.OdrivePanel.BoardTelemetry.ChartVbusVoltage'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 0,
                    encode: { x: 'time', y: 'vbus_voltage' },
                    lineStyle: { color: colorArray[0], width: 2 },
                    itemStyle: { color: colorArray[0] },
                },
                {
                    name: this.$t('Panels.OdrivePanel.BoardTelemetry.ChartJitterMs'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 1,
                    encode: { x: 'time', y: 'jitter_ms' },
                    lineStyle: { color: colorArray[1], width: 1.5 },
                    itemStyle: { color: colorArray[1] },
                },
            ],
        }
    }
}
</script>
