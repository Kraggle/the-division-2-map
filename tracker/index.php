
<?
$time = time() + (86400 * 30); // 86400 = 1 day
setcookie('sideBar', true, $time, "/");
setcookie('sideMenu', 'gear', $time, "/");

header('Location: ../');
exit;