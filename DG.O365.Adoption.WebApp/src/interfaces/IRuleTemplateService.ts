module ruleengine {
    export interface IRuleTemplateService {
        getQuestionTemplate (questions:Question[]): string;
    }
} 