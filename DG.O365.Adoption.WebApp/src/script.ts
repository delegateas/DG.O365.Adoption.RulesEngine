/// <reference path='../src/typings/angular.d.ts' />

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

            var load = () => {
                $http.get('/api/rules').success((data) => {
                    $scope.rules = data;
                    console.log(data);
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

            load();
        }
    }

    angular.module('ruleApp', [])
        .controller('ruleCtrl', RuleCtrl);
}
