<?php
include_once 'psl-config.php';
include_once 'lib/random.php';

$error = 'none';

function sec_session_start() {
	$session_name = 'sec_session_id';   // Set a custom session name
	/*Sets the session name.
	 *This must come before session_set_cookie_params due to an undocumented bug/feature in PHP.
	 */
	session_name($session_name);
 
	$secure = true;
	// This stops JavaScript being able to access the session id.
	$httponly = true;
	// Forces sessions to only use cookies.
	if (ini_set('session.use_only_cookies', 1) === false) {
		header("Location: error.php?err=Could not initiate a safe session (ini_set)");
		exit();
	}
	// Gets current cookies params.
	$cookieParams = session_get_cookie_params();
	session_set_cookie_params(
		$cookieParams["lifetime"],
		$cookieParams["path"],
		$cookieParams["domain"],
		$secure,
		$httponly
	);
 
	session_start();            // Start the PHP session
	session_regenerate_id(true);    // regenerated the session, delete the old one.
}

function login($email, $password, $mysqli) {
	// Using prepared statements means that SQL injection is not possible.
	if ($stmt = $mysqli->prepare("SELECT id, username, password, type, donate
								FROM members
							   WHERE email = ?
								LIMIT 1")) {
		$stmt->bind_param('s', $email);  // Bind "$email" to parameter.
		$stmt->execute();    // Execute the prepared query.
		$stmt->store_result();
 
		// get variables from result.
		$stmt->bind_result($user_id, $username, $db_password, $type, $donate);
		$stmt->fetch();
 
		if ($stmt->num_rows == 1) {
			// If the user exists we check if the account is locked
			// from too many login attempts
 
			if (checkbrute($user_id, $mysqli) == true) {
				// Account is locked
				// Send an email to user saying their account is locked
				$_GET['error'] = "Account locked due to failed login attempts, you can request an unlock or wait upto 2 hours.";
				return false;
			} else {
				// Check if the password in the database matches
				// the password the user submitted. We are using
				// the password_verify function to avoid timing attacks.
				if (password_verify($password, $db_password)) {
					// Password is correct!
					// Get the user-agent string of the user.
					$user_browser = $_SERVER['HTTP_USER_AGENT'];
					// XSS protection as we might print this value
					$user_id = preg_replace("/[^0-9]+/", "", $user_id);
					$_SESSION['user_id'] = $user_id;
					// XSS protection as we might print this value
					$username = preg_replace("/[^a-zA-Z0-9_\-]+/", "", $username);
					$_SESSION['username'] = $username;
					$_COOKIE['username'] = $username;
					$_SESSION['usertype'] = $type;
					$_COOKIE['usertype'] = $type;
					$_SESSION['login_string'] = hash('sha512', $db_password . $user_browser);
					
					// Login successful.
					return true;
				} else {
					// Password is not correct
					// We record this attempt in the database
					$now = time();
					$mysqli->query("INSERT INTO login_attempts(user_id, time)
									VALUES ('$user_id', '$now')");
					
					$_GET['error'] = "Incorrect password, please be aware your account will become locked for a upto 2 hours if you fail too many times.";
					
					setcookie('username', null, -1000, '/');
					setcookie('usertype', null, -1000, '/');
	
					return false;
				}
			}
		} else {
			$_GET['error'] = "There is no account with that email address.";
			
			setcookie('username', null, -1000, '/');
			setcookie('usertype', null, -1000, '/');
			return false;
		}
	} else {
		$_GET['error'] = "Statement failed.";
	
		setcookie('username', null, -1000, '/');
		setcookie('usertype', null, -1000, '/');
		return false;
	}
}

function type_name() {
	if (isset($_SESSION['usertype'])) {
		switch ($_SESSION['usertype']) {
			case 5:
				return "Admin";
			
			case 4:
				return "Staff";
			
			case 3:
				return "Subscriber";
			
			case 2:
				return "Donator";
			
			case 1:
				return "Member";
			
			default:
				return "";
		}
	} else {
		return "";
	}
}

function remember($user_id, $mysqli) {
	// Using prepared statements means that SQL injection is not possible.
	if ($stmt = $mysqli->prepare("SELECT id, username, password, type, donate 
								FROM members
							   WHERE id = ?
								LIMIT 1")) {
		$stmt->bind_param('i', $user_id);  // Bind "$user_id" to parameter.
		$stmt->execute();    // Execute the prepared query.
		$stmt->store_result();
 
		// get variables from result.
		$stmt->bind_result($user_id, $username, $db_password, $type, $donate);
		$stmt->fetch();
		
		if ($stmt->num_rows == 1) {
			// If the user exists we check if the account is locked
			// from too many login attempts
			
			if (checkbrute($user_id, $mysqli) == true) {
				// Account is locked
				// Send an email to user saying their account is locked
				$_GET['error'] = "Account locked due to failed login attempts, check your email to unlock or wait upto 2 hours.";
				return false;
			} else {
				
				// Get the user-agent string of the user.
				$user_browser = $_SERVER['HTTP_USER_AGENT'];
				// XSS protection as we might print this value
				$user_id = preg_replace("/[^0-9]+/", "", $user_id);
				$_SESSION['user_id'] = $user_id;
				// XSS protection as we might print this value
				$username = preg_replace("/[^a-zA-Z0-9_\-]+/", "", $username);
				$_SESSION['username'] = $username;
				$_COOKIE['username'] = $username;
				$_SESSION['usertype'] = $type;
				$_COOKIE['usertype'] = $type;
				$_SESSION['login_string'] = hash('sha512', $db_password . $user_browser);
				// Login successful.
				return true;
			}
		} else {
			$_GET['error'] = "There is no account with that email address.";
			// No user exists.
			return false;
		}
	} else {
		$_GET['error'] = "Statement failed.";
		// No user exists.
		return false;
	}
}

function checkbrute($user_id, $mysqli) {
	// Get timestamp of current time
	$now = time();
 
	// All login attempts are counted from the past 2 hours.
	$valid_attempts = $now - (2 * 60 * 60);
 
	if ($stmt = $mysqli->prepare("SELECT time 
							 FROM login_attempts 
							 WHERE user_id = ? 
							AND time > '$valid_attempts'")) {
		$stmt->bind_param('i', $user_id);
 
		// Execute the prepared query.
		$stmt->execute();
		$stmt->store_result();
 
		// If there have been more than 5 failed logins
		if ($stmt->num_rows > 5) {
			return true;
		} else {
			return false;
		}
	}
}

function login_check($mysqli) {
	// Check if all session variables are set
	if (isset($_SESSION['user_id'], $_SESSION['username'], $_SESSION['login_string'])) {
		$user_id = $_SESSION['user_id'];
		$login_string = $_SESSION['login_string'];
		$username = $_SESSION['username'];
 
		// Get the user-agent string of the user.
		$user_browser = $_SERVER['HTTP_USER_AGENT'];
 
		if ($stmt = $mysqli->prepare("SELECT password, donate
									  FROM members 
									  WHERE id = ? LIMIT 1")) {
			// Bind "$user_id" to parameter.
			$stmt->bind_param('i', $user_id);
			$stmt->execute();   // Execute the prepared query.
			$stmt->store_result();
 
			if ($stmt->num_rows == 1) {
				// If the user exists get variables from result.
				$stmt->bind_result($password, $donate);
				$stmt->fetch();
				$login_check = hash('sha512', $password . $user_browser);
				
				if (hash_equals($login_check, $login_string)) {
					// Logged In!!!!
					return true;
				}
			}
		}
	}
	return false;
}

function token_check($mysqli, $token) {
	if ($stmt = $mysqli->prepare("SELECT token 
								  FROM tokens 
								  WHERE token = ? LIMIT 1")) {
		$stmt->bind_param('s', $token);
		$stmt->execute();
		$stmt->store_result();

		if ($stmt->num_rows == 1) {
			return true;
		}
	}
	return false;
}

function type_check($mysqli) {
	// Check if all session variables are set
	if (isset($_SESSION['user_id'], $_SESSION['username'], $_SESSION['login_string'])) {
		$user_id = $_SESSION['user_id'];
		$login_string = $_SESSION['login_string'];
		$username = $_SESSION['username'];
 
		// Get the user-agent string of the user.
		$user_browser = $_SERVER['HTTP_USER_AGENT'];
 
		if ($stmt = $mysqli->prepare("SELECT password, type, donate
									  FROM members 
									  WHERE id = ? LIMIT 1")) {
			// Bind "$user_id" to parameter.
			$stmt->bind_param('i', $user_id);
			$stmt->execute();   // Execute the prepared query.
			$stmt->store_result();
 
			if ($stmt->num_rows == 1) {
				// If the user exists get variables from result.
				$stmt->bind_result($password, $type, $donate);
				$stmt->fetch();
				$login_check = hash('sha512', $password . $user_browser);
 
				if (hash_equals($login_check, $login_string)) {
					$month = time() + (86400 * 30);
					
					// Login success
					setcookie('username', $_SESSION['username'], $month, '/');
					setcookie('usertype', $type, $month, '/');
					// Logged In!!!!
					return true;
				}
			}
		}
	}
	
	setcookie('username', null, -1000, '/');
	setcookie('usertype', null, -1000, '/');
	return false;
}

function is_donator($mysqli) {
	// Check if all session variables are set
	if (isset($_SESSION['user_id'], $_SESSION['username'])) {
		$user_id = $_SESSION['user_id'];
 
		if ($stmt = $mysqli->prepare("SELECT donate
									  FROM members 
									  WHERE id = ? LIMIT 1")) {
			// Bind "$user_id" to parameter.
			$stmt->bind_param('i', $user_id);
			$stmt->execute();   // Execute the prepared query.
			$stmt->store_result();
 
			if ($stmt->num_rows == 1) {
				// If the user exists get variables from result.
				$stmt->bind_result($donate);
				$stmt->fetch();
 
				if ($donate) {
					return true;
				}
			}
		}
	}
	return false;
}

function esc_url($url) {
	if ('' == $url) {
		return $url;
	}
 
	$url = preg_replace('|[^a-z0-9-~+_.?#=!&;,/:%@$\|*\'()\\x80-\\xff]|i', '', $url);
 
	$strip = array('%0d', '%0a', '%0D', '%0A');
	$url = (string) $url;
 
	$count = 1;
	while ($count) {
		$url = str_replace($strip, '', $url, $count);
	}
 
	$url = str_replace(';//', '://', $url);
 
	$url = htmlentities($url);
 
	$url = str_replace('&amp;', '&#038;', $url);
	$url = str_replace("'", '&#039;', $url);
 
	if ($url[0] !== '/') {
		// We're only interested in relative links from $_SERVER['PHP_SELF']
		return '';
	} else {
		return $url;
	}
}

function generateToken($length = 20) {
	return bin2hex(random_bytes($length));
}

function getRandomString($length = 10) {
	$validCharacters = "ABCDEFGHIJKLMNPQRSTUXYVWZ123456789";
	$validCharNumber = strlen($validCharacters);
	$result = "";
 
	for ($i = 0; $i < $length; $i++) {
		$index = mt_rand(0, $validCharNumber - 1);
		$result .= $validCharacters[$index];
	}
	return $result;
}

function array_merge_recursive_distinct(array &$array1, array &$array2) {
	$merged = $array1;

	foreach ($array2 as $key => &$value) {
		if (is_array($value) && isset($merged [$key]) && is_array($merged [$key])) {
			$merged [$key] = array_merge_recursive_distinct($merged [$key], $value);
		} else {
			$merged [$key] = $value;
		}
	}

	return $merged;
}
