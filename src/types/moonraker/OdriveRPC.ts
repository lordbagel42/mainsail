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

    /**
     * Push one line of Python source into this board's stateful REPL
     * console (a `code.InteractiveConsole` kept alive server-side, one per
     * board, lazily created on first use). Mirrors typing a single line
     * into a real `python3` shell and pressing Enter - never a whole
     * multi-line block. See "Phase M5 - In-browser Python REPL" in
     * `docs/ODrive_Mainsail_Integration_Plan.md`.
     */
    'printer.odrive.repl_exec': (params: {
        /** The `[odrive <name>]` config section name this board was configured under. */
        odrive: string
        /** Exactly one line of Python source, as typed by the user before pressing Enter. */
        line: string
    }) => Promise<{
        /** Everything printed/raised while executing this line (may be an empty string). */
        output: string
        /** `true` if the statement is incomplete (unclosed block/paren/etc.) and input should continue with a continuation prompt. */
        more: boolean
    }>

    /**
     * Discard this board's REPL console and its namespace, so the next
     * `repl_exec` call starts a fresh session.
     */
    'printer.odrive.repl_reset': (params: {
        /** The `[odrive <name>]` config section name this board was configured under. */
        odrive: string
    }) => Promise<unknown>
}
