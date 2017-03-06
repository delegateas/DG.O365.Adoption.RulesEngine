/// <reference path='../typings/angular.d.ts' />

module ruleengine {

    export class RuleCtrl {
        public static $inject = ['$scope', '$http'];

        constructor(
            private $scope: IRuleScope,
            private $http: ng.IHttpService
        ) {
            $scope.rules = [];
            $scope.newRule = {};
            $scope.editmode = false;
            $scope.isOpen = false;
            $scope.groups = [];
            $scope.users = [];
            var getGroups = () => {
                $http.get('/api/groups').then((data) => {
                    $scope.groups = data.data;
                });
            }

            var load = () => {
                $http.get('/api/rules').then((data) => {
                    $scope.rules = data.data;
                });
            };

            var getUsers = () => {
                $http.get('/api/users').then((data) => {
                    $scope.users = data.data;
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
                if ($scope.editmode) {

                }
                $scope.editmode = false;
                $scope.newRule = {};
            }

            $scope.toEditmode = (rule) => {
                console.log(rule)
                $scope.isOpen = true;
                $scope.editmode = !$scope.editmode;
                $scope.newRule = angular.copy(rule);
                if (rule.isGroup) {
                    $scope.selectedGroup = rule.receiverName
                } else {
                    $scope.selectedUser = rule.receiverName
                }
            }

            $scope.create = (rule) => {
                if ($scope.selectedGroup.objectId == null && $scope.selectedUser.objectId == null) {
                    alert("Please select at least one group or user")
                } else {

                    rule = acquireReceiver(rule);

                    $http.post('/api/rules', rule).then(() => {
                        $scope.cancel();
                        alert("Rule \"" + rule.name + "\" has been added successfully!");
                        load();
                        $scope.selectedGroup = $scope.selectedUser = "";
                    });
                }
            }

            var acquireReceiver = (rule) => {
                if ($scope.selectedGroup.objectId != null) {
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
                if ($scope.selectedGroup.objectId == null && $scope.selectedUser.objectId == null) {
                    alert("Please select at least one group or user")
                } else {
                    rule = acquireReceiver(rule);
                    $http.put('/api/rules', rule).then(() => {
                        $scope.cancel();
                        console.log("changed")
                        alert("Rule \"" + rule.name + "\" has been changed successfully!");
                        load();
                    });
                }
            }

            $scope.delete = (rule) => {
                $http.delete('/api/rules?name=' + rule.name).then(() => {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been deleted successfully!")
                    load();
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
