<div class="credits">
	<? if (@$tran) { ?>
	<span style="display:<? echo ($credit->by == "" ? " none" : "block" );?>" class="lang credits">Translated by: <a class="lang credits name dnt" href="mailto:<? echo $credit->email ?>">
			<? echo $credit->by ?></a></span>
	<div style="margin-bottom:10px;"></div>
	<? } ?>

	<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
		<input type="hidden" name="cmd" value="_s-xclick">
		<input type="hidden" name="hosted_button_id" value="EFY8UR4NG6622">
		<!-- <input type="image" class="paypalBtn" src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online!"> -->
		<input type="image" class="paypalBtn credit-icon" src="images/icon-paypal.svg" border="0" name="submit" alt="PayPal – The safer, easier way to pay online!">
		<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">
		<!-- <img class="credit-icon" src="images/icon-paypal.svg"> -->
	</form>

	<!-- <span class="credits tag">Discord: </span><a class="credits tag dnt" target="_blank" href="https://discord.gg/5gag92h">Kraggle Cartel</a><br> -->
	<!-- <a class="credits beer" target="_blank" href="https://www.paypal.me/kraggle">Buy me a beer!</a> -->
	<a href="https://discord.gg/5gag92h" target="_blank"><img class="credit-icon" src="images/icon-discord.svg"></a>
	<a href="https://www.overwolf.com/app/kraggle-the_division_map" target="_blank"><img class="credit-icon" src="images/icon-overwolf.svg"></a>
	<a href="https://division-builds.com/" target="_blank"><img class="credit-icon" src="images/icon-builds.svg?v=0.1"></a>

	<? if (@$seal) { ?>
	<span id="siteseal">
		<script async type="text/javascript" src="https://seal.godaddy.com/getSeal?sealID=tN6HXw9rg0bmRN4Xwkgq2UPHXMG6uYgrh1Q7wvv5v9DEAmrCgSpYXQt7m7xP"></script>
	</span>
	<? } ?>

	<span class="credits">by: </span><a class="credits name dnt" href="mailto:kraggle27@gmail.com" target="_top">Kraggle</a><br>
</div>
