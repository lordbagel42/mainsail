/**
 * ODrive raw-property-read RPC Interface
 *
 * This is not a standard Moonraker-documented endpoint -- it is Klippy's
 * webhooks passthrough for a mux endpoint registered by the `odrive`
 * extra (`klippy/extras/odrive/telemetry.py`, `register_mux_endpoint`).
 * Moonraker forwards any endpoint a connected Klippy instance reports via
 * `printer.objects.list`-style endpoint discovery, exposing it over the
 * websocket as `printer.<slash-path-with-dots>` -- the same mechanism
 * used for other Klippy-native passthroughs like
 * `printer.motion_report.dump_trapq` or ADXL345 dumps. No custom
 * Moonraker component is involved.
 *
 * There is no bulk/enumeration endpoint on the Klippy side (see
 * `docs/ODrive_Implementation_Spec.md`, "Status and webhooks surface"),
 * so this reads exactly one dotted ODrive property path per call.
 */
export interface OdriveRPC {
    /**
     * Read a single raw ODrive property (e.g. `axis0.motor.config.pole_pairs`)
     * from one board's firmware via its USB-CDC ASCII transport.
     */
    'printer.odrive.property_read': (params: {
        /** The `[odrive <name>]` config section name this board was configured under. */
        odrive: string
        /** Dotted ODrive firmware property path, e.g. `axis0.controller.config.pos_gain`. */
        property: string
    }) => Promise<{
        /** Echoes back the requested property path. */
        property: string
        /** The raw string value reported by the ODrive, or `null` if the read failed/timed out. */
        value: string | null
        /** `false` if the board was not connected at the time of the request (value is always `null` then). */
        connected: boolean
    }>
}
