(function () {
  'use strict';

  angular.module('frontend.core.services')
    .factory('configService', configService);

  configService.$inject = ['$http', 'Config', 'messageService', '$sessionStorage', '$q', '$state'];

  function configService($http, Config, messageService, $sessionStorage, $q, $state) {
    var config = {};
    var firstLoad = true;
    var service = {
      getConfig: getConfig,
      getApp: getApp
    };

    return service;

    // Private functions.

    /**
     * Return the private `config` object.
     * @returns {{}}
     */
    function getConfig() {
      return config;
    }

    /**
     * Gey the config of the app from its API.
     *
     * @param appUrl
     * @returns {*}
     */
    function getApp(appUrl) {

      // Init promise.
      var deferred = $q.defer();

      // Set the appUrl in the local storage.
      $sessionStorage.appUrl = appUrl ? appUrl : $sessionStorage.appUrl;
      appUrl = $sessionStorage.appUrl;

      if (firstLoad && !appUrl) {
        messageService.warning('You app URL has been set as `http://localhost:1337` by default. To change it, please update it in the Studio.', 'Warning', {
          timeOut: 10000
        });
      }

      // Set the default appUrl.
      appUrl = appUrl ? appUrl : 'http://localhost:1337';
      $sessionStorage.appUrl = appUrl;

      // Get the config of the app.
      $http({
        method: 'GET',
        url: appUrl + '/admin/config'
      }).then(function (response) {
        // Set the config.
        config = response.data;

        // Set the backend url in Config object.
        Config.backendUrl = response.data.settings && response.data.settings.url || Config.backendUrl;

        // Set the isNewApp value in configService object.
        config.isNewApp = response.data.settings && response.data.settings.isNewApp;

        config.models = response.data.models;

        // Check if the user is connected.
        if (!config.connected) {
          if (config.isNewApp) {
            $state.go('auth.register');
          } else if ($state.includes('strapi')) {
            $state.go('auth.login');
          }
        }

        deferred.resolve();
      })
        .catch(function () {
          // App is offline.
          if (firstLoad) {
            messageService.error('Your app looks offline, please start it and reload this page.', 'Error', {
              timeOut: 60000
            });
          }
          firstLoad = false;
          deferred.reject();
        });
      return deferred.promise;
    }
  }
})();
