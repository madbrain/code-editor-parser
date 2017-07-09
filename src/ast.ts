
import {Span} from "./analyse";

export enum OperatorKind {
    EQUALS, LOWER, IS 
}

export interface AstNode {
    type: string;
    span: Span;
}
export interface Ident extends AstNode {
    name: string;
}
export interface Operator extends AstNode {
    kind: OperatorKind;
}
export interface Value extends AstNode {}
export interface StringValue extends AstNode {
    content: string;
}

export interface Query extends AstNode {}

export interface Match extends Query {
    ident: Ident;
    operator: Operator;
    value: Value;
}
export interface GroupQuery extends Query {
    query: Query;
}
export interface CompositeQuery extends Query {
    elements: Query[];
}

export interface ErrorNode extends AstNode {}

export interface BadOperatorMatch extends ErrorNode {
    ident: Ident;
}

export interface BadValueMatch extends ErrorNode {
    ident: Ident;
    operator: Operator;
}

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

    public static NullValue(span: Span) {
        return {type: "null-value", span: span};        
    }

    public static NowValue(span: Span) {
        return {type: "now-value", span: span};        
    }

    public static Match(span: Span, ident: Ident, operator: Operator, value: Value) {
        return {type: "match", span: span, ident: ident, operator: operator, value: value};
    }

    public static Operator(span: Span, kind: OperatorKind) {
        return {type: "operator", span: span, kind: kind};
    }

      public static BadMatch(span: Span) {
        return {type: "bad-match", span: span };
    }

    public static BadOperatorMatch(span: Span, ident: Ident) {
        return {type: "bad-operator-match", span: span, ident: ident};
    }

    public static BadValueMatch(span: Span, ident: Ident, operator: Operator) {
        return {type: "bad-value-match", span: span, ident: ident, operator: operator };
    } 
};