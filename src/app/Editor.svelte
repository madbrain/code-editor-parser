<div ref:editor></div>

<style>
    div, :global(.CodeMirror) {
        height: 100%;
    }
</style>

<script>
    import CodeMirror from "codemirror";
    export default {
        oncreate() {
            this.codeMirror = CodeMirror(this.refs.editor, this.get().options);
        },
        onupdate({ changed, current }) {
            if (changed.selection) {
                const span = current.selection;
                if (span) {
                    this.codeMirror.doc.setSelection(
                        { line: span.from.line, ch: span.from.column },
                        { line: span.to.line, ch: span.to.column }
                    );
                }
            }
		},
        data() {
            return {
                options: {}
            }
        }
    }
</script>