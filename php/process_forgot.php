<?php
// session_start();
include_once 'session_start.php';
include_once 'functions.php';
include_once 'db_connect.php';


if (isset($_POST['email'])) {
	$email = $_POST['email'];

	if ($stmt = $mysqli->prepare("SELECT email, id
								FROM members
							   WHERE email = ?
								LIMIT 1")) {
		$stmt->bind_param('s', $email);
		$stmt->execute();
		$stmt->store_result();
 
		// get variables from result.
		$stmt->bind_result($m, $id);
		$stmt->fetch();
 
		if ($stmt->num_rows == 1) {
 
			$token = getRandomString();
			
			if ($insert_stmt = $mysqli->prepare("INSERT INTO tokens (token, email) VALUES (?, ?)")) {
				$insert_stmt->bind_param('ss', $token, $email);

				// Execute the prepared query.
				if (!$insert_stmt->execute()) {
			
					$_GET['error'] = "I'm sorry this failed through no fault of your own. Please try again later!";

				} else {

					$subject = "Password Reset for the-division-2-map.com";
					if ($_SERVER['HTTP_HOST'] == 'localhost') 
						$uri = 'the-division-2-map.test';
					else 
						$uri = 'the-division-2-map.com';
						
					$message = "<html>
						<head>
							<title>Password Reset for the-division-2-map.com</title>
						</head>
						<body>
							<p>Click on the given link to reset your password <a href='http://$uri?token=$token&forgot=true'>Reset Password</a></p>
						</body>
					</html>";
					
					$headers = "MIME-Version: 1.0" . "\r\n";
					$headers .= "Content-type:text/html;charset=iso-8859-1" . "\r\n";
					$headers .= 'From: The-Division-2-Map<admin@the-division-2-map.com>' . "\r\n";
				 
					if (mail($email, $subject, $message, $headers)) {
						$_GET['success'] = "Your password reset link has been sent."; 
					} else {
						$_GET['error'] = "The email failed to send.";
					}
				}
			}

		} else {

			$_GET['error'] = "There is no account with that email address.";
		}
	} else {

		$_GET['error'] = "Statement failed.";
	}
}

echo json_encode($_GET);
