
import * as CodeMirror from "codemirror";
import "codemirror/addon/lint/lint";

import {IErrorReporter, Parser, Lexer} from "./analyse";

export function main() {

    let lintOptions: CodeMirror.LintOptions = {
        async: false,
        hasGutters: false,
        getAnnotations: function(content: string, options: CodeMirror.LintStateOptions, editor: CodeMirror.Editor) {
            let errors: CodeMirror.Annotation[] = [];
            let reporter: IErrorReporter = function(from, to, message) {
                errors.push({
                    from: CodeMirror.Pos(from.line, from.column),
                    to: CodeMirror.Pos(to.line, to.column),
                    severity: "error",
                    message: message
                });
            };
            let parser = new Parser(new Lexer(content, reporter), reporter);
            try {
                let result = parser.parseQuery();
            } catch (e) {
                console.log(e);
            }
            return errors;
        }
    };

    var myCodeMirror = CodeMirror(document.getElementById("main"), {
        value: "(desc = 'tutu' OR status IS NULL) AND date > NOW\n",
        mode: "custom",
        lint: lintOptions
    });
}