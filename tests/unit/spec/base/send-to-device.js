/* For reference read the Jasmine and Sinon docs
 * Jasmine docs: http://pivotal.github.io/jasmine/
 * Sinon docs: http://sinonjs.org/docs/
 */

/* global describe, beforeEach, afterEach, it, expect, sinon, spyOn */

describe('send-to-device.js', function() {

    'use strict';

    var form;

    beforeEach(function () {

        var formMarkup = [
            '<section id="send-to-device" data-key="foo">' +
                '<div class="form-container">' +
                    '<form id="send-to-device-form">' +
                        '<ul class="error-list hidden"></ul>' +
                        '<div class="input">' +
                            '<input type="hidden" id="id-platform" value="all">' +
                            '<label id="form-input-label" for="id-input" data-alt="Enter your email or 10-digit phone number.">Enter your email.</label>' +
                            '<div class="inline-field">' +
                                '<input id="id-input" type="text" required>' +
                                '<button type="submit">Send</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="thank-you hidden"></div>' +
                        '<div class="loading-spinner"></div>' +
                        '</form>' +
                    '</div>' +
            '</section>'
        ].join();

        $(formMarkup).appendTo('body');

        window.Spinner = sinon.stub();
        window.Spinner.prototype.spin = sinon.stub();

        form = new Mozilla.SendToDevice();
    });

    afterEach(function () {
        form.unbindEvents();
        $('#send-to-device').remove();
        Mozilla.SendToDevice.COUNTRY_CODE = '';
    });

    describe('instantiation', function() {

        it('should create a new instance of SendToDevice', function() {
            spyOn(form, 'checkLocation');
            spyOn(form, 'bindEvents');
            form.init();
            expect(form instanceof Mozilla.SendToDevice).toBeTruthy();
            expect(form.checkLocation).toHaveBeenCalled();
            expect(form.bindEvents).toHaveBeenCalled();
        });
    });

    describe('checkLocation', function() {

        it('should call MSL to update the messaging', function() {
            spyOn($, 'get').and.callFake(function () {
                var d = $.Deferred();
                var data = {
                    country_code: 'us'
                };
                d.resolve(data, 'success');
                return d.promise();
            });
            spyOn(form, 'updateMessaging').and.callThrough();
            form.init();
            expect($.get).toHaveBeenCalledWith('https://location.services.mozilla.com/v1/country?key=foo');
            expect(form.updateMessaging).toHaveBeenCalled();
            expect(Mozilla.SendToDevice.COUNTRY_CODE).toEqual('us');
        });
    });

    describe('showSMS', function() {

        it('should call showSMS if users is inside the US', function() {
            spyOn($, 'get').and.callFake(function () {
                var d = $.Deferred();
                var data = {
                    country_code: 'us'
                };
                d.resolve(data);
                return d.promise();
            });

            spyOn(form, 'showSMS').and.callThrough();
            form.init();
            expect(form.showSMS).toHaveBeenCalled();
            expect($('#send-to-device-form').hasClass('us')).toBeTruthy();
        });

        it('should not call showSMS if users is outside the US', function() {
            spyOn($, 'get').and.callFake(function () {
                var d = $.Deferred();
                var data = {
                    country_code: 'gb'
                };
                d.resolve(data);
                return d.promise();
            });

            spyOn(form, 'showSMS').and.callThrough();
            form.init();
            expect(form.showSMS).not.toHaveBeenCalled();
        });
    });

    describe('checkEmailValidity', function() {

        it('should return true for primitive email format', function() {
            expect(form.checkEmailValidity('a@a')).toBeTruthy();
            expect(form.checkEmailValidity('example@example.com')).toBeTruthy();
        });

        it('should return false for anything else', function() {
            expect(form.checkEmailValidity(1234567890)).toBeFalsy();
            expect(form.checkEmailValidity('aaa')).toBeFalsy();
            expect(form.checkEmailValidity(null)).toBeFalsy();
            expect(form.checkEmailValidity(undefined)).toBeFalsy();
            expect(form.checkEmailValidity(true)).toBeFalsy();
            expect(form.checkEmailValidity(false)).toBeFalsy();
        });
    });

    describe('onFormSubmit', function() {

        beforeEach(function() {
            spyOn($, 'get').and.callFake(function () {
                var d = $.Deferred();
                var data = {
                    country_code: 'us'
                };
                d.resolve(data);
                return d.promise();
            });
        });

        it('should handle success', function() {

            spyOn($, 'post').and.callFake(function () {
                var d = $.Deferred();
                var data = {
                    'success': 'success'
                };
                d.resolve(data);
                return d.promise();
            });

            spyOn(form, 'onFormSuccess').and.callThrough();

            form.init();
            $('#send-to-device-form').submit();
            expect($.post).toHaveBeenCalled();
            expect(form.onFormSuccess).toHaveBeenCalledWith('success');
        });

        it('should handle error', function() {

            spyOn($, 'post').and.callFake(function () {
                var d = $.Deferred();
                var data = {
                    'errors': 'Please enter an email address.'
                };
                d.resolve(data);
                return d.promise();
            });

            spyOn(form, 'onFormError').and.callThrough();

            form.init();
            $('#send-to-device-form').submit();
            expect($.post).toHaveBeenCalled();
            expect(form.onFormError).toHaveBeenCalledWith('Please enter an email address.');
        });

        it('should handle failure', function() {

            spyOn($, 'post').and.callFake(function () {
                var d = $.Deferred();
                var error = 'An error occurred in our system. Please try again later.';
                d.reject(error);
                return d.promise();
            });

            spyOn(form, 'onFormFailure').and.callThrough();

            form.init();
            $('#send-to-device-form').submit();
            expect($.post).toHaveBeenCalled();
            expect(form.onFormFailure).toHaveBeenCalledWith('An error occurred in our system. Please try again later.');
        });
    });

});
