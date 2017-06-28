
import {CompletionProcessor} from './complete';
import {Lexer, Parser} from './analyse';
import {span} from './test.utils';

describe("Completion", function() {
    it("complete on empty", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "param1" ]
        let content = " = 'tutu'";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(params);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 0});
        expect(result).toEqual({span: span(0, 0, 0, 0), elements: [ "desc", "param1" ] });
    });

    it("complete at end of word", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "param1" ]
        let content = "de";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(params);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 2});
        expect(result).toEqual({span: span(0, 0, 0, 2), elements: [ "desc" ] });
    });

    it("complete in middle of word", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "dex" ]
        let content = "desc";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(params);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 2});
        expect(result).toEqual({span: span(0, 0, 0, 4), elements: [ "desc", "dex" ] });
    });

    it("complete after word", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "dex" ]
        let content = "desc";
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(params);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 5});
        expect(result).toEqual({span: span(0, 5, 0, 5), elements: [ "<", "IS", "=" ] });
    });
});