import { Store } from 'svelte/store';

const ast = {
    label: "",
    children: [ ]
};

export default new Store( { ast: ast, selection: null });