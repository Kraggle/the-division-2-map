<?
// session_start();
include_once 'session_start.php';
include_once 'functions.php';
 
// Unset all session values 
$_SESSION = array();
 
// get session parameters 
$params = session_get_cookie_params();
 
// Delete the actual cookie. 
setcookie(session_name(),
        '', time() - 42000, 
        $params["path"], 
        $params["domain"], 
        $params["secure"], 
        $params["httponly"]);

setcookie('username', null, time() - 3600, "/");
setcookie('token', null, time() - 3600, "/");
setcookie('usertype', null, time() - 3600, "/");
 
// Destroy session 
session_destroy();

include "login.php";
