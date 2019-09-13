---
layout: post
title: "记某日偶遇PostgreSQL注入"
tags: [blog]
author: msyb
---

某日(数个月前)闲的没事挖洞，遇到一处sql注入.

![1](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/18a4ca66ee86681c1983ea92d60883b0.png)

注入点位于limit处，没有任何过滤而且有错误信息.

测试一下mysql limit注入的payload:

`pagesize=1,1 procedure analyse(extractvalue(rand(),concat(0x3a,version())),1)`

结果提示:

`Syntax error: 7 ERROR: LIMIT #,# syntax is not supported`

大惊，居然不是mysql，哪是啥数据库呢？

开始一番搜索，最后确定是`PostgreSQL`. 然而并没有找到类似的postgresql limit注入的例子，我也从来没用过postgresql，只好自己研究了.

![2](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/966ec50ad5bb5af1a1401b40ef4fc7ea.png)

通过[官方文档](https://www.postgresql.org/docs/current/sql-select.html)，得知limit后有个`count`，来看一看是啥.

![3](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/36068e86aaf81cd5f690d48492ee382e.png)

一眼就看到了count表达式，也就是说可以是一句sql，不像mysql必须是数字，有、高级.

接下来就是确定注入的payload，发现可以进行盲注和报错注入.

报错payload:  
`cast(chr(126)||(select version())||chr(126)+as+numeric)--+`

有趣的事是刚开始是因为不太了解postgresql，没搞出报错注入的payload，只研究了盲注.

盲注一般是通过页面的返回状态来确定注入结果的，例如`limit (select 1)`有返回查询的东西然后`limit (select 0)`返回空集没有结果.

这里这个请求的用途是查询别人放送过来的消息，然而尴尬的是并没有消息，所以不管1还是0都返回空集.

所以只能考虑基于报错和不报错这两个状态的盲注.

参考下今年国赛初赛的某个题：

[通过CISCN2019 Day 1 SQL注入思考基于运行时错误的盲注](https://xz.aliyun.com/t/4914)

又参考了sqlmap的postgresql盲注的payload模板，最后利用`exp(666)`报错确定payload为:

`(case when((length((select version())))=?) then 1 else exp(666) end)--+`

`(select(case when((select version()) from ? for ?)))<?) then 1 else exp(666) end))--+`

然后随便写个脚本跑就行了.
