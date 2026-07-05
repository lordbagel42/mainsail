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
import { Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import ThemeMixin from '@/components/mixins/theme'
import { colorArray, odriveTelemetryChartWindow } from '@/store/variables'
import type { ECBasicOption } from 'echarts/types/dist/shared.d'
import type { PrinterStateOdriveAxis } from '@/store/printer/types'

// one point in the chart's client-side rolling sample buffer, taken from the
// axis's ordinary printer-object status (the same data OdriveAxisStatus.vue/
// OdriveAxisCalibration.vue already read via printer.objects.subscribe) -
// there is no push-style telemetry stream, so this component samples the
// live prop reactively on every store update instead of polling or
// subscribing to anything itself.
interface OdriveTelemetrySample {
    time: number
    pos_estimate: number | null
    pos_error: number | null
    vel_estimate: number | null
    iq_measured: number | null
    iq_setpoint: number | null
}

@Component
export default class OdriveAxisTelemetryChart extends Mixins(BaseMixin, ThemeMixin) {
    @Prop({ type: Object, required: true }) declare readonly axis: PrinterStateOdriveAxis

    samples: OdriveTelemetrySample[] = []

    mounted() {
        this.pushSample()
    }

    // fires whenever any field of the subscribed axis object changes (pos_
    // estimate/vel_estimate/iq_measured included) - Vue's normal reactivity,
    // no polling timer needed.
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
                pos_estimate: this.axis.pos_estimate,
                pos_error: this.axis.pos_error,
                vel_estimate: this.axis.vel_estimate,
                iq_measured: this.axis.iq_measured,
                iq_setpoint: this.axis.iq_setpoint,
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
            pos_estimate: sample.pos_estimate,
            pos_error: sample.pos_error,
            vel_estimate: sample.vel_estimate,
            iq_measured: sample.iq_measured,
            iq_setpoint: sample.iq_setpoint,
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
                left: 70,
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
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartVelocityAxis'),
                    type: 'value',
                    position: 'left',
                    offset: 55,
                    nameTextStyle: { color: this.fgColorMid },
                    splitLine: { show: false },
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
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartPosEstimate'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 0,
                    encode: { x: 'time', y: 'pos_estimate' },
                    lineStyle: { color: colorArray[0], width: 2 },
                    itemStyle: { color: colorArray[0] },
                },
                {
                    // following error (pos_error = commanded - actual position, straight
                    // from the odrive_axis object, not derived/fabricated) - real signal
                    // the original design doc called out as useful for diagnosing a
                    // following-error shutdown after the fact, so it shares the position
                    // axis with pos_estimate rather than getting its own chart.
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartPosError'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 0,
                    encode: { x: 'time', y: 'pos_error' },
                    lineStyle: { color: colorArray[3], width: 1.5 },
                    itemStyle: { color: colorArray[3] },
                },
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartVelEstimate'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 1,
                    encode: { x: 'time', y: 'vel_estimate' },
                    lineStyle: { color: colorArray[1], width: 1.5 },
                    itemStyle: { color: colorArray[1] },
                },
                {
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartIqMeasured'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 2,
                    encode: { x: 'time', y: 'iq_measured' },
                    lineStyle: { color: colorArray[2], width: 1.5 },
                    itemStyle: { color: colorArray[2] },
                },
                {
                    // commanded current/torque (setpoint) vs. iq_measured (actual) above -
                    // same axis/color family, dashed to distinguish commanded from actual,
                    // the common charting convention for target-vs-actual pairs (this
                    // codebase's own TempChart target series uses a filled-area style
                    // instead, which doesn't translate well to a single overlaid line).
                    name: this.$t('Panels.OdrivePanel.Tuning.ChartIqSetpoint'),
                    type: 'line',
                    showSymbol: false,
                    yAxisIndex: 2,
                    encode: { x: 'time', y: 'iq_setpoint' },
                    lineStyle: { color: colorArray[2], width: 1.5, type: 'dashed' },
                    itemStyle: { color: colorArray[2] },
                },
            ],
        }
    }
}
</script>
