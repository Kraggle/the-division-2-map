<? include_once 'functions.php'; ?>
<div class="side-content">
	<span class="title">Create Account</span>
	<ul class="help">
		<li class="username">Usernames may contain only digits, upper and lowercase letters and underscores</li>
		<li class="email">Emails must have a valid email format</li>
		<li class="password">Passwords must contain
			<ul>
				<li class="password">At least 6 characters</li>
				<li class="password">At least one uppercase letter (A..Z)</li>
				<li class="password">At least one lowercase letter (a..z)</li>
				<li class="password">At least one number (0..9)</li>
			</ul>
		</li>
		<li class="confirmpwd">Your password and confirmation must match exactly</li>
	</ul>
	<form id="regform" name="registration_form">
		<input class="input" placeholder="Username" type='text' name='username' id='username' /><br>
		<input class="input" placeholder="Email Address" type="text" name="email" id="email" /><br>
		<input class="input" placeholder="Password" type="password" name="password" id="password" /><br>
		<input class="input" placeholder="Confirm password" type="password" name="confirmpwd" id="confirmpwd" /><br>
		<input class="button" type="button" value="Register" />
	</form>
	<a name="login" class="page button">Sign In</a>

	<p class="error">
		<?if(isset($_GET['error'])){echo $_GET['error'];}?>
	</p>

	<? include "../docs/credits.html" ?>

</div>
