<?php

include_once 'session_start.php';
include_once "functions.php";

if (login_check($mysqli)) {
	
	$username = $_SESSION['username'];
	$path = "../data/$username/complete.json";
	
	if (file_exists($path)) echo json_encode(true);
	else echo json_encode(false);
	
} else echo json_encode(false);
