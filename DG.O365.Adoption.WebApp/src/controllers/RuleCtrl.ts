/// <reference path='../typings/angular.d.ts' />

module ruleengine {

    export class RuleCtrl {
        public static $inject = ['$scope', 'ruleService'];

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
                        console.log("changed")
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
