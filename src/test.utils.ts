
import {Span} from './analyse';

export function span(sl: number, sc: number, el: number, ec: number): Span {
    return {from: {line: sl, column: sc}, to: {line: el, column: ec}};
}