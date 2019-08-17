<?
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
		<p>Click on the given link to reset your password <a href='http://$uri?token=blah&forgot=true'>Reset Password</a></p>
	</body>
</html>";

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=iso-8859-1" . "\r\n";
$headers .= 'From: The-Division-2-Map<admin@the-division-2-map.com>' . "\r\n";

if (mail("kraggle@live.co.uk", $subject, $message, $headers)) {
	echo  "Your password reset link has been sent."; 
} else {
	echo "The email failed to send.";
}
