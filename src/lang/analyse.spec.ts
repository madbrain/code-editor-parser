
import {Parser, Lexer, Token, TokenType, Span} from './analyse';
import {Ident, StringValue, Builder, OperatorKind} from "./ast";
import {span} from './test.utils';

describe("Lexer", function() {
    it("must return correct tokens", function() {
        let reporter = (span, message) => {}
        let content = "(desc = 'tutu' OR status IS NULL) AND date < NOW";
        let lexer = new Lexer(content, reporter);
        expect(lexer.nextToken()).toEqual({ span: span(0,  0, 0,  1), type: TokenType.LPAR });
        expect(lexer.nextToken()).toEqual({ span: span(0,  1, 0,  5), type: TokenType.IDENT, value: "desc" });
        expect(lexer.nextToken()).toEqual({ span: span(0,  6, 0,  7), type: TokenType.EQUALS });
        expect(lexer.nextToken()).toEqual({ span: span(0,  8, 0, 14), type: TokenType.STRING_LITERAL, value: 'tutu' });
        expect(lexer.nextToken()).toEqual({ span: span(0, 15, 0, 17), type: TokenType.OR });
        expect(lexer.nextToken()).toEqual({ span: span(0, 18, 0, 24), type: TokenType.IDENT, value: "status" });
        expect(lexer.nextToken()).toEqual({ span: span(0, 25, 0, 27), type: TokenType.IS });
        expect(lexer.nextToken()).toEqual({ span: span(0, 28, 0, 32), type: TokenType.NULL });
        expect(lexer.nextToken()).toEqual({ span: span(0, 32, 0, 33), type: TokenType.RPAR });
        expect(lexer.nextToken()).toEqual({ span: span(0, 34, 0, 37), type: TokenType.AND });
        expect(lexer.nextToken()).toEqual({ span: span(0, 38, 0, 42), type: TokenType.IDENT, value: "date" });
        expect(lexer.nextToken()).toEqual({ span: span(0, 43, 0, 44), type: TokenType.LOWER });
        expect(lexer.nextToken()).toEqual({ span: span(0, 45, 0, 48), type: TokenType.NOW });
        expect(lexer.nextToken()).toEqual({ span: span(0, 48, 0, 48), type: TokenType.EOF });
    });

    it("must report on bad characters", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message})
        };
        let content = "desc$^ IS NULL";
        let lexer = new Lexer(content, reporter);
        lexer.nextToken();
        lexer.nextToken();
        expect(errors).toEqual([{ span: span(0, 4, 0, 6), message: "unexpected char '$^'" }]);
    });

    it("must report unterminated string on new line", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message})
        };
        let content = "desc = 'machin \nbidule";
        let lexer = new Lexer(content, reporter);
        lexer.nextToken();
        lexer.nextToken();
        lexer.nextToken();
        expect(errors).toEqual([{ span: span(0, 7, 0, 15), message: "unterminated string" }]);
    });

    it("must report unterminated string at end", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message})
        };
        let content = "desc = 'machin ";
        let lexer = new Lexer(content, reporter);
        lexer.nextToken();
        lexer.nextToken();
        lexer.nextToken();
        expect(errors).toEqual([{ span: span(0, 7, 0, 15), message: "unterminated string" }]);
    });

    it("must report on bad characters and continue lexing", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message})
        };
        let content = "desc$^ IS NULL";
        let lexer = new Lexer(content, reporter);
        expect(lexer.nextToken()).toEqual({ span: span(0,  0, 0,  4), type: TokenType.IDENT, value: "desc" });
        expect(lexer.nextToken()).toEqual({ span: span(0, 7, 0, 9), type: TokenType.IS });
        expect(lexer.nextToken()).toEqual({ span: span(0, 10, 0, 14), type: TokenType.NULL });
        expect(lexer.nextToken()).toEqual({ span: span(0, 14, 0, 14), type: TokenType.EOF });
        expect(errors).toEqual([{ span: span(0, 4, 0, 6), message: "unexpected char '$^'" }]);
    });

    it("must handle multilines", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        };
        let content = "desc\n   IS \nNULL";
        let lexer = new Lexer(content, reporter);
        expect(lexer.nextToken()).toEqual({ span: span(0,  0, 0,  4), type: TokenType.IDENT, value: "desc" });
        expect(lexer.nextToken()).toEqual({ span: span(1, 3, 1, 5), type: TokenType.IS });
        expect(lexer.nextToken()).toEqual({ span: span(2, 0, 2, 4), type: TokenType.NULL });
        expect(lexer.nextToken()).toEqual({ span: span(2, 4, 2, 4), type: TokenType.EOF });
        expect(errors).toEqual([]);
    });
});

describe("Parser", function() {
    it("must return correct structure", function() {
        let reporter = (span, message) => {}
        let content = "(desc = 'tutu' OR status IS NULL) AND date < NOW\n";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = parser.parseQuery();
        expect(result).toEqual(Builder.AndQuery(span(0, 0, 0, 48), [
            Builder.GroupQuery(span(0, 0, 0, 33),
                Builder.OrQuery(span(0, 1, 0, 32), [
                    Builder.Match(span(0, 1, 0, 14),
                        Builder.Ident(span(0, 1, 0, 5), "desc"),
                        Builder.Operator(span(0, 6, 0, 7), OperatorKind.EQUALS),
                        Builder.StringValue(span(0, 8, 0, 14), "tutu")),
                    Builder.Match(span(0, 18, 0, 32),
                        Builder.Ident(span(0, 18, 0, 24), "status"),
                        Builder.Operator(span(0, 25, 0, 27), OperatorKind.IS),
                        Builder.NullValue(span(0, 28, 0, 32)))
                ])),
            Builder.Match(span(0, 38, 0, 48),
                Builder.Ident(span(0, 38, 0, 42), "date"),
                Builder.Operator(span(0, 43, 0, 44), OperatorKind.LOWER),
                Builder.NowValue(span(0, 45, 0, 48)))
        ]));
    });

    it("report error at end", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc = 'tutu' )";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        
        try {
            let result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 14, 0, 15), message: "expecting token EOF" }]);
    });

    it("report empty span error on previous token", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc = 'x' AND";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        
        try {
            let result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 11, 0, 14), message: "expecting token IDENT" }]);
    });

    it("report error at missing end parenthesis", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "(desc = 'tutu'";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        
        try {
            let result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 8, 0, 14), message: "expecting token RPAR" }]);
    });

    it("report error on bad match", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc 'tutu'";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        
        try {
            let result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 5, 0, 11), message: "expecting token =, < or IS" }]);
    });
});

describe("Parser recovery", function() {
    
    it("recover from bad match with spaces", function() {
        // On missing operator, skip to next token which can follow Unitary and return BadMatch (Panic Mode)
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc ";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 0, 0, 4), message: "expecting token =, < or IS" }]);
        expect(result).toEqual(Builder.BadOperatorMatch(span(0, 0, 0, 4),
                Builder.Ident(span(0, 0, 0, 4), "desc")));
    });

    it("recover from bad match", function() {
        // On missing operator, skip to next token which can follow Unitary and return BadMatch (Panic Mode)
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc 'tutu' AND desc IS NULL";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 5, 0, 11), message: "expecting token =, < or IS" }]);
        expect(result).toEqual(Builder.AndQuery(span(0, 0, 0, 28), [
            Builder.BadOperatorMatch(span(0, 0, 0, 11),
                Builder.Ident(span(0, 0, 0, 4), "desc")),
            Builder.Match(span(0, 16, 0, 28),
                Builder.Ident(span(0, 16, 0, 20), "desc"),
                Builder.Operator(span(0, 21, 0, 23), OperatorKind.IS),
                Builder.NullValue(span(0, 24, 0, 28)))
        ]));
    });

    it("recover from bad value", function() {
        // On missing value, skip to next token which can follow Unitary and return BadValue (Panic Mode)
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc = AND desc IS NULL";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 7, 0, 10), message: "expecting <STRING>, NULL or NOW" }]);
        expect(result).toEqual(Builder.AndQuery(span(0, 0, 0, 23), [
            Builder.BadValueMatch(span(0, 0, 0, 6),
                Builder.Ident(span(0, 0, 0, 4), "desc"),
                Builder.Operator(span(0, 5, 0, 6), OperatorKind.EQUALS)),
            Builder.Match(span(0, 11, 0, 23),
                Builder.Ident(span(0, 11, 0, 15), "desc"),
                Builder.Operator(span(0, 16, 0, 18), OperatorKind.IS),
                Builder.NullValue(span(0, 19, 0, 23)))
        ]));
    });

    it("recover from bad unitary", function() {
        // On missing ident, skip to next token which can follow Unitary and return BadUnitary (Panic Mode)
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "= 'tutu'";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 0, 0, 1), message: "expecting token IDENT" }]);
        expect(result).toEqual(Builder.BadMatch(span(0, 0, 0, 8)));
    });

    it("recover from missing AND", function() {
        // On missing AND and token can start a Unitary, simulate an insert of an AND (Dummy Insert Mode)
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc = 'tutu' desc IS NULL";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 14, 0, 18), message: "expecting token AND" }]);
        expect(result).toEqual(Builder.AndQuery(span(0, 0, 0, 26), [
            Builder.Match(span(0, 0, 0, 13),
                Builder.Ident(span(0, 0, 0, 4), "desc"),
                Builder.Operator(span(0, 5, 0, 6), OperatorKind.EQUALS),
                Builder.StringValue(span(0, 7, 0, 13), "tutu")),
            Builder.Match(span(0, 14, 0, 26),
                Builder.Ident(span(0, 14, 0, 18), "desc"),
                Builder.Operator(span(0, 19, 0, 21), OperatorKind.IS),
                Builder.NullValue(span(0, 22, 0, 26)))
        ]));
    });

    it("recover from junk at end", function() {
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "desc = 'tutu')";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([{ span: span(0, 13, 0, 14), message: "expecting token EOF" }]);
        expect(result).toEqual(
            Builder.Match(span(0, 0, 0, 13),
                Builder.Ident(span(0, 0, 0, 4), "desc"),
                Builder.Operator(span(0, 5, 0, 6), OperatorKind.EQUALS),
                Builder.StringValue(span(0, 7, 0, 13), "tutu")));
    });

    it("recover from missing ending parenthesis", function() {
        // On missing RPAR, simulate an insert of an RPAR (Dummy Insert Mode),
        // which will result in any case to a missing EOF (from above) but will return a result
        let errors = [];
        let reporter = (span, message) => {
            errors.push({span: span, message: message});
        }
        let content = "(desc = 'tutu' =";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let result = null;
        try {
            result = parser.parseQuery();
        } catch (e) {
        }
        expect(errors).toEqual([
            { span: span(0, 15, 0, 16), message: "expecting token RPAR" },
            { span: span(0, 15, 0, 16), message: "expecting token EOF" }]);
        expect(result).toEqual(
            Builder.GroupQuery(span(0, 0, 0, 14),
                Builder.Match(span(0, 1, 0, 14),
                    Builder.Ident(span(0, 1, 0, 5), "desc"),
                    Builder.Operator(span(0, 6, 0, 7), OperatorKind.EQUALS),
                    Builder.StringValue(span(0, 8, 0, 14), "tutu"))));
    });
});