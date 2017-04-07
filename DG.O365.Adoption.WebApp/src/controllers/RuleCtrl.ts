/// <reference path='../typings/angular.d.ts' />

module ruleengine {

    export class RuleCtrl {
        public static $inject = ['$scope', 'ruleService', 'ruleTemplateService', '$timeout'];


        constructor(
            private $scope: IRuleScope,
            private ruleService: IRuleService,
            private ruleTemplateService: IRuleTemplateService,
            private $timeout: ng.ITimeoutService
        ) {

            $scope.rules = [];
            $scope.questionNumbers = [1];
            $scope.newRule = {};
            $scope.editmode = false;
            $scope.isOpen = false;
            $scope.groups = [];
            $scope.users = [];
            $scope.selectedGroup = $scope.selectedUser = "";
            $scope.showCode = false;
            $scope.showRuleAlert = false;
            $scope.showSentAlert = false;
            $scope.createNewDialog = false;
            $scope.ruleAlert = "";
            $scope.queries = [
                "Operation eq 'SharingSet'",
                "Operation eq 'UserLoggedIn'",
                "ServiceType eq 'SharePoint' and Operation eq 'FileAccessed'",
                "ServiceType eq 'SharePoint' and Operation eq 'FileUploaded'",
                "ServiceType eq 'SharePoint' and Operation eq 'FileCheckedIn' or Operation eq 'FileCheckedOut'",
                "ServiceType eq 'SharePoint' and Operation eq 'FileCopied'",
                "ServiceType eq 'SharePoint' and Operation eq 'FileSyncDownloadedPartial' or Operation eq 'FileSyncDownloadedFull'",
                "ServiceType eq 'Yammer' and Operation eq 'FileCreated'",
                "ServiceType eq 'Yammer' and Operation eq 'GroupCreation'",
                "ServiceType eq 'PowerBI' and Operation eq 'ViewReport'",
                "ServiceType eq 'PowerBI' and Operation eq 'CreateDashboard'"
            ]
            var currentQno: number = 1;
            var fillDefaultQuestion = () => {
                var defaultQuestion: Question = { Id: 1, Choices: [{ ChoiceValue: "Yes", Text: "Do you want to know more about this?", NextQuestionNo: 0 }, { ChoiceValue: "No", Text: "All right! Have a good day!", NextQuestionNo: 0 }] };
                $scope.questions = [];
                $scope.questions.push(defaultQuestion);

            }
            $scope.addChoice = (question: Question) => {
                question.Choices.push({ ChoiceValue: "", Text: "", NextQuestionNo: 0 });
            }
            $scope.removeChoice = (question: Question, index: number) => {
                question.Choices.splice(index, 1);

            }



            $scope.addQuestion = (choice: Choice) => {
                currentQno++;
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
                fillDefaultQuestion();
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
                fillDefaultQuestion();
            }

            $scope.cancel = () => {
                $scope.isOpen = false;
                $scope.editmode = false;
                $scope.newRule = {};
                $scope.selectedGroup = $scope.selectedUser = "";
                fillDefaultQuestion();
                $scope.createNewDialog = false;
                $scope.isOpen = false;
                $scope.showCode = false;
            }
            $scope.toggleShowCode = () => {
                $scope.showCode = !$scope.showCode;
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
                console.log(rule)
                if ($scope.selectedGroup.objectId == undefined && $scope.selectedUser.objectId == undefined) {
                    alert("Please select at least one group or user")
                }
                else {
                    rule = acquireReceiver(rule);
                    ruleService.addRule(rule).then(() => {
                        $scope.cancel();
                        $scope.ruleAlert = "Rule \"" + rule.name + "\" has been added successfully!";
                        $scope.showRuleAlert = true;
                        $timeout(() => { $scope.showRuleAlert = false; }, 3000);
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
                        $scope.showSentAlert = true;
                        $timeout(() => { $scope.showSentAlert = false; }, 3000);
                    }).catch((err) => {
                        alert("Error! Test data has not been sent.");
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
                        $scope.ruleAlert = "Rule \"" + rule.name + "\" has been changed successfully!";
                        $scope.showRuleAlert = true;
                        $timeout(() => { $scope.showRuleAlert = false; }, 3000);

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
                    $scope.ruleAlert = "Rule \"" + rule.name + "\" has been deleted successfully!";
                    $scope.showRuleAlert = true;
                    $timeout(() => { $scope.showRuleAlert = false; }, 3000);
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
            $scope.$watch('questions', (newValue: any, oldValue: any) => {
                if (newValue != oldValue) {
                    console.log($scope.questions)
                    $scope.newRule.dialog = ruleTemplateService.getQuestionTemplate($scope.questions);
                    $scope.questionNumbers = [];
                    angular.forEach($scope.questions, (val, key) => {
                        $scope.questionNumbers.push(val.Id);

                    });
                }
            }, true);

            load();
            getGroups();
            getUsers();

        }

    }
    angular.module('ruleApp', ['ui.bootstrap', 'officeuifabric.core', 'officeuifabric.components', 'officeuifabric.components.table'])
        .controller('ruleCtrl', RuleCtrl);
}