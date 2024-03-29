import { hex_sha512 } from './sha512.js'
import { K } from '../K.js';

export function formhash(form, password) {
    // Create a new element input, this will be our hashed password field. 
    var p = document.createElement("input");

    // Add the new element to our form. 
    form.appendChild(p);
    p.name = "p";
    p.type = "hidden";
    p.value = hex_sha512(password.value);

    // Make sure the plaintext password doesn't get sent. 
    password.value = "";

    // Finally submit the form. 
    // form.submit();
}

export function regformhash(form, uid, email, password, conf) {
    // Check each field has a value
    K.error = '';

    if (uid.value == '' ||
        email.value == '' ||
        password.value == '' ||
        conf.value == '') {

        K.error = 'You must provide all the requested details.';
        return false;
    }

    // Check the username
    re = /^\w+$/;
    if (!re.test(form.username.value)) {
        K.error = "Username must contain only letters, numbers and underscores.";
        form.username.focus();
        return false;
    }

    // Check that the password is sufficiently long (min 6 chars)
    // The check is duplicated below, but this is included to give more
    // specific guidance to the user
    if (password.value.length < 6) {
        K.error = 'Passwords must be at least 6 characters long.';
        form.password.focus();
        return false;
    }

    // At least one number, one lowercase and one uppercase letter 
    // At least six characters 
    var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!re.test(password.value)) {
        K.error = 'Passwords must contain at least one number, one lowercase and one uppercase letter.';
        return false;
    }

    // Check password and confirmation are the same
    if (password.value != conf.value) {
        K.error = 'Your password and confirmation do not match.';
        form.password.focus();
        return false;
    }

    // Create a new element input, this will be our hashed password field. 
    var p = document.createElement("input");

    // Add the new element to our form. 
    $('[name="p"]').remove();
    form.appendChild(p);
    p.name = "p";
    p.type = "hidden";
    p.value = hex_sha512(password.value);

    // Make sure the plaintext password doesn't get sent. 
    password.value = "";
    conf.value = "";

    // Finally submit the form. 
    // form.submit();
    return true;
}

export function resetformhash(form, password, conf) {
    // Check each field has a value
    K.error = '';

    if (password.value == '' || conf.value == '') {

        K.error = 'You must provide all the requested details.';
        return false;
    }

    // Check that the password is sufficiently long (min 6 chars)
    // The check is duplicated below, but this is included to give more
    // specific guidance to the user
    if (password.value.length < 6) {
        K.error = 'Passwords must be at least 6 characters long.';
        form.password.focus();
        return false;
    }

    // At least one number, one lowercase and one uppercase letter 
    // At least six characters 
    var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!re.test(password.value)) {
        K.error = 'Passwords must contain at least one number, one lowercase and one uppercase letter.';
        return false;
    }

    // Check password and confirmation are the same
    if (password.value != conf.value) {
        K.error = 'Your password and confirmation do not match.';
        form.password.focus();
        return false;
    }

    // Create a new element input, this will be our hashed password field. 
    var p = document.createElement("input");

    // Add the new element to our form. 
    $('[name="p"]').remove();
    form.appendChild(p);
    p.name = "p";
    p.type = "hidden";
    p.value = hex_sha512(password.value);

    // Make sure the plaintext password doesn't get sent. 
    password.value = "";
    conf.value = "";

    // Finally submit the form. 
    // form.submit();
    return true;
}