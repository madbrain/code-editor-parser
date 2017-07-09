
import * as _ from "lodash";
import {Position, Span} from './analyse';
import {Query, CompositeQuery, GroupQuery, Ident, Match, BadOperatorMatch, BadValueMatch, OperatorKind, Value, StringValue} from './ast';

export interface Completion {
    span: Span;
    elements: string[];
}

export interface CompletionHelper {
    completeName(prefix: string): Promise<Array<String>>;
    completeMatchOperator(name: string): Promise<Array<String>>;
    completeValue(name: string, op: OperatorKind, prefix: string): Promise<Array<String>>;
}

export class CompletionProcessor {

    constructor(public helper: CompletionHelper) {}
    
    public complete(query: Query, position: Position): Promise<Completion> {
        throw new Error("not complete");
    }

}