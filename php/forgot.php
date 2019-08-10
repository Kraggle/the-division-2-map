<? include_once 'db_connect.php';
include_once 'functions.php'; ?>

<div class="side-content">
	<span class="title sub">Forgot Password</span>

	<p>Enter the email address you registered with and an email will be sent with a reset code to it. Remember to check the junk mail if you don't find the email.</p>

	<form id="forgot" name="forgot_form">
		<input class="input" placeholder="Email Address" type="text" name="username" id="email" <?if (isset($email) && $email) {echo " value='$email'" ;}?>/><br>
		<input class="button" type="button" value="Reset" />
	</form>

	<a name="login" class="page button">Sign In</a>

	<? include "../docs/credits.html" ?>
</div>
