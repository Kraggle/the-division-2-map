
<!DOCTYPE html>
<html>
<head>
<title>Mail Test</title>
<style>
td {
	vertical-align: top;
}
</style>
</head>
<body>
<h1>Mail Test</h1>

<form id="mailform" name="mailform">
	To: <input name="toemail" type="text" size="40" value="kraggle@live.co.uk"/><br />
	From: <input value="" name="from" type="text" size="40" /><br />
	Subject: <input name="subject" type="text" disabled size="40" />
	auto <input type="checkbox" onchange="AutoSubject();" name="autosubject" checked><br />
	Message:<br />
	<textarea name="message" rows="15" cols="40">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed tempor incididunt ut labore et dolore magna aliqua. </textarea><br />
	<button type="button" id="sendemail" onclick="GoSend(); AutoSubject();">Send</button>
	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Method&nbsp;<select onchange="AutoSubject();" name="sendmethod" >
		<option value="mail">PHP mail()</option>
		<option value="smtp">SMTP</option>
		<option value="sendmail">sendmail from shell</option>
	</select>
</form>
<br /><br />

<hr>

<table id="msglog" border="1" bordercolor="#FFCC00" style="background-color:#FFFFCC" width="100%" cellpadding="3" cellspacing="3">
	<tr>
		<td>#</td>
		<td>TIME</td>
		<td>TO</td>
		<td>FROM</td>
		<td>SUBJECT</td>
		<td>MESSAGE</td>
		<td>METHOD</td>
		<td>NODE</td>
		<td>RESULT</td>
	</tr>
</table>

<script>
var msgid = 1;
AutoSubject();

function AutoSubject() {
	if ( document.mailform.autosubject.checked ) {
		document.mailform.subject.disabled=true;
		document.mailform.subject.value='Test email using '+document.mailform.sendmethod.value+' #'+msgid;
	} else {
		document.mailform.subject.disabled=false;
	}
}

function GoSend() {
	var table=document.getElementById("msglog");
	var row = table.insertRow(1);
	
	var NUMcell = row.insertCell(0);
	NUMcell.innerHTML=msgid++;
	
	var DATEcell = row.insertCell(1);
	var d = new Date();
	DATEcell.innerHTML=d.toLocaleTimeString();
	
	var TOcell = row.insertCell(2);
	TOcell.innerHTML=document.mailform.toemail.value;
	
	var FROMcell = row.insertCell(3);
	FROMcell.innerHTML=document.mailform.from.value;
	
	var SUBJECTcell = row.insertCell(4);
	SUBJECTcell.innerHTML=document.mailform.subject.value;
	
	var MESSAGEcell = row.insertCell(5);
	MESSAGEcell.innerHTML=document.mailform.message.value;
	
	var METHODcell = row.insertCell(6);
	METHODcell.innerHTML=document.mailform.sendmethod.value;
	
	var NODEcell = row.insertCell(7);
	
	var RESULTcell = row.insertCell(8);
	RESULTcell.innerHTML="<img height=\"24\" src=\"data:image/gif;base64,R0lGODlhEAAQAPYAAP///wAAANTU1JSUlGBgYEBAQERERG5ubqKiotzc3KSkpCQkJCgoKDAwMDY2Nj4+Pmpqarq6uhwcHHJycuzs7O7u7sLCwoqKilBQUF5eXr6+vtDQ0Do6OhYWFoyMjKqqqlxcXHx8fOLi4oaGhg4ODmhoaJycnGZmZra2tkZGRgoKCrCwsJaWlhgYGAYGBujo6PT09Hh4eISEhPb29oKCgqioqPr6+vz8/MDAwMrKyvj4+NbW1q6urvDw8NLS0uTk5N7e3s7OzsbGxry8vODg4NjY2PLy8tra2np6erS0tLKyskxMTFJSUlpaWmJiYkJCQjw8PMTExHZ2djIyMurq6ioqKo6OjlhYWCwsLB4eHqCgoE5OThISEoiIiGRkZDQ0NMjIyMzMzObm5ri4uH5+fpKSkp6enlZWVpCQkEpKSkhISCIiIqamphAQEAwMDKysrAQEBJqamiYmJhQUFDg4OHR0dC4uLggICHBwcCAgIFRUVGxsbICAgAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAAHjYAAgoOEhYUbIykthoUIHCQqLoI2OjeFCgsdJSsvgjcwPTaDAgYSHoY2FBSWAAMLE4wAPT89ggQMEbEzQD+CBQ0UsQA7RYIGDhWxN0E+ggcPFrEUQjuCCAYXsT5DRIIJEBgfhjsrFkaDERkgJhswMwk4CDzdhBohJwcxNB4sPAmMIlCwkOGhRo5gwhIGAgAh+QQJCgAAACwAAAAAEAAQAAAHjIAAgoOEhYU7A1dYDFtdG4YAPBhVC1ktXCRfJoVKT1NIERRUSl4qXIRHBFCbhTKFCgYjkII3g0hLUbMAOjaCBEw9ukZGgidNxLMUFYIXTkGzOmLLAEkQCLNUQMEAPxdSGoYvAkS9gjkyNEkJOjovRWAb04NBJlYsWh9KQ2FUkFQ5SWqsEJIAhq6DAAIBACH5BAkKAAAALAAAAAAQABAAAAeJgACCg4SFhQkKE2kGXiwChgBDB0sGDw4NDGpshTheZ2hRFRVDUmsMCIMiZE48hmgtUBuCYxBmkAAQbV2CLBM+t0puaoIySDC3VC4tgh40M7eFNRdH0IRgZUO3NjqDFB9mv4U6Pc+DRzUfQVQ3NzAULxU2hUBDKENCQTtAL9yGRgkbcvggEq9atUAAIfkECQoAAAAsAAAAABAAEAAAB4+AAIKDhIWFPygeEE4hbEeGADkXBycZZ1tqTkqFQSNIbBtGPUJdD088g1QmMjiGZl9MO4I5ViiQAEgMA4JKLAm3EWtXgmxmOrcUElWCb2zHkFQdcoIWPGK3Sm1LgkcoPrdOKiOCRmA4IpBwDUGDL2A5IjCCN/QAcYUURQIJIlQ9MzZu6aAgRgwFGAFvKRwUCAAh+QQJCgAAACwAAAAAEAAQAAAHjIAAgoOEhYUUYW9lHiYRP4YACStxZRc0SBMyFoVEPAoWQDMzAgolEBqDRjg8O4ZKIBNAgkBjG5AAZVtsgj44VLdCanWCYUI3txUPS7xBx5AVDgazAjC3Q3ZeghUJv5B1cgOCNmI/1YUeWSkCgzNUFDODKydzCwqFNkYwOoIubnQIt244MzDC1q2DggIBACH5BAkKAAAALAAAAAAQABAAAAeJgACCg4SFhTBAOSgrEUEUhgBUQThjSh8IcQo+hRUbYEdUNjoiGlZWQYM2QD4vhkI0ZWKCPQmtkG9SEYJURDOQAD4HaLuyv0ZeB4IVj8ZNJ4IwRje/QkxkgjYz05BdamyDN9uFJg9OR4YEK1RUYzFTT0qGdnduXC1Zchg8kEEjaQsMzpTZ8avgoEAAIfkECQoAAAAsAAAAABAAEAAAB4iAAIKDhIWFNz0/Oz47IjCGADpURAkCQUI4USKFNhUvFTMANxU7KElAhDA9OoZHH0oVgjczrJBRZkGyNpCCRCw8vIUzHmXBhDM0HoIGLsCQAjEmgjIqXrxaBxGCGw5cF4Y8TnybglprLXhjFBUWVnpeOIUIT3lydg4PantDz2UZDwYOIEhgzFggACH5BAkKAAAALAAAAAAQABAAAAeLgACCg4SFhjc6RhUVRjaGgzYzRhRiREQ9hSaGOhRFOxSDQQ0uj1RBPjOCIypOjwAJFkSCSyQrrhRDOYILXFSuNkpjggwtvo86H7YAZ1korkRaEYJlC3WuESxBggJLWHGGFhcIxgBvUHQyUT1GQWwhFxuFKyBPakxNXgceYY9HCDEZTlxA8cOVwUGBAAA7AAAAAAAAAAAA\">";
	
	var postdata= "sendemail=1&toemail="+document.mailform.toemail.value;
	    postdata+="&from="+document.mailform.from.value;
	    postdata+="&subject="+document.mailform.subject.value;
	    postdata+="&sendmethod="+document.mailform.sendmethod.value;
	    postdata+="&message="+encodeURIComponent(document.mailform.message.value).replace("%20", "+");
	var url="/includes/mail.php";
	var request=new XMLHttpRequest();
	request.open("POST",url,true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	request.overrideMimeType("text/plain");
	request.onreadystatechange=function() { 
		if ( request.readyState==4 ) {
			NODEcell.innerHTML=request.getResponseHeader("X-Node");
			if ( request.responseText == "OK" || request.responseText == "FAIL" ) {
				RESULTcell.innerHTML=request.responseText;
			} else {
				if ( request.status == 0 ) {
					RESULTcell.innerHTML="ERR_EMPTY_RESPONSE";
				} else {
					RESULTcell.innerHTML="HTTP/1.1 "+request.status+" "+request.statusText+"<br /><br />"+request.responseText;
				}
			}
		}
	}
	request.send(postdata);
}
</script>
</body>
</html>