/// <reference path='../typings/angular.d.ts' />

module ruleengine {

    export class RuleCtrl {
        public static $inject = ['$scope', 'ruleService', 'ruleTemplateService'];


        constructor(
            private $scope: IRuleScope,
            private ruleService: IRuleService,
            private ruleTemplateService: IRuleTemplateService
        ) {
            var defaultQuestion: Question = { Id: 1, Choices: [{ ChoiceValue: "Yes", Text: "Do you want to know more about this?", NextQuestionNo: 0 }, { ChoiceValue: "No", Text: "All right! Have a good day!", NextQuestionNo: 0 }] };

            $scope.rules = [];
            $scope.newRule = {};
            $scope.editmode = false;
            $scope.isOpen = false;
            $scope.groups = [];
            $scope.users = [];
            $scope.questions = [];
            $scope.questions.push(defaultQuestion);
            var currentQno: number = 1;

            $scope.addChoice = (question: Question) => {
                question.Choices.push({ ChoiceValue: "", Text: "", NextQuestionNo: 0 });
            }

            $scope.appendDialog = () => {
                $scope.newRule.dialog = ruleTemplateService.getQuestionTemplate($scope.questions);

            }

            $scope.addQuestion = (choice: Choice) => {
                currentQno += 1;
                choice.NextQuestionNo = currentQno;
                var nextQuestion: Question = { Id: currentQno, Choices: [{ ChoiceValue: "", Text: "", NextQuestionNo: 0 }, { ChoiceValue: "", Text: "", NextQuestionNo: 0 }] };
                $scope.questions.push(nextQuestion);
            }

            $scope.removeQuestion = (choice: Choice) => {

                var qNumber = choice.NextQuestionNo;
                choice.NextQuestionNo = 0;
                for (var i = 0; i < $scope.questions.length; i++) {
                    for (var k = 0; k < $scope.questions[i].Choices.length; k++) {
                        if ($scope.questions[i].Choices[k].NextQuestionNo == qNumber) {
                            $scope.questions[i].Choices[k].NextQuestionNo = 0;
                        }
                    }
                    if ($scope.questions[i].Id == qNumber) {
                        $scope.questions.splice(i, 1);
                    }
                }
            }

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