<div class="row">
    <div class="editor-column full-height">
        <Editor options="{editorOptions}" selection="{selection}" />
    </div>
    <div class="tree-column full-height">
        <div>
            <div class="header">
                <Switch on:change="set({ modeAST: event.value })" leftLabel="Tokens" rightLabel="AST"/>
            </div>
            <div class="tree">
                <Tree tree="{modeAST ? $ast : $tokens}" />
            </div>
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

.header {
    font-family: Arial, Helvetica, sans-serif;
    border-bottom: 1px solid black;
    padding: 10px;
}

.tree-column {
    flex: 25%;
}

.tree {
    padding: 5px;
}
</style>

<script>
    import Editor from "./Editor.svelte";
    import Tree from "./Tree.svelte";
    import Switch from "./Switch.svelte";
    import editorOptions from "./editor.service";

    export default {
        components: { Editor, Tree, Switch },
        
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
                selection: null,
                modeAST: false
            }
        }
    }
</script>