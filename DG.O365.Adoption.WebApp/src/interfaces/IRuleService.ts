module ruleengine {
    export interface IRuleService {
        getList(type:string): ng.IPromise<any>;
        addRule(rule: any): ng.IPromise<any>
        editRule(rule: any): ng.IPromise<any>
        deleteRule(rule: any): ng.IPromise<any>
       
    }
}