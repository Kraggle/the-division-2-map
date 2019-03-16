
<?
$time = time() + (86400 * 30); // 86400 = 1 day
setcookie('mode', 'survival', $time, "/");

header("Location: ../");
exit;