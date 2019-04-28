import CodeMirror from "codemirror";
import "codemirror/addon/lint/lint";
import "codemirror/addon/hint/show-hint";
import "codemirror/theme/eclipse.css";
import "codemirror/addon/lint/lint.css";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/lib/codemirror.css";
import "./codemirror-date.css";

import { IErrorReporter, Parser, Lexer } from "../lang/analyse";
import { Query, CompositeQuery, GroupQuery, OperatorKind, Match, BadValueMatch, BadOperatorMatch, Value, StringValue } from '../lang/ast';
import { CompletionProcessor, CompletionHelper } from "../lang/complete";
import store from "./store";

const ExampleParameters = [
    { name: "birthday", type: "date", values: null },
    { name: "desc", type: "string", values: null },
    { name: "country", type: "string", values: ["FR", "ES", "EN", "IT"] },
    { name: "code", type: "string", values: ["X1-", "XX-", "Y1-"] },
];

function parse(content: string, reporter: IErrorReporter) {
    const parser = new Parser(new Lexer(content, reporter), reporter);
    try {
        return parser.parseQuery();
    } catch (e) {
        console.log(e);
    }
}

/**
 * Process query to find and create special marker for date
 * 
 * @param query 
 */
function findDate(query: Query) {
    if (query.type == "match") {
        const match = <Match>query;
        let type = undefined;
        const param = ExampleParameters.filter(param => param.name == match.ident.name);
        if (param.length > 0) {
            type = param[0].type;
        }
        if (type == "date" && match.value.type == "string-value") {
            const span = match.value.span;
            return [{
                from: CodeMirror.Pos(span.from.line, span.from.column),
                to: CodeMirror.Pos(span.to.line, span.to.column),
                severity: "date",
                message: ""
            }];
        } else {
            return [];
        }
    } else if (query.type == "and-query" || query.type == "or-query") {
        const compositeQuery = <CompositeQuery>query;
        let result = [];
        for (var i = 0; i < compositeQuery.elements.length; i++) {
            result = result.concat(findDate(compositeQuery.elements[i]));
        }
        return result;
    } else if (query.type == "group-query") {
        return findDate((<GroupQuery>query).query);
    } else {
        return [];
    }
}

/**
 * Transform Query Ast to tree
 * @param query
 */
function toTree(query: Query) {
    if (query.type == "match") {
        const match = <Match>query;
        return {
            label: query.type,
            span: query.span,
            children: [
                { label: `ident: ${match.ident.name}`, span: match.ident.span, children: [] },
                { label: `operator: ${match.operator.kind}`, span: match.operator.span, children: [] },
                valueToTree(match.value)
            ]
        };
    } else if (query.type == "and-query" || query.type == "or-query") {
        const compositeQuery = <CompositeQuery>query;
        return {
            label: query.type,
            span: query.span,
            children: compositeQuery.elements.map(toTree)
        };
    } else if (query.type == "group-query") {
        const groupQuery = <GroupQuery>query;
        return {
            label: query.type,
            span: query.span,
            children: [ toTree(groupQuery.query) ]
        };
    } else if (query.type == "bad-match") {
        return {
            label: query.type,
            span: query.span,
            children: [
                // TODO add bad tokens as a node { label: `value: ${bad.error}`, span: bad.error.span, children: [] }
            ]
        };
    } else if (query.type == "bad-operator-match") {
        const bad = <BadOperatorMatch>query;
        return {
            label: query.type,
            span: query.span,
            children: [
                { label: `ident: ${bad.ident.name}`, span: bad.ident.span, children: [] },
                // TODO add bad tokens as a node { label: `value: ${bad.error}`, span: bad.error.span, children: [] }
            ]
        };
    } else if (query.type == "bad-value-match") {
        const bad = <BadValueMatch>query;
        return {
            label: query.type,
            span: query.span,
            children: [
                { label: `ident: ${bad.ident.name}`, span: bad.ident.span, children: [] },
                { label: `operator: ${bad.operator.kind}`, span: bad.operator.span, children: [] },
                // TODO add bad tokens as a node { label: `value: ${bad.error}`, span: bad.error.span, children: [] }
            ]
        };
    } else {
        return {
            label: JSON.stringify(query),
            span: query.span,
            children: []
        };
    }
}

function valueToTree(value: Value) {
    if (value.type == "string-value") {
        const strValue = <StringValue>value;
        return {
            label: `value: "${strValue.content}"`,
            span: value.span,
            children: []
        };
    } else {
        return {
            label: `value: ${value.type}`,
            span: value.span,
            children: []
        };
    }
}

const lintOptions: CodeMirror.LintOptions = {
    async: false,
    hasGutters: false,
    getAnnotations: (content: string, options: CodeMirror.LintStateOptions, editor: CodeMirror.Editor) => {
        const errors: CodeMirror.Annotation[] = [];
        const reporter: IErrorReporter = (span, message) => {
            errors.push({
                from: CodeMirror.Pos(span.from.line, span.from.column),
                to: CodeMirror.Pos(span.to.line, span.to.column),
                severity: "error",
                message: message
            });
        };
        let result = parse(content, reporter);
        store.set({ ast: toTree(result) });
        return errors.concat(findDate(result));
    }
};

class LanguageHelper implements CompletionHelper {
    completeName(prefix: string): Promise<Array<String>> {
        return new Promise((accept) => {
            const values = ExampleParameters.map(param => param.name);
            accept(values.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
        });
    }
    completeMatchOperator(name: string): Promise<Array<String>> {
        return new Promise((accept) => {
            const params = ExampleParameters.filter(param => param.name == name);
            let type = params.length > 0 ? params[0].type : null;
            let ops = ["IS", "="];
            if (type == "date") {
                ops = ["<", "IS", "="];
            }
            accept(ops);
        });
    }
    completeValue(name: string, op: OperatorKind, prefix: string): Promise<Array<String>> {
        return new Promise((accept) => {
            const params = ExampleParameters.filter(param => param.name == name);
            let values = [];
            if (params.length > 0) {
                const param = params[0];
                values = param.values;
                if (values == null) {
                    if (param.type == "date") {
                        values = ["\"YYYY-MM-DD\""];
                    } else {
                        values = ["\"my\"", "\"value\""];
                    }
                } else {
                    values = values.map(value => '"' + value + '"');
                }
            }
            if (op == OperatorKind.IS) {
                values = ["NULL"];
            } else if (op == OperatorKind.LOWER) {
                values = ["NOW", "\"YYYY-MM-DD\""];
            }
            accept(values.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toUpperCase()));
        });
    }
}

function hint(cm: CodeMirror.Doc, option: CodeMirror.ShowHintOptions) {
    return new Promise((accept) => {
        setTimeout(() => {
            const cursor = cm.getCursor();
            const query = parse(cm.getValue(), () => { });
            const processor = new CompletionProcessor(new LanguageHelper());
            processor.complete(query, { line: cursor.line, column: cursor.ch }).then((result) => {
                return accept({
                    list: result.elements,
                    from: CodeMirror.Pos(cursor.line, result.span.from.column),
                    to: CodeMirror.Pos(cursor.line, result.span.to.column)
                });
            });
        }, 100);
    });
};

export default {
    value: "(desc = 'tutu' OR status IS NULL) AND date < NOW\n",
    mode: "custom",
    lint: lintOptions,
    extraKeys: {
        "Ctrl-Space": cm => { CodeMirror.commands.autocomplete(cm, hint, { completeSingle: false }); }
    },
};