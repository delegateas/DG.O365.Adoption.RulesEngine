var ruleengine;
(function (ruleengine) {
    var RuleCtrl = (function () {
        function RuleCtrl($scope, ruleService) {
            this.$scope = $scope;
            this.ruleService = ruleService;
            $scope.rules = [];
            $scope.newRule = {};
            $scope.editmode = false;
            $scope.isOpen = false;
            $scope.groups = [];
            $scope.users = [];
            var getGroups = function () {
                ruleService.getList("groups").then(function (data) {
                    $scope.groups = data.data;
                }).catch(function (err) {
                    alert("Error! Failed to load groupes.");
                    console.log("Error has occured: " + err);
                });
            };
            var load = function () {
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
            };
            $scope.cancel = function () {
                $scope.isOpen = false;
                $scope.editmode = false;
                $scope.newRule = {};
                $scope.selectedGroup = $scope.selectedUser = "";
            };
            $scope.toEditmode = function (rule) {
                console.log(rule);
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
                if ($scope.selectedGroup.objectId == null && $scope.selectedUser.objectId == null) {
                    alert("Please select at least one group or user");
                }
                else {
                    rule = acquireReceiver(rule);
                    ruleService.addRule(rule).then(function () {
                        $scope.cancel();
                        alert("Rule \"" + rule.name + "\" has been added successfully!");
                        load();
                        $scope.selectedGroup = $scope.selectedUser = "";
                    }).catch(function (err) {
                        alert("Error! Rule has not been added.");
                        console.log("Error has occured: " + err);
                    });
                }
            };
            var acquireReceiver = function (rule) {
                if ($scope.selectedGroup.objectId != null) {
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
                if ($scope.selectedGroup.objectId == null && $scope.selectedUser.objectId == null) {
                    alert("Please select at least one group or user");
                }
                else {
                    rule = acquireReceiver(rule);
                    ruleService.editRule(rule).then(function () {
                        $scope.cancel();
                        console.log("changed");
                        alert("Rule \"" + rule.name + "\" has been changed successfully!");
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
                    alert("Rule \"" + rule.name + "\" has been deleted successfully!");
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
            load();
            getGroups();
            getUsers();
        }
        RuleCtrl.$inject = ['$scope', 'ruleService'];
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
                    return errdata;
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
                    return errdata;
                });
                return promise;
            };
            this.deleteRule = function (rule) {
                var url = '/api/rules';
                var deleteData = rule;
                var promise = _this.$http.delete(url, deleteData).
                    then(function (data) {
                    return data;
                }).
                    catch(function (errdata) {
                    return errdata;
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
//# sourceMappingURL=script.js.map