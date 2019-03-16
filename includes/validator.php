<?
include_once 'functions.php';
include_once 'db_connect.php';

if (isset($_POST)) {
	
	// When we first click the remember me button we create a validator
	$cookie_name = 'validator';
		
	if ($_POST['checked'] == "true") {
		$time = time() + (86400 * 30); // 86400 = 1 day
		
		if (!isset($_COOKIE[$cookie_name])) {
			$validator = generateToken(10);
		} else {
			$validator = $_COOKIE[$cookie_name];
		}
		
		// either set or refresh the cookie time
		setcookie($cookie_name, $validator, $time, "/");
		
	} else if (isset($_COOKIE[$cookie_name])) {
			
        $validator = $_COOKIE['validator'];      
        $selector = substr(hash('sha256', $validator), 0, 12);
        
		$mysqli->query("DELETE FROM `auth_tokens` WHERE `selector` = '$selector'");
		
		setcookie($cookie_name, null, time() - 3600, "/");
		setcookie('token', null, time() - 3600, "/");
	}
}

?>