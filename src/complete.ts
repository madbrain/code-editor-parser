
import * as _ from "lodash";
import {Position, Span} from './analyse';
import {Query, CompositeQuery, GroupQuery, Ident, Match, BadOperatorMatch, BadValueMatch, OperatorKind, Value, StringValue} from './ast';

export interface Completion {
    span: Span;
    elements: string[];
}

export interface CompletionHelper {
    completeName(prefix: string): Promise<Array<String>>;
    completeMatchOperator(name: string): Promise<Array<String>>;
    completeValue(name: string, op: OperatorKind, prefix: string): Promise<Array<String>>;
}

function addTrailingSpace(values: string[]) {
    return values.map(value => value + " ");
}

interface Action {
    makeCompletion: () => Promise<Completion>;
}

class CompleteName implements Action {
    constructor(public helper: CompletionHelper, public span: Span, public prefix: string = "") {}

    public makeCompletion() {
        return this.helper.completeName(this.prefix).then((names: string[]) => {
            return {span: this.span, elements: addTrailingSpace(names) };
        });
    }
}

class CompleteOperator implements Action {
    constructor(public helper: CompletionHelper, public ident: Ident, public span: Span) {}

    public makeCompletion() {
        return this.helper.completeMatchOperator(this.ident.name).then((ops: string[]) => {
            return {span: this.span, elements: addTrailingSpace(ops) };
        });
    }
}

class CompleteBooleanOperator implements Action {
    constructor(public span: Span) {}

    public makeCompletion() {
        return Promise.resolve({span: this.span, elements: addTrailingSpace(["AND", "OR"]) });
    }
}

class CompleteValue implements Action {
    constructor(public helper: CompletionHelper, public ident: string,
            public operator: OperatorKind, public prefix: string, public span: Span) {}

    public makeCompletion() {
        return this.helper.completeValue(this.ident, this.operator, this.prefix).then((values: string[]) => {
            return {span: this.span, elements: addTrailingSpace(values) };
        });
    }
}

export class CompletionProcessor {

    constructor(public helper: CompletionHelper) {}
    
    public complete(query: Query, position: Position): Promise<Completion> {
        let action = this.findAction(query, position);
        return action.makeCompletion();
    }

    private findAction(query: Query, position: Position): Action {
        if (isBefore(position, query.span.from)) {
            return this.completeParamNames(position);
        } else if (isIn(position, query.span)) {
            if (query.type == "bad-operator-match") {
                return this.findActionInBadOperatorMatch(<BadOperatorMatch>query, position);
            } else if (query.type == "bad-value-match") {
                return this.findActionInBadValueMatch(<BadValueMatch>query, position);
            } else if (query.type == "match") {
                return this.findActionInMatch(<Match>query, position);
            } else if (query.type == "bad-match") {
                return this.completeParamNames(position);
            } else if (query.type == "and-query" || query.type == "or-query") {
                let compositeQuery = <CompositeQuery>query;
                for (var i = 0; i < compositeQuery.elements.length; i++) {
                    if (isIn(position, compositeQuery.elements[i].span)) {
                        return this.findAction(compositeQuery.elements[i], position);
                    }
                }
                return this.completeParamNames(position);
            } else if (query.type == "group-query") {
                return this.findAction((<GroupQuery>query).query, position);
            } else {
                throw Error("unknown query type: " + query.type);
            }
        } else if (isAfter(position, query.span.to)) {
            if (query.type == "bad-operator-match") {
                return this.findActionAfterBadOperatorMatch(<BadOperatorMatch>query, position);
            } else if (query.type == "bad-match") {
                return new CompleteName(this.helper, { from: position, to: position});
            } else if (query.type == "bad-value-match") {
                let badValue = (<BadValueMatch>query);
                return new CompleteValue(this.helper, badValue.ident.name, badValue.operator.kind, "", { from: position, to: position});
            } else if (query.type == "match") {
                return new CompleteBooleanOperator({ from: position, to: position});
             } else if (query.type == "and-query" || query.type == "or-query") {
                let compositeQuery = <CompositeQuery>query;
                let last = compositeQuery.elements[compositeQuery.elements.length-1];
                return this.findAction(last, position);
            } else if (query.type == "group-query") {
                let group = <GroupQuery>query;
                return this.findAction((<GroupQuery>query).query, position);
            } else {
                throw Error("unknown query type: " + query.type);
            }
        }
    }

    private completeParamNames(position: Position) {
        return new CompleteName(this.helper, { from: position, to: position})
    }

    private completeParamNamesIn(position: Position, ident: Ident) {
        let prefix = this.findIdentPrefix(ident, position);
        return new CompleteName(this.helper, ident.span, prefix);
    }

    private findActionInMatch(query: Match, position: Position): Action {
        let ident = query.ident;
        let value = query.value;
        if (isIn(position, ident.span)) {
            return this.completeParamNamesIn(position, ident);
        } else if (isIn(position, value.span)) {
            let prefix = this.findValuePrefix(query.value, position);
            return new CompleteValue(this.helper, query.ident.name, query.operator.kind, prefix, value.span);
        } else if (isIn(position, query.operator.span)) {
            return new CompleteOperator(this.helper, query.ident, query.operator.span);
        }
    }

    private findActionInBadOperatorMatch(query: BadOperatorMatch, position: Position): Action {
        let ident = query.ident;
        if (isIn(position, ident.span)) {
            return this.completeParamNamesIn(position, ident);
        } else if (isAfter(position, ident.span.to)) {
            return new CompleteOperator(this.helper, query.ident, {from: position, to:position});
        }
    }

    private findActionInBadValueMatch(query: BadValueMatch, position: Position): Action {
        let ident = query.ident;
        if (isIn(position, ident.span)) {
            return this.completeParamNamesIn(position, ident);
        } else if (isIn(position, query.operator.span)) {
            return new CompleteOperator(this.helper, query.ident, query.operator.span);
        } else if (isAfter(position, query.operator.span.to)) {
            return new CompleteValue(this.helper, query.ident.name, query.operator.kind, "", {from: position, to:position});
        }
    }

    private findActionAfterBadOperatorMatch(query: BadOperatorMatch, position: Position): Action {
        if (_.isEqual(query.ident.span, query.span)) {
            return new CompleteOperator(this.helper, query.ident, {from: position, to:position});
        } else {
            throw Error("NOTHING? " + query.ident.span + " -> " + query.span);
        }
    }

    private findIdentPrefix(ident: Ident, position: Position) {
        return ident.name.slice(0, position.column - ident.span.from.column);
    }

    private findValuePrefix(value: Value, position: Position) {
        let content = ""
        if (value.type == "string-value") {
            content = '"' + (<StringValue>value).content + '"';
        } else if (value.type == "null-value") {
            content = "null";
        } else {
            content = "now";
        }
        return content.slice(0, position.column - value.span.from.column);
    }
}

function isBefore(a: Position, b: Position) {
    return a.line < b.line || a.line == b.line && a.column < b.column;
}

function isAfter(a: Position, b: Position) {
    return a.line > b.line || a.line == b.line && a.column > b.column;
}

function isIn(position: Position, span: Span) {
    return ! isBefore(position, span.from) && ! isAfter(position, span.to);
}