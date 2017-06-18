
import {Span} from "./analyse";

export interface AstNode {
    span: Span;
}

export interface Value extends AstNode {}

export interface Query extends AstNode {}

export class GroupQuery implements AstNode {
    constructor(public span: Span, public query: Query) { }
}

export class OrQuery implements Query {
    constructor(public span: Span, public elements: Query[]) { }
}

export class AndQuery implements Query {
    constructor(public span: Span, public elements: Query[]) { }
}

export class Ident implements AstNode {
    constructor(public span: Span, public name: string) {}
}

export class StringValue implements AstNode {
    constructor(public span: Span, public content: string) {}
}

export class EqualsMatch implements Query {
    constructor(public span: Span, public ident: Ident, public value: Value) {}
}

export class IsNullMatch implements Query {
    constructor(public span: Span, public ident: Ident) {}
}

export class BeforeTodayMatch implements Query {
    constructor(public span: Span, public ident: Ident) {}
}