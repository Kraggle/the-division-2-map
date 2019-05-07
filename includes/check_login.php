<?php
// session_start();
include_once 'session_start.php';
include_once 'functions.php';
include_once 'db_connect.php';

$return = [];

$return['success'] = type_check($mysqli);
$return['username'] = (isset($_SESSION['username']) ? $_SESSION['username'] : false);
$return['usertype'] = (isset($_SESSION['usertype']) ? $_SESSION['usertype'] : 0);
$return['donate'] = is_donator($mysqli);

echo json_encode($return);
