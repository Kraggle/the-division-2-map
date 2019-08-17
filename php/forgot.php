<? include_once 'db_connect.php';
include_once 'functions.php'; ?>

<div class="side-content grid">
	<span class="title span-row">Forgot Password</span>

	<p class="span-row">Enter the email address you registered with and an email will be sent with a reset code to it. Remember to check the junk mail if you don't find the email.</p>

	<form id="forgot" name="forgot_form" class="span-row">
		<input class="input span-row" placeholder="Email Address" type="text" name="username" id="email" <?if (isset($email) && $email) {echo " value='$email'" ;}?>/>
		<a name="login" class="page button textual sign-in ripple-me">Sign In</a>
		<input class="button ripple-me" type="button" value="Reset" />
	</form>

	<? include "../docs/credits.html" ?>
</div>
