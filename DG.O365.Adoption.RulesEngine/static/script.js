var ruleengine;
(function (ruleengine) {
    var RuleCtrl = (function () {
        function RuleCtrl($scope, $http) {
            this.$scope = $scope;
            this.$http = $http;
            $scope.rules = [];
            $scope.newRule = {};
            $scope.editmode = false;
            $scope.isOpen = false;
            $scope.groups = [];
            $scope.users = [];
            var getGroups = function () {
                $http.get('/api/groups').then(function (data) {
                    $scope.groups = data.data;
                });
            };
            var load = function () {
                $http.get('/api/rules').then(function (data) {
                    $scope.rules = data.data;
                });
            };
            var getUsers = function () {
                $http.get('/api/users').then(function (data) {
                    $scope.users = data.data;
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
                if ($scope.editmode) {
                }
                $scope.editmode = false;
                $scope.newRule = {};
            };
            $scope.toEditmode = function (rule) {
                console.log(rule);
                $scope.isOpen = true;
                $scope.editmode = !$scope.editmode;
                $scope.newRule = angular.copy(rule);
                if (rule.isGroup) {
                    $scope.selectedGroup = rule.receiverName;
                }
                else {
                    $scope.selectedUser = rule.receiverName;
                }
            };
            $scope.create = function (rule) {
                if ($scope.selectedGroup.objectId == null && $scope.selectedUser.objectId == null) {
                    alert("Please select at least one group or user");
                }
                else {
                    rule = acquireReceiver(rule);
                    $http.post('/api/rules', rule).then(function () {
                        $scope.cancel();
                        alert("Rule \"" + rule.name + "\" has been added successfully!");
                        load();
                        $scope.selectedGroup = $scope.selectedUser = "";
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
                    $http.put('/api/rules', rule).then(function () {
                        $scope.cancel();
                        console.log("changed");
                        alert("Rule \"" + rule.name + "\" has been changed successfully!");
                        load();
                    });
                }
            };
            $scope.delete = function (rule) {
                $http.delete('/api/rules?name=' + rule.name).then(function () {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been deleted successfully!");
                    load();
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
        RuleCtrl.$inject = ['$scope', '$http'];
        return RuleCtrl;
    }());
    ruleengine.RuleCtrl = RuleCtrl;
    angular.module('ruleApp', ['ui.bootstrap', 'officeuifabric.core', 'officeuifabric.components', 'officeuifabric.components.table'])
        .controller('ruleCtrl', RuleCtrl);
})(ruleengine || (ruleengine = {}));
//# sourceMappingURL=script.js.map