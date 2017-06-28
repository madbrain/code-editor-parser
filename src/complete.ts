
import * as _ from "lodash";
import {Position, Span} from './analyse';
import {Query, Ident, Match, BadOperatorMatch, BadValueMatch} from './ast';

export interface Completion {
    span: Span;
    elements: string[];
}

function addTrailingSpace(values: string[]) {
    return values.map(value => value + " ");
}

interface Action {
    makeCompletion: () => Completion;
}

class CompleteName implements Action {
    constructor(public values: string[], public span: Span) {}

    public makeCompletion() {
        return {span: this.span, elements: addTrailingSpace(this.values) };
    }
}

class CompleteValue implements Action {
    constructor(public query: BadValueMatch, public span: Span) {}

    public makeCompletion() {
        return {span: this.span, elements: addTrailingSpace([ "'my'", "NULL", "'values'" ]) };
    }
}

export class CompletionProcessor {

    constructor(public params: string[]) {}
    
    public complete(query: Query, position: Position): Completion {
        let action = this.findAction(query, position);
        return action.makeCompletion();
    }

    private findAction(query: Query, position: Position): Action {
        if (isBefore(position, query.span.from)) {
            return new CompleteName(this.params, { from: position, to: position})
        } else if (isIn(position, query.span)) {
            if (query.type == "bad-operator-match") {
                return this.findActionInBadOperatorMatch(<BadOperatorMatch>query, position);
            } else if (query.type == "match") {
                return this.findActionInMatch(<Match>query, position);
            } else if (query.type == "bad-match") {
                return new CompleteName(this.params, { from: position, to: position});
            } else {
                throw Error("unknown query type: " + query.type);
            }
        } else if (isAfter(position, query.span.to)) {
            if (query.type == "bad-operator-match") {
                return this.findActionAfterBadOperatorMatch(<BadOperatorMatch>query, position);
            } else if (query.type == "bad-match") {
                return new CompleteName(this.params, { from: position, to: position});
            } else if (query.type == "bad-value-match") {
                return new CompleteValue(/*<BadValueMatch>query*/ null, { from: position, to: position});
            } else if (query.type == "match") {
                return new CompleteName([ "AND", "OR" ], { from: position, to: position});
            } else {
                throw Error("unknown query type: " + query.type);
            }
        }
    }

    private findActionInMatch(query: Match, position: Position): Action {
        let ident = query.ident;
        let value = query.value;
        if (isIn(position, ident.span)) {
            let prefix = this.findPrefix(ident, position);
            return new CompleteName(this.params.filter(p => p.slice(0, prefix.length) == prefix), ident.span);
        } else if (isIn(position, value.span)) {
            return new CompleteValue(null, value.span);
        } else if (isIn(position, query.operator.span)) {
            return new CompleteName([ "<", "IS", "=" ], query.operator.span);
        }
    }

    private findActionInBadOperatorMatch(query: BadOperatorMatch, position: Position): Action {
        let ident = query.ident;
        if (isIn(position, ident.span)) {
            let prefix = this.findPrefix(ident, position);
            return new CompleteName(this.params.filter(p => p.slice(0, prefix.length) == prefix), ident.span);
        } else if (isAfter(position, ident.span.to)) {
            return new CompleteName([ "<", "IS", "=" ], {from: position, to:position});
        }
    }

    private findActionAfterBadOperatorMatch(query: BadOperatorMatch, position: Position): Action {
        if (_.isEqual(query.ident.span, query.span)) {
            return new CompleteName([ "<", "IS", "=" ], {from: position, to:position});
        } else {
            throw Error("NOTHING? " + query.ident.span + " -> " + query.span);
        }
    }

    private findPrefix(ident: Ident, position: Position) {
        return ident.name.slice(0, position.column - ident.span.from.column);
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