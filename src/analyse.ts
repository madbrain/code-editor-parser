
export interface Position {
    line: number;
    column: number;
}

export interface Span {
    from: Position;
    to: Position;
}

export interface IErrorReporter {
    (span: Span, message: string): void;
}

enum TokenType {
    EOF
}

export interface Token {
    span: Span;
    type: TokenType;
    value?: string;
}

export class Lexer {
    private index = 0;

    constructor(private content: String, private reporter: IErrorReporter) {}

    public nextToken(): Token {
        throw new Error("not complete");
    }
}

import * as ast from "./ast";

export class Parser {
    private token: Token;

    constructor(private lexer: Lexer, private reporter: IErrorReporter) {}

    public parseQuery(): any {
        this.nextToken();
        throw new Error("not complete");
    }

    private nextToken() {
        this.token = this.lexer.nextToken();
    }
}