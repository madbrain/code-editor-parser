
import {Span} from "./analyse";

export interface AstNode {
    type: string;
    span: Span;
}
export interface Ident extends AstNode {
    name: string;
}
export interface Value extends AstNode {}
export interface StringValue extends AstNode {
    content: string;
}

export interface Query extends AstNode {}

export interface ErrorNode extends AstNode {}

export class Builder {
    public static GroupQuery(span: Span, query: Query) {
        return {type:"group-query", span: span, query: query};
    }
    
    public static OrQuery(span: Span, elements: Query[]) {
        return {type:"or-query", span: span, elements: elements};
    }

    public static AndQuery(span: Span, elements: Query[]) {
        return {type: "and-query", span: span, elements: elements};
    }

    public static Ident(span: Span, name: string) {
        return {type: "ident", span: span, name: name};
    }

    public static StringValue(span: Span, content: string) {
        return {type: "string-value", span: span, content: content};        
    }

    public static EqualsMatch(span: Span, ident: Ident, value: Value) {
        return {type: "equals-match", span: span, ident: ident, value: value};
    }

    public static IsNullMatch(span: Span, ident: Ident) {
        return {type:"is-null-match", span: span, ident: ident};
    }

    public static BeforeTodayMatch(span: Span, ident: Ident) {
        return {type: "before-today-match", span: span, ident: ident};
    }

    public static BadMatch(span: Span, ident: Ident) {
        return {type: "bad-match", span: span, ident: ident};
    }

    public static BadUnitary(span: Span) {
        return {type: "bad-unitary", span: span };
    } 
};