import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { formhash, regformhash, resetformhash } from '../Utility/forms.js';
import pageLoad from './page-load.js';

// MARK: => Account
export function doDonator() {

    $.ajax({
        type: 'POST',
        url: 'php/process_donator.php',
        data: {
            email: $('#donator').val()
        }
    }).done(function(a) {
        a = $.parseJSON(a);
        if (a.success) {
            $('#side-bar .login .success').html(a.success);
            $('#side-bar .login .error').html('');
            $('#donator').val('');
        } else {
            $('#side-bar .login .error').html(a.error);
            $('#side-bar .login .success').html('');
        }
    });
}

export function doLogin() {

    const _this = document.getElementById('login');
    formhash(_this, _this.password);

    $.ajax({
        type: 'POST',
        url: 'php/process_login.php',
        data: {
            email: _this.username.value,
            p: _this.p.value
        }
    }).done(function(a) {

        if (K.local('username')) {
            K.user.name = K.local('username');
            K.user.type = K.local('usertype');
            K.user.getData();
        }

        if (!K.local('donate')) {
            $('#alert').show();
        } else {
            $('#alert').hide();
        }

        if (a) {
            $('#side-bar .login .side-content').html(a);
            K.check.doOnce = true;
            pageLoad();
        }
    });
}

export function doRegister() {

    const _this = document.getElementById('regform');
    if (!regformhash(_this, _this.username, _this.email, _this.password, _this.confirmpwd)) {

        $('#side-bar .login .error').html(K.user.error);
        return;
    }

    $.ajax({
        type: 'POST',
        url: 'php/process_register.php',
        data: {
            username: _this.username.value,
            email: _this.email.value,
            p: _this.p.value
        }
    }).done(function(a) {
        a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
        if (K.type(a) == 'object' && a.error)
            $('#side-bar .login .error').html(a.error);
        else
            $('#side-bar .login .side-content').html(a);
    });
}

export function doReset() {

    const _this = document.getElementById('reset');
    if (!resetformhash(_this, _this.password, _this.confirmpwd)) {

        $('#side-bar .login .error').html(K.user.error);
        return;
    }

    $.ajax({
        type: 'POST',
        url: 'php/process_reset.php',
        data: {
            token: K.urlParam('token'),
            p: _this.p.value
        }
    }).done(function(a) {

        a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
        if (K.type(a) == 'object' && a.error)
            $('#side-bar .login .error').html(a.error);
        else
            window.location.href = window.location.href.split('?')[0];

    });
}

export function doForgot() {

    const _this = document.getElementById('forgot');

    $.ajax({
        type: 'POST',
        url: 'php/process_forgot.php',
        data: {
            email: _this.email.value
        }
    }).done(function(a) {

        let result = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;

        $.ajax({
            url: 'php/login.php'

        }).done(function(b) {

            b && $('#side-bar .login .side-content').html(b);

            if (K.type(result) == 'object') {

                if (result.error)
                    $('#side-bar .login .error').html(result.error);
                if (result.success) {
                    $('#side-bar .login .success').html(result.success);
                }
            }
        });

    });
}