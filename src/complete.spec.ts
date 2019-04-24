
import {CompletionProcessor, CompletionHelper} from './complete';
import {Lexer, Parser} from './analyse';
import {OperatorKind} from './ast';
import {span} from './test.utils';

describe("Completion", function() {
    it("complete on empty", function() {
        const reporter = (span, message) => {};
        const params = [ "desc", "param1" ]
        const content = " = 'tutu'";
        const helper = <CompletionHelper> {
            completeName: function(prefix: string): Promise<Array<String>> {
                return Promise.resolve(params.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
            }
        };
        const parser = new Parser(new Lexer(content, reporter), reporter);
        const processor = new CompletionProcessor(helper);
        const result = processor.complete(parser.parseQuery(), { line: 0, column: 0});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 0, 0, 0), elements: [ "desc ", "param1 " ] });
        })
    });

    it("complete at end of word", function() {
        const reporter = (span, message) => {};
        const params = [ "desc", "param1" ]
        const content = "de";
        const helper = <CompletionHelper>{
            completeName: function(prefix: string): Promise<Array<String>> {
                return Promise.resolve(params.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
            }
        };
        const parser = new Parser(new Lexer(content, reporter), reporter);
        const processor = new CompletionProcessor(helper);
        const result = processor.complete(parser.parseQuery(), { line: 0, column: 2});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 0, 0, 2), elements: [ "desc " ] });
        });
    });

    it("complete in middle of word", function() {
        const reporter = (span, message) => {};
        const params = [ "desc", "dex" ]
        const content = "desc";
        const helper = <CompletionHelper>{
            completeName: function(prefix: string): Promise<Array<String>> {
                return Promise.resolve(params.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
            }
        };
        const parser = new Parser(new Lexer(content, reporter), reporter);
        const processor = new CompletionProcessor(helper);
        const result = processor.complete(parser.parseQuery(), { line: 0, column: 2});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 0, 0, 4), elements: [ "desc ", "dex " ] });
        });
    });

    it("complete after word", function() {
        const reporter = (span, message) => {};
        const params = [ "desc", "dex" ]
        const content = "desc";
        const helper = <CompletionHelper>{
            completeMatchOperator: function(name: string): Promise<Array<String>> {
                return Promise.resolve(["<", "IS", "="]);
            }
        };
        const parser = new Parser(new Lexer(content, reporter), reporter);
        const processor = new CompletionProcessor(helper);
        const result = processor.complete(parser.parseQuery(), { line: 0, column: 5});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 5, 0, 5), elements: [ "< ", "IS ", "= " ] });
        });
    });
});