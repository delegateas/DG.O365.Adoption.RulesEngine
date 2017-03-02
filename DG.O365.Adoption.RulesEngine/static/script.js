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
                $http.get('/api/groups').success(function (data) {
                    $scope.groups = data;
                    console.log(data);
                });
            };
            var load = function () {
                $http.get('/api/rules').success(function (data) {
                    $scope.rules = data;
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
                $scope.isOpen = true;
                $scope.editmode = !$scope.editmode;
                $scope.newRule = angular.copy(rule);
            };
            $scope.create = function (rule) {
                $http.post('/api/rules', rule).success(function () {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been added successfully!");
                    load();
                });
            };
            $scope.edit = function (rule) {
                $http.put('/api/rules', rule).success(function () {
                    $scope.cancel();
                    console.log("changed");
                    alert("Rule \"" + rule.name + "\" has been changed successfully!");
                    load();
                });
            };
            $scope.delete = function (rule) {
                $http.delete('/api/rules?name=' + rule.name).success(function () {
                    $scope.cancel();
                    alert("Rule \"" + rule.name + "\" has been deleted successfully!");
                    load();
                });
            };
            $scope.getUsers = function () {
                $http.get('/api/users').success(function (data) {
                    $scope.users = data;
                    console.log(data);
                });
            };
            load();
            getGroups();
        }
        RuleCtrl.$inject = ['$scope', '$http'];
        return RuleCtrl;
    }());
    ruleengine.RuleCtrl = RuleCtrl;
    angular.module('ruleApp', ['officeuifabric.core', 'officeuifabric.components', 'officeuifabric.components.table'])
        .controller('ruleCtrl', RuleCtrl);
})(ruleengine || (ruleengine = {}));
//# sourceMappingURL=script.js.map