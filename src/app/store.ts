import { Store } from 'svelte/store';

const emptyTree = {
    label: "",
    children: [ ]
};

export default new Store( { ast: emptyTree, tokens: emptyTree, selection: null });