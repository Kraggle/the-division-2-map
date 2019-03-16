<?
include_once 'functions.php';
include_once 'db_connect.php';

$email = false;

if (!login_check($mysqli) && isset($_COOKIE['validator'])) {
	
	$validator = $_COOKIE['validator'];
	$selector = substr(hash('sha256', $validator), 0, 12);
	
	if (isset($_COOKIE['token'])) {
	
		$token = $_COOKIE['token'];
    
		$stmt = $mysqli->prepare("SELECT `user_id`, `expires` FROM `auth_tokens` WHERE `selector` = ? AND `token` = ?");
		$stmt->bind_param('ss', $selector, $token); 
		$stmt->execute(); 
		$stmt->store_result();
 	
		// get variables from result.
		$stmt->bind_result($user_id, $expires);
		$stmt->fetch();
	
		if ($stmt->num_rows) {
			// Check if the token is still in date
			$date = new DateTime($expires);
			$time = $date->getTimestamp();
			
			if ($time > time()) {
				
				if (remember($user_id, $mysqli)) {
					
					$time = time() + (86400 * 30); // 86400 = 1 day
					setcookie('username', $_SESSION['username'], $time, "/");
					setcookie('usertype', $_SESSION['usertype'], $time, "/");
				}
				
			} else {
				
				setcookie('token', null, -1000, "/");
				
				$delete = $mysqli->prepare("DELETE FROM auth_tokens WHERE user_id = $user_id");
				$delete->execute();
			}
			
		} else
			setcookie('token', null, -1000, "/");
	}
}

?>