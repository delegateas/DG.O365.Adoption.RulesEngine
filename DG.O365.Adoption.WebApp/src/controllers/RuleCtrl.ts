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
                $http.get('/api/groups').success((data) => {
                    $scope.groups = data;
                    console.log(data)
                });
            }
            var load = () => {
                $http.get('/api/rules').success((data) => {
                    $scope.rules = data;
                    
                });
            };            

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
                $scope.isOpen = true;
                $scope.editmode = !$scope.editmode;
                $scope.newRule = angular.copy(rule);
            }

            $scope.create = (rule) => {
                $http.post('/api/rules', rule).success(() => {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been added successfully!");
                    load();
                });
            }

            $scope.edit = (rule) => {
                $http.put('/api/rules', rule).success(() => {
                    $scope.cancel();
                    console.log("changed")
                    alert("Rule \"" + rule.name + "\" has been changed successfully!");
                    load();
                });
            }

            $scope.delete = (rule) => {
                $http.delete('/api/rules?name=' + rule.name).success(() => {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been deleted successfully!")
                    load();
                });
            }

            $scope.getUsers = () => {
                $http.get('/api/users').success((data) => {
                    $scope.users = data;
                    console.log(data)
                });
            }
           
            load();
            getGroups();
        }
    }

    angular.module('ruleApp', ['officeuifabric.core', 'officeuifabric.components', 'officeuifabric.components.table'])
        .controller('ruleCtrl', RuleCtrl);
}
