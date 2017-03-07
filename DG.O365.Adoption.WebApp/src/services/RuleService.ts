module ruleengine {
    export class RuleService implements IRuleService {

        public static $inject = ['$http'];
        constructor(
            private $http: ng.IHttpService
        ) {
        }

        getList = (type: string) => {
            var url: string = '/api/' + type;
            var promise = this.$http.get(url)
                .then((data: any) => {
                    return data;
                }).
                catch((errdata) => {
                    return errdata;
                });

            return promise;
        }

        addRule = (rule: any) => {
            var url: string = '/api/rules';
            var postData = rule;
            var promise = this.$http.post(url, postData).
                then(function (data: any) {
                    return data;
                }).
                catch(function (errdata) {
                    return errdata;
                });
            return promise;
        }

        editRule = (rule: any) => {
            var url: string = '/api/rules';
            var putData = rule;
            var promise = this.$http.put(url, putData).
                then(function (data: any) {
                    return data;
                }).
                catch(function (errdata) {
                    return errdata;
                });
            return promise;

        }
        deleteRule = (rule: any) => {
            var url: string = '/api/rules';
            var deleteData = rule;
            var promise = this.$http.delete(url, deleteData).
                then(function (data: any) {
                    return data;
                }).
                catch(function (errdata) {
                    return errdata;
                });
            return promise;
        }

    }

    angular.module('ruleApp')
        .service('ruleService', RuleService);
}