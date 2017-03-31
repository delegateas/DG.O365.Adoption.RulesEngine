module ruleengine {
    export class RuleTemplateService implements IRuleTemplateService {
        constructor(
        ) {

        }
        getQuestionTemplate = (questions: Question[]) => {
            var temp = this.upperPart;

            for (var k = 0; k < questions.length; k++) {
                var question = questions[k];

                if (question.Id == 1) {

                    temp += '    ' + this.questionTitle + '1(IDialogContext context, string text)\n'
                    '    {\n';
                }
                else {
                    temp += '    ' + this.questionTitle + question.Id + '(IDialogContext context, IAwaitable<string> answer){\n'
                        + '    var text = await answer;\n';
                }
                for (var i = 0; i < question.Choices.length; i++) {
                    var choice = question.Choices[i];
                    if (i != 0) {
                        temp += '    else';
                    }
                    var choiceValLower = choice.ChoiceValue.toLowerCase();
                    temp += '    if (text.toLower() == "' + choiceValLower + '") \n'
                        + '    {\n    string message ="' + choice.Text + '";\n';

                    if (choice.NextQuestionNo > 0) {
                        var nextQ = this.findNextQuestion(questions, choice.NextQuestionNo);
                        var choiceStr = '';
                        if (nextQ != null) {
                            for (var j = 0; j < nextQ.Choices.length; j++) {
                                choiceStr += ',"' + nextQ.Choices[j].ChoiceValue + '"';
                            }
                            choiceStr = choiceStr.substr(1);

                            temp += '    string[] choices = {' + choiceStr + '};\n'
                                + '    var prompt = new PromptDialog.PromptChoice<string>(choices, message, "I didn\'t understand your answer.", 3);\n'
                                + '    context.Call(prompt, Question' + choice.NextQuestionNo + ');\n'
                                + '    return;\n'
                                + '    }\n'

                        }
                    }
                    else {
                        temp += '    await context.PostAsync(message);\n'
                            + '    context.Wait(MessageReceivedAsync);\n'
                            + '    }\n';
                    }
                }
                if (questions[k].Id == 1) {

                    temp += '    else\n    {\n'
                        + '    await context.PostAsync("Sorry, I didn\'t understand your answer"); \n'
                        + '    context.Wait(MessageReceivedAsync);\n'
                        + '    }\n';


                }
                temp += '  }\n\n';
            }
            temp += '}';
            return temp;
        }

        findNextQuestion = (questions: Question[], nextQId: number): Question => {
            angular.forEach(questions, (value: Question, key: number) => {
                if (value.Id == nextQId) {
                    return value;
                }
            });
            return null;
        }

        private questionTitle: string = 'public async Task Question';

        private upperPart: string = 'using Microsoft.Bot.Builder.Dialogs;\nusing Microsoft.Bot.Connector;\nusing System;\nusing System.Threading.Tasks;\n\nnamespace Bot.Dialog\n' +
        '{\n  [Serializable]\n' +
        '  public class ExampleDialog : IDialog < object >{\n' +
        '    public async Task StartAsync(IDialogContext context)\n' +
        '    {\n      context.Wait(MessageReceivedAsync);\n    }\n\n' +
        '    public async Task MessageReceivedAsync(IDialogContext context, IAwaitable < IMessageActivity > argument)\n' +
        '    {\n      var message = await argument;\n' +
        '      await Question1(context, message.Text);\n' +
        '      return;\n    }\n';


    }

    angular.module('ruleApp')
        .service('ruleTemplateService', RuleTemplateService);
}