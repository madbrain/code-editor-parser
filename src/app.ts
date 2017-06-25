
import * as CodeMirror from "codemirror";
import "codemirror/addon/lint/lint";
import "codemirror/addon/hint/show-hint";

import {IErrorReporter, Parser, Lexer} from "./analyse";

export function main() {

    function parse(content: string, reporter: IErrorReporter) {
        let parser = new Parser(new Lexer(content, reporter), reporter);
        try {
            let result = parser.parseQuery();
            console.log(result);
            return result;
        } catch (e) {
            console.log(e);
        }
    }

    let lintOptions: CodeMirror.LintOptions = {
        async: false,
        hasGutters: false,
        getAnnotations: function(content: string, options: CodeMirror.LintStateOptions, editor: CodeMirror.Editor) {
            let errors: CodeMirror.Annotation[] = [];
            let reporter: IErrorReporter = function(span, message) {
                errors.push({
                    from: CodeMirror.Pos(span.from.line, span.from.column),
                    to: CodeMirror.Pos(span.to.line, span.to.column),
                    severity: "error",
                    message: message
                });
            };
            let result = parse(content, reporter);
            return errors;
        }
    };

    function hint(cm: CodeMirror.Doc, option) {
        return new Promise(function(accept) {
            setTimeout(function() {
                var cursor = cm.getCursor();
                var query = parse(cm.getValue(), () => {});
                // TODO find cursor in query => determine completion state
                let comp = [ "Hello", "World" ];
                let start = cursor.ch;
                let end = cursor.ch + 1;
                return accept({
                    list: comp,
                    from: CodeMirror.Pos(cursor.line, start),
                    to: CodeMirror.Pos(cursor.line, end)});
            }, 100)
        })
    };

    var myCodeMirror = CodeMirror(document.getElementById("main"), {
        value: "(desc = 'tutu' OR status IS NULL) AND date < NOW\n",
        mode: "custom",
        lint: lintOptions,
        extraKeys: {
          "Ctrl-Space": function(cm) { CodeMirror.commands.autocomplete(cm, hint, {completeSingle: false}); }
        },
    });

    // myCodeMirror.on("keyup", (cm: CodeMirror.Editor, event) => {
    //     if (!cm.state.completionActive && /* Enables keyboard navigation in autocomplete list */
    //         event.keyCode != 13) {        /* Enter - do not open autocomplete list just after item has been selected in it */ 
    //         CodeMirror.commands.autocomplete(cm, hint, {completeSingle: false});
    //     }
    // });
}