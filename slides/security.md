title: Web-Security
theme: sjaakvandenberg/cleaver-light
--
# Web-Security

--

## OWASP TOP 10 2017

1. Injection
2. Broken Authentication and Session Management
3. Sensitive Data Exposure
4. XML External Entities
5. Broken Access Control
6. Security Misconfiguration
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Using Known Vulnerable Components
10. Insufficient Logging & Monitoring

--

## What Will Be Covered

* Injection
* Directory Traversal + Path Enumeration
* Host Header Poisoning + Cache Poisoning
* Unvalidated Redirects
* Clickjacking
* XSS
* Unserialize Attacks
* Session hijacking
* File Upload
* XXE
* CSRF
* SSRF
* Timing Attacks
* Password Hashing
* Insecure Dependencies

--

## General Resources

Cheat sheets available at [OWASP](https://cheatsheetseries.owasp.org/index.html)

--

## Injection Vulnerabilities

* SQL Injection
* Shell Injection
* LDAP Injection
* etc

### Example: Shell Injection Vulnerability

```java
Runtime.getRuntime().exec("ls " +  fileName);
```

--

### Shell Injection Attack
```java
var fileName = "/a/valid/file;rm -rf /";
// translates to 
Runtime.getRuntime().exec("cat /a/valid/file; rm -rf /");
```


### Injection Prevention

* Escape parameters based on context
* Use framework/language provided APIs to escape them properly
  * Builders (URL, SQL, etc)
  * Prepared SQL statements
  * Arrays of command line parameters instead of a pre-assembled string
* Beware of combinations (e.g. LDAP commands via shell)! 
* [Cheat Sheet available](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html)

--

## File Referencing Vulnerabilities

```java
var content = new String(Files.readAllBytes(Paths.get(fileName)));
```

--

### Directory Traversal Attack
```java
var fileName = "../../../etc/passwd"
// translates to
var content = new String(Files.readAllBytes(Paths.get(../../../etc/passwd)));
```

### Path Enumeration Attack

* Try to figure out if a file exists (e.g. through thrown Errors)

```java
var fileName = "../../../etc/guessedFile"
// translates to
var content = new String(Files.readAllBytes(Paths.get(../../../etc/guessedFile)));
```

--

### File Referencing Prevention

* If a file can be requested by user input, lock it down to one folder
* Check if the **absolute** evaluated path points to the locked down folder (otherwise ../ shenanigans can ensue)
* If applicable do not expose if a file exists

--

## Host Header Poisoning Vulnerability
```java
@RequestMapping("/reset-password")
public void resetPasswordEmail(HttpServletRequest request, @RequestParam("email") String email) {
  String resetUrl = request.getRequestURL().toString() + "/new-password";
  String message = "Please go to " + resetUrl + " and enter a new password";
  Mail.send(email, message)
}
```

--

### Host Header Poisoning Attack

```http
POST /reset-password HTTP/1.1
Host: myattackdomain.com
```

```http
POST /reset-password HTTP/1.1
Host: valid-domain.com
Host: myattackdomain.com
```

```http
POST /reset-password HTTP/1.1
Host: valid-domain.com:@myattackdomain.com
```

```http
POST /reset-password HTTP/1.1
Host: valid-domain.com
X-Forwarded-Host: myattackdomain.com
```

--

### Host Header Poisoning Prevention
* Do not use the host header to construct URLs
* Or whitelist domains explicitly

**Java**:
```java
var validDomains = Arrays.asList("myshopdomain.com", "192.168.0.1");
validDomains.stream()
  .filter(allowedDomain -> request.getServerName().equals(allowedDomain))
  .findAny()
  .orThrow(new HttpForbiddenException());
```

--

### Cache Poisoning Vulnerability

```java
var domain = getHostHeader();
updateCacheOnChange(domain);
```

--

### Cache Poisoning Vulnerability

Let's update the cached templates for all users based on our input

```java
var domain = "myattackdomain.com";
updateCacheOnChange(domain);
```

---

### Cache Poisoning Prevention

* Depends on your cache setup
* Ideally create cache per logged-in user or avoid creating it with user provided parameters such as HTTP headers


--

## Unvalidated Redirects Vulnerability

```java
@RequestMapping("/redirect")
public void redirectTo(@RequestParam("url") String toUrl) {
  return "redirect:" + toUrl;
}
```

--

### Unvalidated Redirects Attack

Let's try some fishing emails which use the following link

```html
<a href="legit.bank.com/redirect?url=http://my.bank.com">Login</a>
```

--

### Unvalidated Redirects Prevention

* Whitelist possible redirect URLs
* Check the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) for anything more complex, the URL standard is very complex

--

### Clickjacking Attack

Invisible IFrame + CSS magic which redirects clicks to target website

[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/3mk0RySeNsU/0.jpg)](http://www.youtube.com/watch?v=3mk0RySeNsU)

--

### Clickjacking Prevention

* Set the correct HTTP headers
* Consult the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)

--

## XSS Vulnerability

Similar to Injection Vulnerabilities

```java
var element = '<input type="text" value="' + value + '"/>';
```

--

### XSS Attack

```java
var value = "\" /> &lt;script&gt;alert('hi')&lt;/script&gt;<img src=\"";
// produces
var element = '<input type="text" value="" /> <script>alert(\'hi\')</script><img src=""/>';
```

--

### Lesser Known XSS Vulnerabilities
* **href**, **src**, **style** and **&lt;style&gt;** allow javascript:alert('hi')
* **SVG** allows JavaScript
* element.innerHTML should be avoided in favor of element.innerText
* [Quirks mode](https://portswigger.net/research/detecting-and-exploiting-path-relative-stylesheet-import-prssi-vulnerabilities) allows text files to be loaded as js files
* Since XSS is an injection vulnerability context matters: script or style tags have different escape mechanisms

--

### XSS Prevention
* For the love of god, try if you can add [CSP](https://developer.mozilla.org/en-US/docs/Web/Security/CSP)
* [Consult the cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) (**required**!)
* Serve user uploaded media from a different domain to make use of browser sand-boxing
* If user supplied HTML is needed, use an XML parser that supports whitelisting (some JS frameworks execute code based on html attribute values)
* Escape based on usage
* Do not use server side rendered JS or CSS that depend on user input

--

## Session Hijacking Vulnerability

* Ever seen these URLs: **/some-url?SESSION_ID=1234kj123k12323** ?
* No secure cookies flag?
* No HSTS?
* XSS all the cookies?

--

### Session Hijacking Attack

Generate url with your session id and send it to the victim:

**https://myshop.com/login?SESSION_ID=1234kj123k12323**

You can now reuse the session

If no secure cookie flag is set you can MITM the cookie

If HSTS is not present the attacker can use [MITM for HTTP redirects](https://www.owasp.org/index.php/HTTP_Strict_Transport_Security#Threats)

--

### Session Hijacking Prevention
* Session ID should have enough entropy to prevent guessing
* Use the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
* Set expiration dates for sessions and cookies
* Regenerate session on login and privilege change (+ if possible two-factor auth)
* Bind session to IP
* Cookie paths
* HTTPS everywhere (also subdomains)
* HSTS (includeSubDomains or be vulnerable to [MITM cookies from subdomains](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html#problems))
* HTTPS cookies

--

## Unserialize Vulnerability

```java
var vo1 = new SomeObject("Hi");
try (FileOutputStream fileOut = new FileOutputStream("ValueObject.ser")) {
    try (ObjectOutputStream out = new ObjectOutputStream(fileOut)) {
        out.writeObject(vo1);    
    }
}

FileInputStream fileIn = new FileInputStream("ValueObject.ser");
ObjectInputStream in = new ObjectInputStream(fileIn);
ValueObject vo2 = (ValueObject) in.readObject();
```

--

### Unserialize Attack
* Basic idea
  * Serialization always includes the class name as well
  * We can freely choose the class name to one that does stuff on **unserialize** (some execute arbitrary code)

--

### Unserialize Attack Prevention
* Check the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
* Avoid unserialization like the plague and use a proper intermediate format like JSON

--

### File Upload Vulnerability

* Apache feature: [Double Extensions](https://www.acunetix.com/websitesecurity/upload-forms-threat/) ❀(*´◡`*)❀

> Files can have more than one extension, and the order of the extensions is normally irrelevant. For example, if the file welcome.html.fr maps onto content type text/html and language French then the file welcome.fr.html will map onto exactly the same information. If more than one extension is given which maps onto the same type of meta-information, then the one to the right will be used, except for languages and content encodings. For example, if .gif maps to the MIME-type image/gif and .html maps to the MIME-type text/html, then the file welcome.gif.html will be associated with the MIME-type text/html.
 
* If we don't specify 123 as mime-type, **file.php.123** will be executed as PHP m/
* Chrome + IE sniffing: Chrome/IE try to find out the mimetype by parsing the file -> execute code from file.txt
* Uploading executable files like **.htaccess** can open up more attack vectors 

--

### File Upload Prevention
* Use Nginx
* Use a separate static content server and domain
* Add  X-Content-Type-Options: nosniff  to prevent content sniffing
* Generate filenames, **NEVER, EVER** use user supplied mime types or names (**$_FILES[‘uploadedfile’][‘name’]:**, **$_FILES[‘uploadedfile’][‘type’]**)
* Do not execute anything from the upload directory (no include, require)
* Disallow special files (.htaccess, [.user.ini](http://php.net/manual/en/configuration.file.per-user.php), web.config, robots.txt, crossdomain.xml, clientaccesspolicy.xml) and turn off .htaccess parsing
* Remove executable bits from uploads (644)
* Set the correct content type when serving the file
* Disallow SVG (JavaScript can be embedded) and HTML
* [For all the PHP users out there](http://nullcandy.com/php-image-upload-security-how-not-to-do-it/)

--

## XXE Vulnerability

```java
DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
Document doc = dBuilder.parse(userSuppliedXml);
```

--

### XXE Attack

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [  
 <!ELEMENT foo ANY >
 <!ENTITY xxe SYSTEM "file:///etc/passwd" >]><foo>&xxe;</foo>
```

--

### XXE Prevention

* Do not use XML.
* Disable XML External Entity Processing! Also applies for SVGs!

**Java**:
```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
String FEATURE = "http://xml.org/sax/features/external-general-entities";
dbf.setFeature(FEATURE, false);
```

* While you're at it, read about the [many other ways](https://cheatsheetseries.owasp.org/cheatsheets/XML_Security_Cheat_Sheet.html) how XML can be used to take down or exploit your servers!
--

### CSRF Vulnerability
```java
@PostMapping("/delete-user")
public void deleteUser(@RequestParam("user") String user) {
  if (isAuthenticated()) {
    userService.delete(user)
  }
}
```
--

### CSRF Attack

Attack via hidden form, include it on a page the user surfs to, e.g. google ads :)

```xml
<form action="https://myshop.com/delete-user" method="post">
<input name="user" value="admin">
</form>
<script>
  document.forms[0].submit();
</script>
```

You can extend that to all AJAX requests as well if you fuck up your CORS configuration!

--

### CSRF Prevention

* Consult the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
* Generate a token with valid timespan and pass it to client (NO COOKIE!!!), validate token for each request
* Spring: CSRF enforced by default since Spring Security 4.0

```xml
<input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>
```
```xml
<meta name="_csrf" content="${_csrf.token}"/>
<meta name="_csrf_header" content="${_csrf.headerName}"/>
```

Beware of [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Access-Control-Allow-Credentials) with credentials enabled or CSRF all of your API!

--


## SSRF Vulnerability

```java
var result = httpClient.get(userProvidedUrl)
```

### SSRF Attack

```java
var userProvidedUrl = "https://any-server-in-your-dmz/somethingevil"
var result = httpClient.get(userProvidedUrl)
```

### SSRF Prevention

* Whitelist HTTP calls if user provided
* Consult the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

## Timing Attack Vulnerabilities
```java
@RequestMapping("/authenticate")
public void resetPasswordEmail(@RequestParam("user") String user, @RequestParam("pass") String pass) {
  if (user.equals("John") && pass.equals("Passw0rd")) {
    // authenticate user
  }
}
```

--

### Timing Attack

* Send arbitrary strings and measure how fast they complete
* Since equals aborts at the first character mismatch, correct guesses take longer

--

### Timing Attack Prevention
**Constant time string compare algorithms!**

**Java:**
```java
// method constantEquals has to be implemented by you or a lib
if (constantEquals(user, "John") && constantEquals(pass, "Passw0rd")) {
  // authenticate user
}
```

--

### Timing Attack Special: BEAST

* Uses compression: if one part of the message allows user input, you can guess its contents, even when encrypted
* See [https://medium.com/@c0D3M/beast-attack-explained-f272acd7996e](https://medium.com/@c0D3M/beast-attack-explained-f272acd7996e) for a more detailed explanation
* Enforce TLS 1.1 or higher

### Password Hashing Vulnerability


**Java**:
```java
String password = "mypass";
String hashedPassword = hash(password);
```

--

### Password Hashing Attack

Rainbow Tables

--

### Passwort Hashing Attack Prevention

* Consult the [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

* **bcrypt** is the currently recommended hashing algorithm
* Give each password a separate salt to prevent rainbow tables

```java
String global_salt = BCrypt.gensalt();  // saved in config
String salt = BCrypt.gensalt();  // saved in database with each user
String hashedPassword = BCrypt.hashpw(password, global_salt + salt);
```

--
