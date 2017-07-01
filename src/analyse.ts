
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

export enum TokenType {
    IDENT,
    STRING_LITERAL,
    AND, OR, IS, NULL, NOW,
    EQUALS, LOWER,
    LPAR, RPAR,
    EOF
}

export interface Token {
    span: Span;
    type: TokenType;
    value?: string;
}

const KEYWORDS = {
    "OR": TokenType.OR,
    "AND": TokenType.AND,
    "IS": TokenType.IS,
    "NULL": TokenType.NULL,
    "NOW": TokenType.NOW
};

function mergeSpan(spans: Span[]): Span {
    function minPosition(a: Position, b: Position): Position {
        if (a.line < b.line) {
            return a;
        }
        if (a.line == b.line) {
            return { line: a.line, column: Math.min(a.column, b.column)};
        }
        return b;
    }
    function maxPosition(a: Position, b: Position): Position {
        if (a.line > b.line) {
            return a;
        }
        if (a.line == b.line) {
            return { line: a.line, column: Math.max(a.column, b.column)};
        }
        return b;
    }
    function merge(a: Span, b: Span): Span {
        return {from: minPosition(a.from, b.from), to: maxPosition(a.to, b.to)};
    }
    let span: Span = null;
    spans.forEach(s => {
        if (span) {
            span = merge(span, s)
        } else {
            span = s;
        }
    })
    return span;
} 

export class Lexer {
    private position = 0;
    private line = 0;
    private column = 0;
    private startLine: number;
    private startColumn: number;
    private previousColumn: number;
    private badCharsSpan: Span = null;
    private badChars = "";

    constructor(private content: string, private reporter: IErrorReporter) {}

    public nextToken(): Token {
        while (true) {
            this.startToken()
            let c = this.nextChar();
            if (c == '') {
                return this.token(TokenType.EOF);
            }
            if (c == '(') {
                return this.token(TokenType.LPAR);
            }
            if (c == ')') {
                return this.token(TokenType.RPAR);
            }
            if (c == '=') {
                return this.token(TokenType.EQUALS);
            }
            if (c == '<') {
                return this.token(TokenType.LOWER);
            }
            if (c == '\'') {
                return this.stringLiteral(c);
            }
            if (this.isLetter(c)) {
                return this.ident(c);
            }
            if (!this.isSpace(c)) {
                if (this.badChars == "") {
                    this.badCharsSpan = this.makeSpan();
                } else {
                    this.badCharsSpan = mergeSpan([this.badCharsSpan, this.makeSpan()]);
                }
                this.badChars += c;
            }
        }
    }

    private flushBadChars() {
        if (this.badChars.length > 0) {
            let msg = "unexpected char '" + this.badChars + "'";
            this.reporter(this.badCharsSpan, msg);
            this.badChars = "";    
        }
    }

    private ident(c: string) {
        let value = "";
        do {
            value += c;
            c = this.nextChar();
        } while (this.isLetterOrDigit(c))
        this.pushback(c);
        let keyword = KEYWORDS[value];
        if (keyword) {
           return this.token(keyword); 
        }
        return this.token(TokenType.IDENT, value);
    }

    private stringLiteral(separator: string) {
        let value = "";
        while (true) {
            let c = this.nextChar();
            if (c == separator) {
                break;
            }
            if (c == "" || c == "\n") {
                this.pushback(c);
                this.reporter(this.makeSpan(), "unterminated string");
                break;
            }
            value += c;
        }
        return this.token(TokenType.STRING_LITERAL, value);
    }

    private isLetterOrDigit(c: string) {
        return this.isLetter(c) || this.isDigit(c);
    }

    private isLetter(c: string) {
        return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
    }

    private isDigit(c: string) {
        return c >= '0' && c <= '9';
    }

    private isSpace(c: string) {
        return c == ' '|| c == '\t' || c == '\n';
    }

    private token(type: TokenType, value: string = null): Token {
        this.flushBadChars();
        if (value) {
            return { span: this.makeSpan(), type: type, value: value };
        }
        return { span: this.makeSpan(), type: type };
    }

    private startToken() {
        this.startLine = this.line;
        this.startColumn = this.column;
    }

    private makeSpan(): Span {
        return {
            from: { line: this.startLine, column: this.startColumn },
            to:   { line: this.line, column: this.column }
        };
    }

    private pushback(c) {
        if (c.length > 0) {
            --this.position;
            if (c == '\n') {
                --this.line;
                this.column = this.previousColumn;
            } else {
                --this.column;
            }
        }
    }

    private nextChar(): string {
        if (this.position == this.content.length) {
            return "";
        }
        let c = this.content.charAt(this.position++);
        if (c == '\n') {
            this.previousColumn = this.column;
            this.line++;
            this.column = 0;
        } else {
            this.column++;
        }
        return c;
    }
}

import * as ast from "./ast";

export class Parser {
    private token: Token;
    private lastSpan: Span = null;

    constructor(private lexer: Lexer, private reporter: IErrorReporter) {}

    public parseQuery(): ast.Query {
        this.nextToken();
        let query = this.parseOr();
        this.expect(TokenType.EOF, false);
        return query;
    }

    /**
     * Or ::= And ( OR And )*
     * 
     * Follow(Or) = { EOF, RPAR }
     */
    private parseOr() {
        let elements = [ this.parseAnd() ];
        while (this.testAndSkip(TokenType.OR)) {
            elements.push(this.parseAnd());
        }
        if (elements.length == 1) {
            return elements[0];
        }
        return ast.Builder.OrQuery(this.nodesSpan(elements), elements);
    }

    /**
     * And ::= Unitary ( AND Unitary )*
     * 
     * First(And)  = First(Unitary) = { LPAR, IDENT }
     * Follow(And) = { OR } + Follow(Or) = { OR, RPAR, EOF }
     */
    private parseAnd() {
        let elements = [ this.parseUnitary() ];
        while (true) {
            if (this.testAndSkip(TokenType.AND)) {
                elements.push(this.parseUnitary());
            } else if (this.testAny([TokenType.IDENT, TokenType.LPAR])) {
                this.reportExpect(TokenType.AND); // or maybe { OR, RPAR, EOF } ?
                elements.push(this.parseUnitary());
            } else {
                break;
            }
        }
        if (elements.length == 1) {
            return elements[0];
        }
        return ast.Builder.AndQuery(this.nodesSpan(elements), elements);
    }

    /**
     * Unitary ::= LPAR Or RPAR
     * Unitary ::= Ident ( EQUALS Value | LOWER NOW | IS NULL)
     * 
     * Follow(Unitary) = { AND } + Follow(And) = { AND, OR, RPAR, EOF }
     */
    private parseUnitary() {
        let start = this.token.span;
        if (this.testAndSkip(TokenType.LPAR)) {
            let query = this.parseOr();
            let end = this.expect(TokenType.RPAR, false);
            let endSpan = end != null ? end.span : query.span;
            return ast.Builder.GroupQuery(mergeSpan([start, endSpan]), query);
        }
        const syncTokens = [TokenType.AND, TokenType.OR, TokenType.RPAR, TokenType.EOF];
        return this.recoverWith(syncTokens, start, (span) => {
            return ast.Builder.BadMatch(mergeSpan([start, span ]));
        }, () => {
            let ident = this.parseIdent();
            return this.recoverWith(syncTokens, start, (span) => {
                return ast.Builder.BadOperatorMatch(mergeSpan([start, span ]), ident);
            }, () => {
                let operator = this.parseOperator();
                return this.recoverWith(syncTokens, operator.span, (span) => {
                    return ast.Builder.BadValueMatch(mergeSpan([start, span]), ident, operator);
                }, () => {
                    let value = this.parseValue();
                    return ast.Builder.Match(this.nodesSpan([ident, value]), ident, operator, value);
                });
            });
        });
        
    }

    /**
     * Operator ::= EQUALS | IS | LOWER
     */
    private parseOperator(): ast.Operator {
        let span = this.token.span;
        if (this.testAndSkip(TokenType.EQUALS)) {
            return ast.Builder.Operator(span, ast.OperatorKind.EQUALS);
        }
        if (this.testAndSkip(TokenType.LOWER)) {
            return ast.Builder.Operator(span, ast.OperatorKind.LOWER);
        }
        if (this.testAndSkip(TokenType.IS)) {
            return ast.Builder.Operator(span, ast.OperatorKind.IS);
        }
        this.report("expecting token =, < or IS");
    }

    /**
     * Ident ::= IDENT
     * Follow(Ident) = { EQUALS, LOWER, IS }
     */
    private parseIdent(): ast.Ident {
        let t = this.expect(TokenType.IDENT);
        return ast.Builder.Ident(t.span, t.value);
    }

    /**
     * Value ::= STRING_LITERAL | NOW | NULL
     * Follow(Value) = Follow(Unitary) = { AND, OR, RPAR, EOF }
     */
    private parseValue(): ast.Value {
        let span = this.token.span;
        if (this.testAndSkip(TokenType.NULL)) {
            return ast.Builder.NullValue(span);
        }
        if (this.testAndSkip(TokenType.NOW)) {
            return ast.Builder.NowValue(span);
        }
        if (this.token.type == TokenType.STRING_LITERAL) {
            let t = this.nextToken();
            return ast.Builder.StringValue(t.span, t.value);
        }
        this.report("expecting <STRING>, NULL or NOW");
    }

    private testAndSkip(type: TokenType): boolean {
        if (this.token.type == type) {
            this.nextToken();
            return true;
        }
        return false;
    }

    private testAny(types: TokenType[]): boolean {
        return types.indexOf(this.token.type) >= 0;
    }


    private recoverWith<T>(syncTokens: TokenType[], start: Span, makeError: (Span) => T, parseFunc: () => T): T {
        try {
            return parseFunc();
        } catch(e) {
            let tokens = this.skipTo(syncTokens);
            let range = tokens.length > 0 ? mergeSpan([ start, tokens[tokens.length-1].span ]) : start;
            return makeError(range);
        }
    }

    private skipTo(syncTokens: TokenType[]): Token[] {
        let tokens: Token[] = []
        while (! (this.token.type == TokenType.EOF || syncTokens.indexOf(this.token.type) >= 0)) {
            tokens.push(this.token);
            this.nextToken();
        }
        return tokens;
    }

    private expect(type: TokenType, doThrow: boolean = true): Token {
        if (this.token.type != type) {
            this.reportExpect(type, doThrow);
            return null;
        } else {
            return this.nextToken();
        }
    }

    private reportExpect(type: TokenType, doThrow: boolean = false) {
        let msg = "expecting token " + TokenType[type];
        this.report(msg, doThrow);
    }

    private report(msg: string, doThrow: boolean = true) {
        let span = this.token.span;
        if (span.from.line == span.to.line
                && span.from.column == span.to.column
                && this.lastSpan != null) {
            span = this.lastSpan;
        }
        this.reporter(span, msg);
        if (doThrow) {
            throw new Error(msg
                + " at line " + span.from.line
                + " column " + span.from.column);
        }
    }

    private nextToken(): Token {
        let t = this.token;
        if (t != null) {
            this.lastSpan = t.span;
        }
        this.token = this.lexer.nextToken();
        return t;
    }

    private nodesSpan(nodes: ast.AstNode[]) {
        return mergeSpan(nodes.map(node => node.span));
    }
}