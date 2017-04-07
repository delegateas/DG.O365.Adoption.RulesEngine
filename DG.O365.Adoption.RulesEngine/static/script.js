var ruleengine;
(function (ruleengine) {
    var RuleCtrl = (function () {
        function RuleCtrl($scope, ruleService, ruleTemplateService, $timeout) {
            this.$scope = $scope;
            this.ruleService = ruleService;
            this.ruleTemplateService = ruleTemplateService;
            this.$timeout = $timeout;
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
            ];
            var currentQno = 1;
            var fillDefaultQuestion = function () {
                var defaultQuestion = { Id: 1, Choices: [{ ChoiceValue: "Yes", Text: "Do you want to know more about this?", NextQuestionNo: 0 }, { ChoiceValue: "No", Text: "All right! Have a good day!", NextQuestionNo: 0 }] };
                $scope.questions = [];
                $scope.questions.push(defaultQuestion);
            };
            $scope.addChoice = function (question) {
                question.Choices.push({ ChoiceValue: "", Text: "", NextQuestionNo: 0 });
            };
            $scope.removeChoice = function (question, index) {
                question.Choices.splice(index, 1);
            };
            $scope.addQuestion = function (choice) {
                currentQno++;
                choice.NextQuestionNo = currentQno;
                var nextQuestion = { Id: currentQno, Choices: [{ ChoiceValue: "", Text: "", NextQuestionNo: 0 }, { ChoiceValue: "", Text: "", NextQuestionNo: 0 }] };
                $scope.questions.push(nextQuestion);
            };
            $scope.removeQuestion = function (choice) {
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
            };
            var getGroups = function () {
                ruleService.getList("groups").then(function (data) {
                    $scope.groups = data.data;
                }).catch(function (err) {
                    alert("Error! Failed to load groupes.");
                    console.log("Error has occured: " + err);
                });
            };
            var load = function () {
                fillDefaultQuestion();
                ruleService.getList("rules").then(function (data) {
                    $scope.rules = data.data;
                }).catch(function (err) {
                    alert("Error! Failed to load rules.");
                    console.log("Error has occured: " + err);
                });
            };
            var getUsers = function () {
                ruleService.getList("users").then(function (data) {
                    $scope.users = data.data;
                }).catch(function (err) {
                    alert("Error! Failed to load users.");
                    console.log("Error has occured: " + err);
                });
            };
            $scope.open = function () {
                if (!$scope.editmode) {
                    $scope.isOpen = !$scope.isOpen;
                }
                $scope.newRule = {};
                $scope.editmode = false;
                fillDefaultQuestion();
            };
            $scope.cancel = function () {
                $scope.isOpen = false;
                $scope.editmode = false;
                $scope.newRule = {};
                $scope.selectedGroup = $scope.selectedUser = "";
                fillDefaultQuestion();
                $scope.createNewDialog = false;
                $scope.isOpen = false;
                $scope.showCode = false;
            };
            $scope.toggleShowCode = function () {
                $scope.showCode = !$scope.showCode;
            };
            $scope.toEditmode = function (rule) {
                $scope.isOpen = true;
                $scope.editmode = !$scope.editmode;
                $scope.newRule = angular.copy(rule);
                if (rule.isGroup) {
                    $scope.selectedGroup = searchselectedUserOrGroup($scope.groups, rule.receiverName);
                }
                else {
                    $scope.selectedUser = searchselectedUserOrGroup($scope.users, rule.receiverName);
                }
            };
            var searchselectedUserOrGroup = function (collection, name) {
                var returnval = null;
                angular.forEach(collection, function (x, y) {
                    if (x.displayName == name) {
                        returnval = x;
                    }
                });
                return returnval;
            };
            $scope.create = function (rule) {
                console.log(rule);
                if ($scope.selectedGroup.objectId == undefined && $scope.selectedUser.objectId == undefined) {
                    alert("Please select at least one group or user");
                }
                else {
                    rule = acquireReceiver(rule);
                    ruleService.addRule(rule).then(function () {
                        $scope.cancel();
                        $scope.ruleAlert = "Rule \"" + rule.name + "\" has been added successfully!";
                        $scope.showRuleAlert = true;
                        $timeout(function () { $scope.showRuleAlert = false; }, 3000);
                        load();
                        $scope.selectedGroup = $scope.selectedUser = "";
                    }).catch(function (err) {
                        alert("Error! Rule has not been added.");
                        console.log("Error has occured: " + err);
                    });
                }
            };
            $scope.testDialog = function (rule) {
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
                    };
                    ruleService.testDialog(testData).then(function () {
                        $scope.showSentAlert = true;
                        $timeout(function () { $scope.showSentAlert = false; }, 3000);
                    }).catch(function (err) {
                        alert("Error! Test data has not been sent.");
                        console.log("Error has occured: " + err);
                    });
                }
            };
            var acquireReceiver = function (rule) {
                if ($scope.selectedGroup != undefined && $scope.selectedGroup.objectId != null) {
                    rule.isGroup = 1;
                    rule.receiverObjectId = $scope.selectedGroup.objectId;
                    rule.receiverName = $scope.selectedGroup.displayName;
                }
                else {
                    rule.isGroup = 0;
                    rule.receiverObjectId = $scope.selectedUser.objectId;
                    rule.receiverName = $scope.selectedUser.displayName;
                }
                return rule;
            };
            $scope.edit = function (rule) {
                if (($scope.selectedGroup == undefined || $scope.selectedGroup.objectId == null) && ($scope.selectedUser == undefined || $scope.selectedUser.objectId == null)) {
                    alert("Please select at least one group or user");
                }
                else {
                    rule = acquireReceiver(rule);
                    ruleService.editRule(rule).then(function () {
                        $scope.cancel();
                        $scope.ruleAlert = "Rule \"" + rule.name + "\" has been changed successfully!";
                        $scope.showRuleAlert = true;
                        $timeout(function () { $scope.showRuleAlert = false; }, 3000);
                        load();
                    })
                        .catch(function (err) {
                        alert("Error! Rule has not been changed.");
                        console.log("Error has occured: " + err);
                    });
                }
            };
            $scope.delete = function (rule) {
                ruleService.deleteRule(rule).then(function () {
                    $scope.cancel();
                    $scope.ruleAlert = "Rule \"" + rule.name + "\" has been deleted successfully!";
                    $scope.showRuleAlert = true;
                    $timeout(function () { $scope.showRuleAlert = false; }, 3000);
                    load();
                })
                    .catch(function (err) {
                    alert("Error! Rule has not been deleted.");
                    console.log("Error has occured: " + err);
                });
            };
            $scope.$watch('isUserFocused', function (newValue, oldValue) {
                if (newValue) {
                    $scope.selectedGroup = "";
                }
            });
            $scope.$watch('isGroupFocused', function (newValue, oldValue) {
                if (newValue) {
                    $scope.selectedUser = "";
                }
            });
            $scope.$watch('questions', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    console.log($scope.questions);
                    $scope.newRule.dialog = ruleTemplateService.getQuestionTemplate($scope.questions);
                    $scope.questionNumbers = [];
                    angular.forEach($scope.questions, function (val, key) {
                        $scope.questionNumbers.push(val.Id);
                    });
                }
            }, true);
            load();
            getGroups();
            getUsers();
        }
        RuleCtrl.$inject = ['$scope', 'ruleService', 'ruleTemplateService', '$timeout'];
        return RuleCtrl;
    }());
    ruleengine.RuleCtrl = RuleCtrl;
    angular.module('ruleApp', ['ui.bootstrap', 'officeuifabric.core', 'officeuifabric.components', 'officeuifabric.components.table'])
        .controller('ruleCtrl', RuleCtrl);
})(ruleengine || (ruleengine = {}));
var ruleengine;
(function (ruleengine) {
    var RuleService = (function () {
        function RuleService($http) {
            var _this = this;
            this.$http = $http;
            this.getList = function (type) {
                var url = '/api/' + type;
                var promise = _this.$http.get(url)
                    .then(function (data) {
                    return data;
                }).
                    catch(function (errdata) {
                    return errdata;
                });
                return promise;
            };
            this.addRule = function (rule) {
                var url = '/api/rules';
                var postData = rule;
                var promise = _this.$http.post(url, postData).
                    then(function (data) {
                    return data;
                }).
                    catch(function (errdata) {
                    console.log("failed");
                    throw errdata;
                });
                return promise;
            };
            this.editRule = function (rule) {
                var url = '/api/rules';
                var putData = rule;
                var promise = _this.$http.put(url, putData).
                    then(function (data) {
                    return data;
                }).
                    catch(function (errdata) {
                    throw errdata;
                });
                return promise;
            };
            this.deleteRule = function (rule) {
                var url = '/api/rules?name=' + encodeURIComponent(rule.name);
                var deleteData = rule;
                var promise = _this.$http.delete(url).
                    then(function (data) {
                    return data;
                }).
                    catch(function (errdata) {
                    throw errdata;
                });
                return promise;
            };
            this.testDialog = function (testData) {
                var url = '/api/testdialog';
                _this.$http.defaults.headers.post = {
                    'Content-Type': 'application/json'
                };
                var promise = _this.$http.post(url, testData).
                    then(function (data) {
                    return data;
                }).
                    catch(function (errdata) {
                    throw errdata;
                });
                return promise;
            };
        }
        RuleService.$inject = ['$http'];
        return RuleService;
    }());
    ruleengine.RuleService = RuleService;
    angular.module('ruleApp')
        .service('ruleService', RuleService);
})(ruleengine || (ruleengine = {}));
var ruleengine;
(function (ruleengine) {
    var RuleTemplateService = (function () {
        function RuleTemplateService() {
            var _this = this;
            this.getQuestionTemplate = function (questions) {
                var temp = _this.upperPart;
                for (var k = 0; k < questions.length; k++) {
                    var question = questions[k];
                    if (question.Id == 1) {
                        temp += '    ' + _this.questionTitle + '1(IDialogContext context, string text)\n'
                            + '    {\n';
                    }
                    else {
                        temp += '    ' + _this.questionTitle + question.Id + '(IDialogContext context, IAwaitable<string> answer){\n'
                            + '    var text = await answer;\n';
                    }
                    for (var i = 0; i < question.Choices.length; i++) {
                        var choice = question.Choices[i];
                        if (i != 0) {
                            temp += '    else';
                        }
                        else {
                            temp += '    var message="";\n';
                        }
                        var choiceValLower = choice.ChoiceValue.toLowerCase();
                        temp += '    if (text.ToLower().Contains( "' + choiceValLower + '")) \n'
                            + '    {\n'
                            + ' message = "' + choice.Text + '"; ';
                        if (choice.NextQuestionNo > 0) {
                            var nextQ = _this.findNextQuestion(questions, choice.NextQuestionNo);
                            var choiceStr = '';
                            if (nextQ != null) {
                                for (var j = 0; j < nextQ.Choices.length; j++) {
                                    choiceStr += ',"' + nextQ.Choices[j].ChoiceValue + '"';
                                }
                                choiceStr = choiceStr.substr(1);
                                temp += '    string[] choices = {' + choiceStr + '};\n'
                                    + '    var prompt = new PromptDialog.PromptString(message, "I didn\'t understand your answer.", 3);\n'
                                    + '    context.Call(prompt, Question' + choice.NextQuestionNo + ');\n'
                                    + '    return;\n'
                                    + '    }\n';
                            }
                        }
                        else {
                            temp += '    await context.PostAsync(message);\n'
                                + '    context.Wait(MessageReceivedAsync);\n'
                                + '    }\n';
                        }
                    }
                    temp += '    else\n    {\n'
                        + '    await context.PostAsync("Sorry, I didn\'t understand your answer"); \n'
                        + '    context.Wait(MessageReceivedAsync);\n'
                        + '    }\n';
                    temp += '  }\n\n';
                }
                temp += '}\n}';
                return temp;
            };
            this.findNextQuestion = function (questions, nextQId) {
                var nQuestion = null;
                angular.forEach(questions, function (value, key) {
                    if (value.Id == nextQId) {
                        nQuestion = value;
                    }
                });
                return nQuestion;
            };
            this.questionTitle = 'public async Task Question';
            this.upperPart = 'using Microsoft.Bot.Builder.Dialogs;\nusing Microsoft.Bot.Connector;\nusing System;\nusing System.Threading.Tasks;\n\nnamespace Bot.Dialog\n' +
                '{\n  [Serializable]\n' +
                '  public class ExampleDialog : IDialog<object> {\n' +
                '    public async Task StartAsync(IDialogContext context)\n' +
                '    {\n      context.Wait(MessageReceivedAsync);\n    }\n\n' +
                '    public async Task MessageReceivedAsync(IDialogContext context, IAwaitable <IMessageActivity> argument)\n' +
                '    {\n      var message = await argument;\n' +
                '      await Question1(context, message.Text);\n' +
                '      return;\n    }\n';
        }
        return RuleTemplateService;
    }());
    ruleengine.RuleTemplateService = RuleTemplateService;
    angular.module('ruleApp')
        .service('ruleTemplateService', RuleTemplateService);
})(ruleengine || (ruleengine = {}));
//# sourceMappingURL=script.js.map