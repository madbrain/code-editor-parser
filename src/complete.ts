
import * as _ from "lodash";
import {Position, Span} from './analyse';
import {Query, Ident, BadMatch} from './ast';

export interface Completion {
    span: Span;
    elements: string[];
}

interface Action {
    makeCompletion: () => Completion;
}

class CompleteName implements Action {
    constructor(public values: string[], public span: Span) {}

    public makeCompletion() {
        return {span: this.span, elements: this.values };
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
                return this.findActionInBadMatch(<BadMatch>query, position);
            } else if (query.type == "bad-match") {
                return new CompleteName(this.params, { from: position, to: position})
            } else {
                throw Error("unknown query type: " + query.type);
            }
        } else if (isAfter(position, query.span.to)) {
            if (query.type == "bad-operator-match") {
                return this.findActionAfterBadMatch(<BadMatch>query, position);
            } else if (query.type == "bad-match") {
                return new CompleteName(this.params, { from: position, to: position})
            } else {
                throw Error("unknown query type: " + query.type);
            }
        }
    }

    private findActionInBadMatch(query: BadMatch, position: Position): Action {
        let ident = query.ident;
        if (isIn(position, ident.span)) {
            let prefix = this.findPrefix(ident, position);
            return new CompleteName(this.params.filter(p => p.slice(0, prefix.length) == prefix), ident.span);
        } else if (isAfter(position, ident.span.to)) {
            throw Error("COMPLETE OPS");
        }
    }

    private findActionAfterBadMatch(query: BadMatch, position: Position): Action {
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