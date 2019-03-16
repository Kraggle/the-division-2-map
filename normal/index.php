
<?
$time = time() + (86400 * 30); // 86400 = 1 day
setcookie('mode', 'normal', $time, "/");

header("Location: ../");
exit;