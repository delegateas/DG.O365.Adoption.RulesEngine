module ruleengine{
    export interface IRuleScope extends ng.IScope {
        rules: any;
        newRule: {};
        editmode: boolean;
        isOpen:boolean;
        open(): void;
        cancel(): void;
        toEditmode(rule: any): void;
        create(rule: any): void;
        edit(rule: any): void;
        delete(rule: any): void;

}}