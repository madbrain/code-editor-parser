
import {CompletionProcessor, CompletionHelper} from './complete';
import {Lexer, Parser} from './analyse';
import {OperatorKind} from './ast';
import {span} from './test.utils';

describe("Completion", function() {
    it("complete on empty", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "param1" ]
        let content = " = 'tutu'";
        let helper = <CompletionHelper> {
            completeName: function(prefix: string): Promise<Array<String>> {
                return new Promise((accept) => {
                    accept(params.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
                });
            }
        };
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(helper);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 0});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 0, 0, 0), elements: [ "desc ", "param1 " ] });
        })
    });

    it("complete at end of word", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "param1" ]
        let content = "de";
        let helper = <CompletionHelper>{
            completeName: function(prefix: string): Promise<Array<String>> {
                return new Promise((accept) => {
                    accept(params.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
                });
            }
        };
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(helper);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 2});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 0, 0, 2), elements: [ "desc " ] });
        });
    });

    it("complete in middle of word", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "dex" ]
        let content = "desc";
        let helper = <CompletionHelper>{
            completeName: function(prefix: string): Promise<Array<String>> {
                return new Promise((accept) => {
                    accept(params.filter(value => value.slice(0, prefix.length).toUpperCase() == prefix.toLocaleUpperCase()));
                });
            }
        };
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(helper);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 2});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 0, 0, 4), elements: [ "desc ", "dex " ] });
        });
    });

    it("complete after word", function() {
        let reporter = (span, message) => {};
        let params = [ "desc", "dex" ]
        let content = "desc";
        let helper = <CompletionHelper>{
            completeMatchOperator: function(name: string): Promise<Array<String>> {
                return new Promise((accept) => {
                    accept(["<", "IS", "="]);
                });
            }
        };
        let parser = new Parser(new Lexer(content, reporter), reporter);
        let processor = new CompletionProcessor(helper);
        let result = processor.complete(parser.parseQuery(), { line: 0, column: 5});
        result.then((comp) => {
            expect(comp).toEqual({span: span(0, 5, 0, 5), elements: [ "< ", "IS ", "= " ] });
        });
    });
});