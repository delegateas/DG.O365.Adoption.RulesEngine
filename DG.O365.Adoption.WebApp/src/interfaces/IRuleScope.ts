module ruleengine{
    export interface IRuleScope extends ng.IScope {
        rules: any;
        newRule: any;
        editmode: boolean;
        isOpen:boolean;
        open(): void;
        cancel(): void;
        toEditmode(rule: any): void;
        create(rule: any): void;
        edit(rule: any): void;
        delete(rule: any): void;
        testDialog(rule: any): void;
        getUsers(): void;
        getGroups(): void;
        groups: any;
        users: any;
        selectedGroup: any;
        selectedUser: any;       
        testReceiver: string;
        addQuestion(choice: Choice): void;
        removeQuestion(choice: Choice): void;
        addChoice(question: Question): void;
        questions: Question[];
        customDialog: string;
        appendDialog(): void;      
}}