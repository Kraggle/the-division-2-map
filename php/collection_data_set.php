<?php
// session_start();
include_once 'session_start.php';
include_once 'db_connect.php';
include_once 'psl-config.php';
include_once 'functions.php';

if (login_check($mysqli) && isset($_POST['setData'])) {
   
   $set_data = $_POST['setData'];
   $user_id = $_SESSION['user_id'];
   
	// Insert the new user into the database 
	if ($insert_stmt = $mysqli->prepare("INSERT INTO `set_collection`(`user_id`, `set_data`) VALUES (?, ?) 
											ON DUPLICATE KEY UPDATE `set_data` = VALUES(`set_data`)")) {
		$insert_stmt->bind_param('is', $user_id, $set_data);
		$insert_stmt->execute();
	}
}
