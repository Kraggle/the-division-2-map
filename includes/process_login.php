<?php
// session_start();
include_once 'session_start.php';
include_once 'functions.php';
include_once 'db_connect.php';

if (!login_check($mysqli)) {
	
	if (isset($_POST['email'], $_POST['p'])) {
		$email = $_POST['email'];
		$password = $_POST['p']; // The hashed password.
		
		if (login($email, $password, $mysqli) == true) {
			
			$month = time() + (86400 * 30);
			
			// Login success 
			setcookie('username', $_SESSION['username'], $month, '/');
			setcookie('usertype', $_SESSION['usertype'], $month, '/');
			
			// echo $_COOKIE['validator'] . "/" .  $_COOKIE['token'];
			
			if (isset($_COOKIE['validator']) && !isset($_COOKIE['token'])) {
				
				$validator = $_COOKIE['validator'];
				$selector = substr(hash('sha256', $validator), 0, 12);
				$token = substr(generateToken(40), 0, 64);
				$user_id = $_SESSION['user_id'];
				$datetime = date("Y-m-d H:i:s", $month);
				
				$mysqli->query("DELETE FROM `auth_tokens` WHERE `selector` = '$selector' AND `user_id` = $user_id");
				
				if ($insert_stmt = $mysqli->prepare("INSERT INTO `auth_tokens`(`selector`, `token`, `user_id`, `expires`) VALUES (?,?,?,?)")) {
					$insert_stmt->bind_param('ssis', $selector, $token, $user_id, $datetime);
					$insert_stmt->execute();

					setcookie('token', $token, $month, '/');
					setcookie('validator', $validator, $month, '/');
				}
				
			} elseif (isset($_COOKIE['validator'], $_COOKIE['token'])) {
				
				$validator = $_COOKIE['validator'];
				$token = $_COOKIE['token'];
				
				setcookie('token', $token, $month, '/');
				setcookie('validator', $validator, $month, '/');
			}
		} 
	} else {
		// The correct POST variables were not sent to this page. 
		$_GET['error'] = "Incomplete data, please fill in the forms correctly!";
	}
} else {
	$_GET['error'] = "You are already logged in!";
}

include 'login.php';
