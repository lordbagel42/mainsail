<template>
    <div class="odrive-repl">
        <v-row no-gutters align="center" class="mb-1">
            <v-col class="text-body-2 text--disabled">
                {{ $t('Panels.OdrivePanel.Repl.Hint') }}
            </v-col>
            <v-col class="col-auto">
                <v-btn small text color="primary" :loading="resetting" @click="reset">
                    <v-icon small class="mr-1">{{ mdiRestart }}</v-icon>
                    {{ $t('Panels.OdrivePanel.Repl.Reset') }}
                </v-btn>
            </v-col>
        </v-row>
        <div class="odrive-repl-terminal">
            <overlay-scrollbars ref="scroll" class="odrive-repl-scroll" :options="{}">
                <div v-if="entries.length === 0" class="odrive-repl-line odrive-repl-line--hint">
                    {{ $t('Panels.OdrivePanel.Repl.Empty') }}
                </div>
                <div
                    v-for="(entry, index) in entries"
                    :key="index"
                    class="odrive-repl-line"
                    :class="'odrive-repl-line--' + entry.kind">
                    {{ entry.text }}
                </div>
            </overlay-scrollbars>
            <div class="odrive-repl-input-row d-flex align-center">
                <span class="odrive-repl-prompt">{{ promptIndicator }}</span>
                <v-text-field
                    ref="inputField"
                    v-model="input"
                    dark
                    dense
                    hide-details
                    flat
                    solo
                    background-color="transparent"
                    class="odrive-repl-input"
                    autocomplete="off"
                    :disabled="sending"
                    :placeholder="$t('Panels.OdrivePanel.Repl.InputPlaceholder').toString()"
                    @keydown.enter.prevent.stop="submit"
                    @keydown.up.prevent.stop="onHistoryUp"
                    @keydown.down.prevent.stop="onHistoryDown" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiRestart } from '@mdi/js'
import type { PrinterStateOdrive } from '@/store/printer/types'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'

type OdriveReplEntryKind = 'input' | 'output' | 'error'

interface OdriveReplEntry {
    kind: OdriveReplEntryKind
    text: string
}

interface VTextFieldRef {
    focus: () => void
}

@Component
export default class OdriveRepl extends Mixins(BaseMixin) {
    mdiRestart = mdiRestart

    @Prop({ type: Object, required: true }) declare readonly board: PrinterStateOdrive

    @Ref() readonly scroll?: OverlayScrollbarsComponent
    @Ref() readonly inputField?: VTextFieldRef

    entries: OdriveReplEntry[] = []
    input = ''
    more = false
    sending = false
    resetting = false

    history: string[] = []
    historyIndex: number | null = null

    get promptIndicator(): string {
        return this.more ? '...' : '>>>'
    }

    onHistoryUp(): void {
        if (!this.history.length) return

        if (this.historyIndex === null) {
            this.historyIndex = this.history.length - 1
        } else if (this.historyIndex > 0) {
            this.historyIndex--
        }

        this.input = this.history[this.historyIndex]
    }

    onHistoryDown(): void {
        if (this.historyIndex === null) return

        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++
            this.input = this.history[this.historyIndex]
        } else {
            this.historyIndex = null
            this.input = ''
        }
    }

    async submit(): Promise<void> {
        if (this.sending) return
        // outside of a continuation, an empty line has nothing to send - but
        // while "more" (a continuation prompt) an empty line is a real,
        // meaningful input (it's how you close an indented block), so it
        // must still be sent.
        if (this.input === '' && !this.more) return

        const line = this.input
        const prompt = this.promptIndicator

        this.entries.push({ kind: 'input', text: `${prompt} ${line}` })
        if (line !== '') this.history.push(line)
        this.historyIndex = null
        this.input = ''
        this.sending = true

        try {
            const result = await this.$store.dispatch('printer/execOdriveReplLine', {
                board: this.board.name,
                line,
            })

            if (result?.output) this.entries.push({ kind: 'output', text: result.output })
            this.more = !!result?.more
        } catch (error) {
            this.entries.push({ kind: 'error', text: this.formatError(error) })
            // don't get stuck showing a continuation prompt after a failed
            // request - the frontend has no reliable way to know whether the
            // backend still considers the statement incomplete.
            this.more = false
        } finally {
            this.sending = false
            this.scrollToBottom()
            this.focusInput()
        }
    }

    async reset(): Promise<void> {
        if (this.resetting) return

        this.resetting = true

        try {
            await this.$store.dispatch('printer/resetOdriveRepl', { board: this.board.name })
            this.entries = []
            this.more = false
            this.input = ''
            this.history = []
            this.historyIndex = null
        } catch (error) {
            this.entries.push({ kind: 'error', text: this.formatError(error) })
            this.scrollToBottom()
        } finally {
            this.resetting = false
            this.focusInput()
        }
    }

    focusInput(): void {
        this.$nextTick(() => {
            this.inputField?.focus()
        })
    }

    formatError(error: unknown): string {
        if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as { message?: unknown }).message
            if (typeof message === 'string' && message) return message
        }

        return this.$t('Panels.OdrivePanel.Repl.RequestFailed') as string
    }

    scrollToBottom(): void {
        this.$nextTick(() => {
            const instance = this.scroll?.osInstance()
            instance?.scroll({ y: '100%' })
        })
    }
}
</script>

<style scoped>
.odrive-repl-terminal {
    background-color: #1e1e1e;
    color: #d4d4d4;
    border-radius: 4px;
    overflow: hidden;
}

.odrive-repl-scroll {
    height: 260px;
    padding: 8px 12px;
}

.odrive-repl-line {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
}

.odrive-repl-line--hint {
    color: rgba(212, 212, 212, 0.5);
    font-style: italic;
}

.odrive-repl-line--error {
    color: #f48771;
}

.odrive-repl-input-row {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding: 4px 12px;
}

.odrive-repl-prompt {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.85rem;
    color: #d4d4d4;
    margin-right: 6px;
    user-select: none;
}

.odrive-repl-input :deep(input) {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.85rem;
    color: #d4d4d4 !important;
    caret-color: #d4d4d4;
}
</style>
