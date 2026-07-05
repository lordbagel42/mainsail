<template>
    <div>
        <e-chart
            v-if="hasSamples"
            ref="odriveTemperatureChart"
            :option="chartOptions"
            :init-options="{ renderer: 'svg' }"
            :autoresize="true"
            style="height: 160px"
            class="w-100" />
        <v-alert v-else dense text type="info" class="mb-0">
            {{ $t('Panels.OdrivePanel.Tuning.ChartWaitingForData') }}
        </v-alert>
        <div v-if="hasSamples && !hasMotorTemp" class="text-caption grey--text mt-1">
            {{ $t('Panels.OdrivePanel.Tuning.ChartNoMotorThermistor') }}
        </div>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import ThemeMixin from '@/components/mixins/theme'
import { colorArray, odriveTelemetryChartWindow } from '@/store/variables'
import type { ECBasicOption } from 'echarts/types/dist/shared.d'
import type { PrinterStateOdriveAxis } from '@/store/printer/types'

// one point in the chart's client-side rolling sample buffer, taken from the
// axis's ordinary printer-object status - mirrors the exact pattern used by
// OdriveAxisTelemetryChart.vue. Kept as its own small chart (rather than a
// third/fourth y-axis crammed onto the position/velocity/current chart)
// because °C lives on a completely different scale than mm, mm/s and A.
interface OdriveTemperatureSample {
    time: number
    fet_temp: number | null
    motor_temp: number | null
}

@Component
export default class OdriveAxisTemperatureChart extends Mixins(BaseMixin, ThemeMixin) {
    @Prop({ type: Object, required: true }) declare readonly axis: PrinterStateOdriveAxis

    samples: OdriveTemperatureSample[] = []

    mounted() {
        this.pushSample()
    }

    @Watch('axis', { deep: true })
    axisChanged() {
        this.pushSample()
    }

    pushSample() {
        const now = Date.now()

        const samples = [
            ...this.samples,
            {
                time: now,
                fet_temp: this.axis.fet_temp,
                motor_temp: this.axis.motor_temp,
            },
        ]

        const cutoff = now - odriveTelemetryChartWindow
        this.samples = samples.filter((sample) => sample.time >= cutoff)
    }

    get hasSamples(): boolean {
        return this.samples.length > 0
    }

    // motor_temp is legitimately null whenever no motor thermistor is
    // wired up (same as OdriveAxisStatus.vue already treats it, rendering
    // '–' instead of a bogus number) - if every sample we've collected so
    // far is null, skip the series instead of drawing a misleading flat
    // line at 0.
    get hasMotorTemp(): boolean {
        return this.samples.some((sample) => sample.motor_temp !== null)
    }

    get source() {
        return this.samples.map((sample) => ({
            time: sample.time,
            fet_temp: sample.fet_temp,
            motor_temp: sample.motor_temp,
        }))
    }

    get series() {
        const series = [
            {
                name: this.$t('Panels.OdrivePanel.Tuning.ChartFetTemp'),
                type: 'line',
                showSymbol: false,
                yAxisIndex: 0,
                encode: { x: 'time', y: 'fet_temp' },
                lineStyle: { color: colorArray[0], width: 2 },
                itemStyle: { color: colorArray[0] },
            },
        ]

        if (this.hasMotorTemp) {
            series.push({
                name: this.$t('Panels.OdrivePanel.Tuning.ChartMotorTemp'),
                type: 'line',
                showSymbol: false,
                yAxisIndex: 0,
                encode: { x: 'time', y: 'motor_temp' },
                lineStyle: { color: colorArray[1], width: 1.5 },
                itemStyle: { color: colorArray[1] },
            })
        }

        return series
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
                right: 20,
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
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartTemperatureAxis'),
                    type: 'value',
                    nameTextStyle: { color: this.fgColorMid },
                    splitLine: { lineStyle: { color: this.fgColorFaint } },
                    axisLabel: { color: this.fgColorMid },
                },
            ],
            dataset: { source: this.source },
            series: this.series,
        }
    }
}
</script>
