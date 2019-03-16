<?php
include_once 'db_connect.php';
include_once 'psl-config.php';

$error = [];
$error['error'] = "";
 
if (isset($_POST['token'], $_POST['p'])) {
    
    $token = $_POST['token'];
    $password = filter_input(INPUT_POST, 'p', FILTER_SANITIZE_STRING);
    if (strlen($password) != 128) {
        // The hashed pwd should be 128 characters long.
        // If it's not, something really odd has happened
        $error['error'] = 'Invalid password configuration.';
        echo json_encode($error);
        exit;
    }
    
    $prep_stmt = "SELECT email FROM tokens WHERE token = ? LIMIT 1";
    $stmt = $mysqli->prepare($prep_stmt);
 
    // check existing token  
    if ($stmt) {
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $stmt->store_result();
 
        if ($stmt->num_rows == 1) {
            
            $stmt->bind_result($email);
            $stmt->fetch();
            $stmt->close();

            $delete_stmt = $mysqli->prepare("DELETE FROM tokens WHERE token=?");
            $delete_stmt->bind_param('s', $token);
            $delete_stmt->execute();

			$password = password_hash($password, PASSWORD_BCRYPT);

	        if ($insert_stmt = $mysqli->prepare("UPDATE members SET password=? WHERE email=?")) {

	            $insert_stmt->bind_param('ss', $password, $email);

	            // Execute the prepared query.
	            if ($insert_stmt->execute()) {
	                
	        		$_GET['success'] = 1;
	       			include "login.php";
	                exit;
	            } else 
	            	$error['error'] = 'This failed to save the new password, please try again later.';
	        } else 
	        	$error['error'] = 'This failed to save the new password, please try again later.';
        } else 
	        $error['error'] = 'The entered token was not found in our database.';
    } else 
	   	$error['error'] = 'This failed to save the new password, please try again later.';

	echo json_encode($error);
}
?>