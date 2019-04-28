<div class="row">
    <div class="editor-column full-height">
        <Editor options="{editorOptions}" selection="{selection}" />
    </div>
    <div class="tree-column full-height">
        <div>
            <Tree tree="{$ast}" />
        </div>
    </div>
</div>

<style>

:global(html, body) {
    height: 100%;
    padding: 0px;
    margin: 0px;
}

.row {
    display: flex;
    height: 100%;
}

.full-height {
    border: 1px solid black;
    height: 100%;
    box-sizing: border-box;
}

.editor-column {
    flex: 75%;
}

.tree-column {
    flex: 25%;
}

.tree-column div {
    padding: 5px;
}
</style>

<script>
    import Editor from "./Editor.svelte";
    import Tree from "./Tree.svelte";
    import editorOptions from "./editor.service";

    export default {
        components: { Editor, Tree },
        
        oncreate() {
            this.store.on('state', ({ current, changed, previous }) => {
                if (changed.selection && current.selection) {
                    this.set({ selection: current.selection.span });
                }
                if (changed.tree) {
                    this.store.set({ selection: null });
                }
            });
        },

        data() {
            return {
                editorOptions: editorOptions,
                selection: null
            }
        }
    }
</script>