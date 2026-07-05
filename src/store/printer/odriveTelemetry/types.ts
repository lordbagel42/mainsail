export interface PrinterOdriveTelemetrySample {
    time: number
    input_pos: number
    pos_estimate: number
    vel_estimate: number
    iq_measured: number
}

export interface PrinterOdriveTelemetryAxisState {
    subscribed: boolean
    samples: PrinterOdriveTelemetrySample[]
}

export interface PrinterOdriveTelemetryState {
    axes: Record<string, PrinterOdriveTelemetryAxisState>
}

// best-effort push payload shape for the `odrive/telemetry` bulk_sensor
// endpoint - see the caveats in `src/types/moonraker/OdriveRPC.ts`.
export interface PrinterOdriveTelemetryPushPayload {
    axis: string
    data: number[][]
    errors?: number
    overflows?: number
}
