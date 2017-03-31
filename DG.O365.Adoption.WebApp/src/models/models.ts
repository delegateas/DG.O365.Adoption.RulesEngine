module ruleengine {
    export interface Choice {
        ChoiceValue: string;
        Text: string;
        NextQuestionNo: number;
    }
    export interface Question {
        Id: number;
        Choices: Choice[];       
       
    }
}