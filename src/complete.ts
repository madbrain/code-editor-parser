
import * as _ from "lodash";
import {Position, Span} from './analyse';
import {Query, Ident, BadMatch} from './ast';

export interface Completion {
    span: Span;
    elements: string[];
}

export class CompletionProcessor {

    constructor(public params: string[]) {}
    
    public complete(query: Query, position: Position): Completion {
        throw new Error("to be completed");
    }
    
}