/**
 * Setup of main AngularJS application, with Restangular being defined as a dependency.
 *
 * @see controllers
 * @see services
 */

// mock methods to implement late binding
var __mockShowError = function(message) {};
var __mockValidateAddress = function(address) {};

var app = angular.module('app', [
    'restangular',
    'waves.core',

    'ngclipboard',
    'ngAnimate',
    'ngMaterial',
    'ngValidate',
    'app.ui',
    'app.shared',
    'app.login',
    'app.navigation',
    'app.wallet',
    'app.tokens',
    'app.history',
    'app.community',
    'app.portfolio'
]).config(AngularApplicationConfig).run(AngularApplicationRun);

function AngularApplicationConfig($provide, $validatorProvider, networkConstants, applicationSettings) {
    $provide.constant(networkConstants,
        angular.extend(networkConstants, {
            NETWORK_NAME: 'devel',
            NETWORK_CODE: 'T'
        }));
    $provide.constant(applicationSettings,
        angular.extend(applicationSettings, {
            CLIENT_VERSION: '0.4.1a',
            NODE_ADDRESS: 'http://127.0.0.1:6869'
        }));

    $validatorProvider.setDefaults({
        errorClass: 'wInput-error',
        onkeyup: false,
        showErrors : function(errorMap, errorList) {
            errorList.forEach(function(error) {
                // can't use notificationService here cos services are not available in config phase
                __mockShowError(error.message);
            });

            var i, elements;
            for (i = 0, elements = this.validElements(); elements[i]; i++) {
                angular.element(elements[i]).removeClass(this.settings.errorClass);
            }

            for (i = 0, elements = this.invalidElements(); elements[i]; i++) {
                angular.element(elements[i]).addClass(this.settings.errorClass);
            }
        }
    });
    $validatorProvider.addMethod('address', function (value, element) {
        return this.optional(element) || __mockValidateAddress(value);
    }, 'Account number must be a sequence of 35 alphanumeric characters with no spaces, ' +
        'optionally starting with \'1W\'');
    $validatorProvider.addMethod('decimal', function (value, element, params) {
        var maxdigits = angular.isNumber(params) ? params : Currency.WAV.precision;

        var regex = new RegExp('^(?:-?\\d+)?(?:\\.\\d{0,' + maxdigits + '})?$');
        return this.optional(element) || regex.test(value);
    }, 'Amount is expected with a dot (.) as a decimal separator with no more than {0} fraction digits');
    $validatorProvider.addMethod('password', function (value, element) {
        if (this.optional(element))
            return true;

        var containsDigits = /[0-9]/.test(value);
        var containsUppercase = /[A-Z]/.test(value);
        var containsLowercase = /[a-z]/.test(value);

        return containsDigits && containsUppercase && containsLowercase;
    }, 'The password is too weak. A good password must contain at least one digit, ' +
        'one uppercase and one lowercase letter');
    $validatorProvider.addMethod('minbytelength', function (value, element, params) {
        if (this.optional(element))
            return true;

        if (!angular.isNumber(params))
           throw new Error('minbytelength parameter must be a number. Got ' + params);

        var minLength = params;
        return converters.stringToByteArray(value).length >= minLength;
    }, 'String is too short. Please add more characters.');
    $validatorProvider.addMethod('maxbytelength', function (value, element, params) {
        if (this.optional(element))
            return true;

        if (!angular.isNumber(params))
            throw new Error('maxbytelength parameter must be a number. Got ' + params);

        var maxLength = params;
        return converters.stringToByteArray(value).length <= maxLength;
    }, 'String is too long. Please remove some characters.');
}

AngularApplicationConfig.$inject = ['$provide', '$validatorProvider', 'constants.network', 'constants.application'];

function AngularApplicationRun(rest, applicationConstants, notificationService, addressService) {
    // restangular configuration
    rest.setDefaultHttpFields({
        timeout: 10000 // milliseconds
    });
    var url = applicationConstants.NODE_ADDRESS;
    //var url = 'http://52.28.66.217:6869';
    //var url = 'http://52.77.111.219:6869';
    //var url = 'http://127.0.0.1:6869';
    //var url = 'http://127.0.0.1:8089';
    rest.setBaseUrl(url);

    // override mock methods cos in config phase services are not available yet
    __mockShowError = function (message) {
        notificationService.error(message);
    };
    __mockValidateAddress = function (address) {
        return addressService.validateAddress(address);
    };
}

AngularApplicationRun.$inject = ['Restangular', 'constants.application', 'notificationService', 'addressService'];

