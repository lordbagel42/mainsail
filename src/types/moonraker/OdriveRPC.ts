/**
 * ODrive telemetry webhooks passthrough
 *
 * `odrive/telemetry` is a `bulk_sensor.BatchBulkHelper`-style mux endpoint
 * registered by Kalico's `klippy/extras/odrive/telemetry.py` (mux key: `axis`),
 * reached the same way Klippy webhooks passthrough exposes any other
 * `bulk_sensor` endpoint (e.g. `motion_report/dump_trapq`, ADXL345 dumps)
 * over Moonraker's websocket - no dedicated Moonraker component required.
 *
 * NOTE: this frontend has no existing consumer of a `bulk_sensor`-style
 * webhook (no accelerometer/resonance dump viewer exists here to mirror),
 * so the exact request/response shape below is a best-effort match of the
 * general `bulk_sensor.BatchBulkHelper` protocol used elsewhere in
 * Klipper/Kalico, not something verified against a live board. In
 * particular:
 * - `response_template` is echoed back as the base object of every pushed
 *   batch (with `params` replaced by the actual sample batch), so the axis
 *   name is intentionally included in the template here to self-identify
 *   which axis a given push belongs to, since the mux key used to start the
 *   stream isn't necessarily repeated on every subsequent push.
 * - There is no known explicit "unsubscribe" RPC for this class of endpoint;
 *   the client connection dropping is normally what stops the stream
 *   server-side. As a best-effort courtesy (and to avoid leaving the fast
 *   USB poll running for a client who has navigated away), this frontend
 *   re-issues the same call with an empty `response_template` on unmount.
 * Please double check this against the actual Kalico implementation once
 * hardware/firmware is available to test against.
 */
export interface OdriveRPC {
    /**
     * (Re)subscribe (or, with an empty `response_template`, best-effort
     * unsubscribe) to the fast-rate telemetry stream for one ODrive axis.
     */
    'odrive/telemetry': (params: {
        /** `[odrive_axis <name>]` section name (mux key) */
        axis: string
        /** Echoed back verbatim as the base of every pushed batch message */
        response_template?: Record<string, unknown>
    }) => Promise<Record<string, unknown>>
}
