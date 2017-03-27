/// <reference path='../typings/angular.d.ts' />

module ruleengine {

    export class RuleCtrl {
        public static $inject = ['$scope', 'ruleService'];
        private upperPart: string = 'using Microsoft.Bot.Builder.Dialogs;\nusing Microsoft.Bot.Connector;\nusing System;\nusing System.Threading.Tasks;\n\nnamespace Bot.Dialog\n' +
        '{\n  [Serializable]\n' +
        '  public class ExampleDialog : IDialog < object >{\n' +
        '    public async Task StartAsync(IDialogContext context)\n' +
        '    {\n      context.Wait(MessageReceivedAsync);\n    }\n\n' +
        '    public async Task MessageReceivedAsync(IDialogContext context, IAwaitable < IMessageActivity > argument)\n' +
        '    {\n      var message = await argument;\n' +
        '      await Question1(context, message.Text);\n' +
        '      return;\n    }\n';

        private questionTitle: string = 'public async Task Question'; //and add number after "Question"

        private questionYNPart1: string = '(IDialogContext context, string text)\n{if (text.toLower() == "yes")\n { string message =';//add question

        private questionYNPart2: string = ';\n' //message line closing
        + 'var prompt = new PromptDialog.PromptConfirm(message, "I didn\'t understand your answer.", 3);'
        + ' context.Call(prompt, Question' + (this.$scope.questionCount+1) +');'
        + 'return;'
        + '}'
        + 'else if (text == "'//insert text
        + '") { await context.PostAsync("'//insert text
        + '");'
        + 'context.Wait(MessageReceivedAsync);'
        + '}}';

        constructor(
            private $scope: IRuleScope,
            private ruleService: IRuleService
        ) {
            $scope.rules = [];
            $scope.newRule = {};
            $scope.editmode = false;
            $scope.isOpen = false;
            $scope.groups = [];
            $scope.users = [];
            $scope.questionCount = 1;
            $scope.questions = [{ id: 1, placeholder: "your Question"}];
            $scope.customDialog = this.upperPart;

            var getGroups = () => {
                ruleService.getList("groups").then((data) => {
                    $scope.groups = data.data;
                }).catch((err) => {
                    alert("Error! Failed to load groupes.");
                    console.log("Error has occured: " + err);
                });
            }

            var load = () => {
                ruleService.getList("rules").then((data) => {
                    $scope.rules = data.data;
                }).catch((err) => {
                    alert("Error! Failed to load rules.");
                    console.log("Error has occured: " + err);
                });
            };

            var getUsers = () => {
                ruleService.getList("users").then((data) => {
                    $scope.users = data.data;
                }).catch((err) => {
                    alert("Error! Failed to load users.");
                    console.log("Error has occured: " + err);
                });
            }

            $scope.open = () => {
                if (!$scope.editmode) {
                    $scope.isOpen = !$scope.isOpen;
                }
                $scope.newRule = {};
                $scope.editmode = false;
            }

            $scope.cancel = () => {
                $scope.isOpen = false;
                $scope.editmode = false;
                $scope.newRule = {};
                $scope.selectedGroup = $scope.selectedUser = "";
            }

            $scope.toEditmode = (rule) => {
                console.log(rule)
                $scope.isOpen = true;
                $scope.editmode = !$scope.editmode;
                $scope.newRule = angular.copy(rule);
                if (rule.isGroup) {
                    $scope.selectedGroup = searchselectedUserOrGroup($scope.groups, rule.receiverName);
                } else {
                    $scope.selectedUser = searchselectedUserOrGroup($scope.users, rule.receiverName);
                }
            }

            var searchselectedUserOrGroup = (collection: any, name: string) => {
                var returnval = null;
                angular.forEach(collection, (x, y) => {
                    if (x.displayName == name) {
                        returnval = x;
                    }
                });
                return returnval;
            }

            $scope.create = (rule) => {
                if ($scope.selectedGroup.objectId == null && $scope.selectedUser.objectId == null) {
                    alert("Please select at least one group or user")
                }
                else {
                    rule = acquireReceiver(rule);
                    ruleService.addRule(rule).then(() => {
                        $scope.cancel();
                        alert("Rule \"" + rule.name + "\" has been added successfully!");
                        load();
                        $scope.selectedGroup = $scope.selectedUser = "";
                    }).catch((err) => {
                        alert("Error! Rule has not been added.");
                        console.log("Error has occured: " + err);
                    });
                }
            }

            $scope.testDialog = (rule) => {
                if (!$scope.testReceiver) {
                    alert("Please enter the email of the test receiver");
                }
                else if (!$scope.testReceiver.match('@')) {
                    alert("Please enter a valid email address.");
                }
                else {
                    var testData = {
                        userId: $scope.testReceiver,
                        message: rule.message,
                        ruleName: rule.name,
                        dialog: rule.dialog
                    }
                    ruleService.testDialog(testData).then(() => {
                        alert("test data sent!");
                    }).catch((err) => {
                        alert("Error! Rule has not been added.");
                        console.log("Error has occured: " + err);
                    });
                }
            }

            var acquireReceiver = (rule) => {
                if ($scope.selectedGroup != undefined && $scope.selectedGroup.objectId != null) {
                    rule.isGroup = 1;
                    rule.receiverObjectId = $scope.selectedGroup.objectId;
                    rule.receiverName = $scope.selectedGroup.displayName;
                } else {
                    rule.isGroup = 0;
                    rule.receiverObjectId = $scope.selectedUser.objectId;
                    rule.receiverName = $scope.selectedUser.displayName;
                }
                return rule;
            }

            $scope.edit = (rule) => {
                if (($scope.selectedGroup == undefined || $scope.selectedGroup.objectId == null) && ($scope.selectedUser == undefined || $scope.selectedUser.objectId == null)) {
                    alert("Please select at least one group or user")
                } else {
                    rule = acquireReceiver(rule);
                    ruleService.editRule(rule).then(() => {
                        $scope.cancel();
                        alert("Rule \"" + rule.name + "\" has been changed successfully!");
                        load();
                    })
                        .catch((err) => {
                            alert("Error! Rule has not been changed.");
                            console.log("Error has occured: " + err);
                        });
                }
            }

            $scope.delete = (rule) => {
                ruleService.deleteRule(rule).then(() => {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been deleted successfully!")
                    load();
                })
                    .catch((err) => {
                        alert("Error! Rule has not been deleted.");
                        console.log("Error has occured: " + err);
                    });
            }

            $scope.$watch('isUserFocused', (newValue: boolean, oldValue: boolean) => {
                if (newValue) {
                    $scope.selectedGroup = "";
                }
            });

            $scope.$watch('isGroupFocused', (newValue: boolean, oldValue: boolean) => {
                if (newValue) {
                    $scope.selectedUser = "";
                }
            });
            load();
            getGroups();
            getUsers();
        }
    }

    angular.module('ruleApp', ['ui.bootstrap', 'officeuifabric.core', 'officeuifabric.components', 'officeuifabric.components.table'])
        .controller('ruleCtrl', RuleCtrl);
}
