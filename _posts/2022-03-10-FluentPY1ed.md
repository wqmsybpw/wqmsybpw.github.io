---
layout: post
title: "流畅的Python笔记(待完成)"
tags: [blog]
author: wqpw
---

TODO: `看第二版然后重新整理`

第一章

{% highlight python %}
# python docs <Data Model>
# magic/dunder method
# example 1-1 牌
from collections import namedtuple
from random import choice
Card = namedtuple('Card', ['rank', 'suit'])
class FrenchDeck:
    ranks = [str(n) for n in range(2, 11)] + list('JQKA')
    suits = 'spades diamonds clubs hearts'.split()
    def __init__(self) -> None:
        self._cards = [Card(rank, suit) for suit in self.suits for rank in self.ranks]
    def __len__(self):
        return len(self._cards)
    def __getitem__(self, position):
        return self._cards[position]

deck = FrenchDeck()
print(f'总共有{len(deck)}张牌.')
for i in range(3): print(choice(deck))
print(deck[12::13]) # A
print(Card('Q', 'hearts') in deck) # 没有实现__contains__默认顺序查找

# python内置类型调用len()实际上返回PyVarObject的ob_size属性
# 特殊方法调用一般是隐式的 for i in x: 和 x.__iter__()

# example 1-2 二维向量
from math import hypot
class Vector:
    def __init__(self, x=0, y=0) -> None:
        self.x = x
        self.y = y
    def __repr__(self) -> str:
        return f'Vector({self.x:.2f}, {self.y:.2f})'
    def __abs__(self):
        return hypot(self.x, self.y)
    def __bool__(self):
        return bool(self.x or self.y)
    def __add__(self, other): # 中缀运算符原则：不改变操作对象
        x = self.x + other.x
        y = self.y + other.y
        return Vector(x, y)
    def __mul__(self, scalar): #交换律： __rmul__
        return Vector(self.x * scalar, self.y * scalar)
v1 = Vector(2, 4)
v2 = Vector(2, 1)
print(f'v1+v2={v1+v2}', abs(v1), v2*3)

# __str__在str()或print时被使用，__repr__可以代替__str__
# __repr__ 调试、日志 __str__ 终端用户
{% endhighlight %}

第二章
{% highlight python %}
# 列表推导(listcomps)和生成器表达式(genexps)
# 列表推导只用来创建新的列表并保持简短；python会忽略[], {}, () 中的换行
print([ord(s) for s in '测试abcd' if ord(s) > 127])
print([(a, b) for a in '123' for b in 'abc'])

# 生成器表达式逐个产出元素，节省内存
print(tuple(ord(s) for s in 'abcd'))
import array
from unicodedata import name
print(array.array('I', (ord(s) for s in 'qwe')))

# 元组 拆包应用
city, year, pop = ('a', '1919', 114514)
ids = [('a', 'b'), ('c', 'd')]
print('%s/%s' % ids[0])
for q, _ in ids: print(q)
#交换 b, a = a, b
t = (20, 8)
print(divmod(*t))

# 平行赋值
a, b, *rest = range(5)
print((a, b, rest))
a, *b, c = range(5)
print((a, b, c))

# 具名元组
from collections import namedtuple
City = namedtuple('City', 'n c p o')
t = City('t', 'j', 3, (3, 3))
print((t.n, t[2]))
print(City._fields)
d = City._make(('a', 'b', 4, (1, 1)))
for k, v in d._asdict().items(): print(k + ':', v)

# 切片 seq[start:stop:step] == seq.__getitem__(slice(start, stop, step))
l = list(range(10))
print(l)
l[2:5] = [20, 30]; print(l)
del l[5:7]; print(l)
l[3::2] = [11, 22]; print(l)
l[2:5] = [100]; print(l)

# * + +=
print([1] * 5); q = [[]] * 3; q[0].append(1); print(q)
print([['_'] * 3 for _ in range(3)])
l = [1, 2]; print(id(l)); l *= 2; print(id(l))
l = (1, 2); print(id(l)); l *= 2; print(id(l)) # 不可变类型重复拼接效率低
try:
    t = (1, 2, [30, 40])
    __import__('dis').dis('t[2] += [50, 60]')
    t[2] += [50, 60]
except Exception as e:
    print(e)
print(t)

# 排序 list.sort会就地排序列表，返回None; sorted接受任何形式的可迭代对象返回list
# python的timsort算法是稳定的
print(sorted(('a', 'aa', 'bbb', 'aaaa'), key=len, reverse=True))
# bisect; bisect_left/right insort保持顺序插入
import bisect
def grade(score, bps=[60, 70, 80, 90], grades='FDCBA'):
    i = bisect.bisect(bps, score)
    return grades[i]
print([grade(score) for score in [33, 99, 77, 70, 89, 90, 100]])

# 只包含数字的列表用array.array更高效，且array.tofile/fromfile速度比文本读取转换更快，pickle.dump和array.tofile差不多快
a = array.array('d', (__import__('random').random() for _ in range(4)))
a= array.array(a.typecode, sorted(a))
print(a)

# memoryview 让用户在不复制内存的情况下操作同一个数组的不同切片
n = array.array('h', [-2, -1, 0, 1, 2])
memv = memoryview(n)
memv_o = memv.cast('B')
print(memv_o.tolist())
memv_o[5] = 4 #00000000 00000000->00000100 00000000
print(n)

# 双端队列 collections.deque 线程安全
# queue提供同步（线程安全）类Queue, LifoQueue, PriorityQueue
# multiprocessing, asyncio, heapq 提供类似队列类
{% endhighlight %}
  
第三章
{% highlight python %}
'''
标准库的所有映射类型都是利用`dict`实现的, 只有可散列的数据类型才能作为这些映射的键.
如果一个对象是可散列的, 则这个对象的生命周期中它的散列值不变, 且它需要实现__hash__()方法和__eq__()方法
'''

# 字典
a = dict(one=1, two=2, three=3)
b = {'one':1, 'two':2, 'three':3}
c = dict(zip(['one', 'two', 'three'], [1, 2, 3]))
d = dict([('two', 2), ('one', 1), ('three', 3)])
print(a==b==c==d)
# 字典推导
dc = [(86, 'China'), (55, 'Brazil')]
a = {c: n for n, c in dc}
b = {n: c.upper() for c, n in a.items()}
print(a, b)

# setdefault
my_d = {}
my_d.setdefault('a', []).append(123)
if 'b' not in my_d:
    my_d['b'] = []
my_d['b'].append(456)
print(my_d)
# defaultdict更新字典里存放的可变值 update可以批量更新
from collections import defaultdict
my_d = defaultdict(list)
my_d['a'].append(111) #list在__getitem__里调用，my_d.get('c')会返回None
my_d['b'].append(222)
print(my_d)
# __missing__方法，在__getitem__找不到键时调用
# example 3-7 把非字符串的键转换成字符串
class StrKeyDict0(dict):
    def __missing__(self, key):
        if isinstance(key, str): # 防止递归调用
            raise KeyError(key)
        return self[str(key)]
    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default
    def __contains__(self, key):
        return key in self.keys() or str(key) in self.keys() # 防止递归调用
my_d = StrKeyDict0()
my_d['123'] = '456'
print(my_d[123])

'''
from collections import *。
OrderedDict在添加键时会保持顺序, ChainMap可以容纳数个不同的映射对象并当作整体查键, Counter给每个键一个计数器
UserDict就是把dict用纯python实现了一遍 
'''
ct = __import__('collections').Counter('abracadabra')
print(ct)
ct.update('abcdefg'); ct += {'q':1}
print(ct, ct.most_common(3))

import collections
class StrKeyDict(collections.UserDict):
    def __missing__(self, key):
        if isinstance(key, str):
            raise KeyError(key)
        return self[str(key)]
    def __contains__(self, key):
        return str(key) in self.data
    def __setitem__(self, key, item):
        self.data[str(key)] = item # self.data是dict，真正保存数据的地方
my_d = StrKeyDict()
my_d['1'] = 'aaa'
print(my_d[1])

# 获得字典的只读实例
from types import MappingProxyType
d = {1:'A'}
d_proxy = MappingProxyType(d)
print(d_proxy[1])

#集合
S1 = set(range(3))
S2 = set(range(6))
print(S1 | S2, S1 & S2, S2 - S1, S1 ^ S2) # 并交差对称差 其他：> < >= <= ......
print(len(S1 & S2), len(S1.intersection(S2))) # 省去不必要的循环和判断
print(type({1, 2, 3}))
print(frozenset(range(3))) # 不可变集合
# 集合推导
print({i for i in range(100, 1000) if (i%10)**3+(i//10%10)**3+(i//100)**3==i})

'''
一个可散列的对象必须: (1) __hash__()值不变 (2) 支持__eq__() (3) a == b 则 hash(a) == hash(b)
因为使用散列表实现所以dict内存开销巨大, 存放大量记录考虑元组和元组构成列表; 键查询很快; 
键的次序取决于添加顺序, 加新键可能会改变原顺序(解决冲突), 所以不要同时进行迭代和修改.
set与dict同理
'''
{% endhighlight %}
                                                                
第四章
{% highlight python %}
# 把码位转换成字节序列的过程是编码，把字节序列转换成码位的过程是解码
s = '鐢蹭箼涓欎竵'
print(s, len(s))
b = s.encode('gbk')
print(b, b.decode('utf-8'))
print((u'\uFFFD'.encode('utf-8')*2).decode('gbk'))

# bytes, bytearray各个元素为0-255之间整数
s = bytes('啊', encoding='utf-8')
print(s, s[0], s[:1], end=' ') # s[0] == s[:1] 只对str成立
sa = bytearray(s)
print(sa[-1:])
print(b'select'.hex(':'))
print(b''.fromhex('1111'))

# struct, memoryview, mmap 等处理二进制文件
fmt = '<3s3sHH'
header = memoryview(b'GIF89a+\x02\xe6\x00')
print(__import__('struct').unpack(fmt, header))
del header

# UnicodeEncodeError, UnicodeDecodeError 处理
c = b'S\xc3\xa3o Paulo'.decode('utf8')
print(c, c.encode('cp437', errors='xmlcharrefreplace'), c.encode('cp437', errors='replace'))
# 可通过codecs.register_error拓展

# BOM(byte-order mark) \xff\xfe指明编码使用intel cpu小字节序
print('啊'.encode('utf_16')) # U+FEFF ZERO WIDTH NO-BREAK SPACE
# 显式使用utf-16le, utf-16be不加bom

# 文本处理 bytes->str->bytes
# 在多台设备或多种场合下运行的代码，一定不能依赖默认编码，打开文件要始终明确encoding=

import sys, locale
# 打开文件 和 sys.stdout/in/err重定向到文件 时的默认编码 locale.getpreferredencodin()
# 编解码文件名 sys.getfilesystemencoding()
exprs = '''
locale.getpreferredencoding()
type(my_file)
my_file.encoding
sys.stdout.isatty()
sys.stdout.encoding
sys.stdin.isatty()
sys.stdin.encoding
sys.stderr.isatty()
sys.stderr.encoding
sys.getdefaultencoding()
sys.getfilesystemencoding()
'''
my_file = open('dummy', 'w')
for e in exprs.split():
    value  = eval(e)
    print(e.rjust(30), '->', repr(value))

# 规范化 大小写折叠
from unicodedata import normalize
s1 = 'café'
s2 = 'cafe\u0301'
print((s1, s2), (len(s1), len(s2)), s1 == s2)
print(normalize('NFC', s1) == normalize('NFC', s2))

def nfc_equal(s1, s2):
    return normalize('NFC', s1) == normalize('NFC', s2)
def fold_equal(s1, s2):
    return (normalize('NFC', s1).casefold() == normalize('NFC', s2).casefold())

# 排序 有专用库PyUCA
locale.setlocale(locale.LC_COLLATE, 'zh_CN.UTF-8')
q = ['不', '啊', '嗯', '和', '则']
print(sorted(q, key=locale.strxfrm))

# re和os模块中一些函数对于b''和''参数行为不同，双模式API
import os
print(os.listdir('.')[0], os.listdir(b'.')[0])
{% endhighlight %}

第五章
{% highlight python %}
'''
函数是一等对象. (1)在运行时创建 (2)能赋值给变量或数据结构中的元素 (3)能作为参数传给函数 (4)能作为函数的返回结果
'''

def foo():
    '''bar'''
    return '?'
a = foo
print(foo.__doc__, foo(), type(foo), a())

# 接受函数为参数，或者把函数作为结果返回的函数是`高阶函数`
# map, filter有生成器表达式代替; reduce在functools模块
print(all([1,0]), any([0,0,0,1]))
# 语法限制lambda函数定义体只能使用纯表达式

# 可调用对象: 用户定义函数, 内置函数, 内置方法, 方法, 类(运行__new__->__init__返回实例), 类的实例(定义了__call__方法), 生成器函数
# 可用callable()检测
import random
class BingoCage:
    def __init__(self, items):
        self._items = list(items)
        random.shuffle(self._items)
    def pick(self):
        try:
            return self._items.pop()
        except IndexError:
            raise LookupError('pick from empty BingoCage')
    def __call__(self):
        return self.pick()

bingo = BingoCage(range(10))
print(bingo(), bingo(), bingo())

def f() : f.test = '123'
f()
print(f.__dict__)

class C: pass
obj = C()
def func(): pass
print(sorted(set(dir(func)) - set(dir(C))))
'''
__annotations__ dict 参数和返回值注解
__call__ method-wrapper 实现(), 可调用对象协议
__closure__ tuple 函数闭包, 即自由变量的绑定, 通常是None
__code__ code 编译成字节码的函数元数据和定义体
__defaults__ tuple 形参默认值
__get__ method-wrapper 实现只读描述符协议
__globals__ dict 所在模块中的全局变量
__kwdefaults__ dict 仅限关键字形式参数的默认值
__name__, __qualname__ str 函数名/函数限定名称
'''

# keyword-only argument. 放在*后面, cls只能通过关键字指定
def tag(name:str, *content:'参数content', cls=None, **attrs) -> str:
    if cls is not None:
        attrs['class'] = cls
    if attrs:
        attr_str = ''.join(' %s="%s"' % (attr, value) 
                           for attr, value in sorted(attrs.items()))
    else:
        attr_str = ''
    if content:
        return '\n'.join('<%s%s>%s</%s>' % (name, attr_str, c, name) for c in content)
    else:
        return '<%s%s />' % (name, attr_str)
print(tag('br'), tag('p', 'hello', 'world', id=1, cls='p-test'))
my_tag = {'name':'img', 'title':'t', 'src':'/', 'cls':'im'} 
# dict中所有元素作为单个参数传入，同名键会绑定到对应的具名参数上，余下的被**attrs捕获
print(tag(**my_tag))

from inspect import signature
sig = signature(tag)
print(sig)
print(sig.return_annotation)
print(tag.__annotations__)

# operator
from functools import reduce, partial
from operator import mul, itemgetter, attrgetter, methodcaller
def fact(n):
    return reduce(mul, range(1, n + 1)) #避免写 lambda a, b: a*b
print(fact(5))
a = [(1, 2), (2, 1), (3, 4), (4,3)]
print(sorted(a, key=itemgetter(1))) #lambda x: x[1]
b = itemgetter(1, 0)
c = attrgetter('__dict__')
print(b('12'), c(f))

deal1 = methodcaller('replace', ' ', '-') # `冻结`参数
print(deal1('hello world'))

triple = partial(mul, 3)
print(triple(7), list(map(triple, range(1, 10))))

s1 = 'café'
s2 = 'cafe\u0301'
nfc = partial(__import__('unicodedata').normalize, 'NFC')
print((s1, s2), s1 == s2, nfc(s1) == nfc(s2))

picture = partial(tag, 'img', cls='pic-frame')
print(picture(src='1.jpg'), picture)
print(picture.func, picture.args, picture.keywords)

# functools.partialmethod用于处理方法
{% endhighlight %}

第六章
{% highlight python %}
# 策略模式
from abc import ABC, abstractmethod
from collections import namedtuple

Customer = namedtuple('Customer', 'name fidelity')
class Promotion(ABC): # 策略 抽象基类
    @abstractmethod
    def discount(self, order):
        """返回折扣额"""

class FidelityPromo(Promotion): # 策略一
    def discount(self, order):
        return order.total() * .05 if order.customer.fidelity >= 1000 else 0

class BulkItemPromo(Promotion): # 策略二
    def discount(self, order):
        discount = 0
        for item in order.cart:
            if item.quanlity >= 20:
                discount += item.total() * .1
        return discount

class LargeOrderPromo(Promotion): # 策略三
    def discount(self, order):
        distinct_items = {item.product for item in order.cart}
        if len(distinct_items) >= 10:
            return order.total() * .07
        return 0

class LineItem:
    def __init__(self, product, quanlity, price):
        self.product = product
        self.quanlity = quanlity
        self.price = price
    def total(self):
        return self.price * self.quanlity

class Order: # 上下文
    def __init__(self, customer, cart, promotion: Promotion=None):
        self.customer = customer
        self.cart = list(cart)
        self.promotion = promotion
    def total(self):
        if not hasattr(self, '__total'):
            self.__total = sum(item.total() for item in self.cart)
            return self.__total
    def due(self):
        if self.promotion is None:
            discount = 0
        else:
            discount = self.promotion.discount(self)
        return self.total() - discount
    def __repr__(self):
        fmt = '<Order total: {:.2f} due: {:.2f}>'
        return fmt.format(self.total(), self.due())

ann = Customer('Ann', 1100)
cart = [LineItem('banana', 40, .5), LineItem('apple', 20, 1.5), LineItem('watermellon', 5, 5.0)]
cart2 = [LineItem(str(i), 1, 1.0) for i in range(20)]
print(Order(ann, cart, FidelityPromo()))
print(Order(ann, cart, BulkItemPromo()))
print(Order(ann, cart2, FidelityPromo()))
print(Order(ann, cart2, BulkItemPromo()))
print(Order(ann, cart2, LargeOrderPromo()))

# 使用函数实现策略模式
class Order: # 上下文
    def __init__(self, customer, cart, promotion=None):
        self.customer = customer
        self.cart = list(cart)
        self.promotion = promotion
    def total(self):
        if not hasattr(self, '__total'):
            self.__total = sum(item.total() for item in self.cart)
            return self.__total
    def due(self):
        if self.promotion is None:
            discount = 0
        else:
            discount = self.promotion(self) #
        return self.total() - discount
    def __repr__(self):
        fmt = '<Order total: {:.2f} due: {:.2f}>'
        return fmt.format(self.total(), self.due())

# 策略一般没有内部状态
def fidelity_promo(order):
    return order.total() * .05 if order.customer.fidelity >= 1000 else 0

def bulk_item_promo(order): # 策略二
    discount = 0
    for item in order.cart:
        if item.quanlity >= 20:
            discount += item.total() * .1
    return discount

def large_order_promo(order): # 策略三
    distinct_items = {item.product for item in order.cart}
    if len(distinct_items) >= 10:
        return order.total() * .07
    return 0

print('')
print(Order(ann, cart, fidelity_promo))
print(Order(ann, cart, bulk_item_promo))
print(Order(ann, cart2, fidelity_promo))
print(Order(ann, cart2, bulk_item_promo))
print(Order(ann, cart2, large_order_promo))

# 最佳策略 添加新策略时注意加入promos
promos = [fidelity_promo, bulk_item_promo, large_order_promo]
def best_promo(order):
    return max(promo(order) for promo in promos)
print(Order(ann, cart2, best_promo))

# 自动加入promos
promos = [globals()[name] for name in globals() if name.endswith('_promo') and name != 'best_promo']
'''
用promotions模块单独保存所有策略函数
 promos = [func for name, func in inspect.getmembers(promotions, inspect.isfunction)]
'''

#使用函数或可调用对象实现回调更自然
class MacroCommand: #命令模式
    def __init__(self, commands):
        self.commands = list(commands)
    def __call__(self):
        for command in self.commands:
            command()
{% endhighlight %}
  
第七章
{% highlight python %}
"""装饰器和闭包
# 装饰器是可调用的对象, 其参数是另一个函数(被装饰的函数). 装饰器可能会处理被装饰的函数, 然后把它返回, 或者
# 将其替换成另一个函数或可调用对象.
# 装饰器在被装饰函数定义之后立即运行, 通常是在导入(加载模块)时; 被装饰函数只在明确调用时运行
"""

from hashlib import new


def deco(func):
    def inner():
        print('running inner()')
    return inner
@deco
def target():
    print('running target()')
# @deco 等价于 target = deco(target)
target()

# 改进策略模式
promos = []
def promotion(promo_func):
    promos.append(promo_func)
    return promo_func

@promotion
def fidelity_promo(order):
    return order.total() * .05 if order.customer.fidelity >= 1000 else 0

@promotion
def bulk_item_promo(order): # 策略二
    discount = 0
    for item in order.cart:
        if item.quanlity >= 20:
            discount += item.total() * .1
    return discount

@promotion
def large_order_promo(order): # 策略三
    distinct_items = {item.product for item in order.cart}
    if len(distinct_items) >= 10:
        return order.total() * .07
    return 0

def best_promo(order):
    return max(promo(order) for promo in promos)

# 变量作用域规则
b = 6
def f1(a):
    print(a)
    print(b)
def f2(a):
    try:
        print(a)
        print(b)
        b = 9    # python假定在函数定义体中赋值的变量是局部变量
    except UnboundLocalError as e:
        print(e)
def f3(a):
    global b # 要求把b当成全局变量
    print(a)
    print(b)
    b = 9
_ = [f1(1), f2(2), f3(3)]

# 闭包指延伸了作用域的函数，其中包含函数定义体中引用、但不在定义体中定义的非全局变量
def make_avg1():
    series = []
    def avg(new_value):
        series.append(new_value) # 自由变量
        return sum(series)/len(series)
    return avg
avg = make_avg1()
print(avg(10), avg(11), avg(12))
print(avg.__code__.co_freevars)
print(avg.__closure__[0].cell_contents)
# 闭包会保留定义函数时存在的自由变量的绑定

# nonlocal声明
def make_avg():
    count = 0
    total = 0
    def avg(new_value):
        nonlocal count, total # 标记为自由变量
        count += 1            # 因为不可变类型重新绑定会隐式创建局部变量
        total += new_value
        return total/count
    return avg
avg = make_avg()
print(avg(10), avg(11), avg(12))
print(avg.__code__.co_freevars)
print(avg.__closure__[0].cell_contents, avg.__closure__[1].cell_contents)

# 输出函数运行时间的装饰器
import time
import functools
def clock(func):
    @functools.wraps(func) # 将__name__, __doc__等复制到clocked
    def clocked(*args, **kwargs):
        t0 = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - t0
        name = func.__name__
        arg_lst = []
        if args:
            arg_lst.append(', '.join(repr(arg) for arg in args))
        if kwargs:
            pairs = ['%s=%r' % (k, w) for k, w in sorted(kwargs.items())]
            arg_lst.append(', '.join(pairs))
        arg_str = ', '.join(arg_lst)
        print(f'[{elapsed:0.8f}s] {name}({arg_str}) -> {result}')
        return result
    return clocked
@clock
def snooze(seconds):
    time.sleep(seconds)
@clock
def fact(n):
    return 1 if n < 2 else n*fact(n-1)
snooze(.123)
fact(n=5)

# 标准库中的装饰器.
# 使用functools.lru_cache做备忘(memoization)
@functools.lru_cache(maxsize=16, typed=False) # 保存16个调用结果, 是否按参数类型分开保存结果
@clock
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-2) + fibonacci(n-1)
print(fibonacci(30))
# lru_cache使用字典存储结果，被装饰函数所有参数需可散列

# 单分派泛函数
# @singledispatch装饰的函数变成泛函数(generic function): 根据第一个参数的类型以不同的方式执行相同操作的一组函数
# https://www.python.org/dev/peps/pep-0443/
from functools import singledispatch
from collections import abc
import numbers
import html

@singledispatch
def htmlize(obj):
    content = html.escape(repr(obj))
    return f'<pre>{content}</pre>'

@htmlize.register(str)
def _(text):
    content = html.escape(text).replace('\n', '<br>\n')
    return f'<p>{content}</p>'

@htmlize.register(tuple)
@htmlize.register(abc.MutableSequence)
def _(seq):
    inner = '</li>\n<li>'.join(htmlize(item) for item in seq)
    return '<ul>\n<li>' + inner + '</li>\n</ul>'

@htmlize.register(numbers.Integral) # int 的虚拟超类
def _(n):
    return f'<pre>{n} (0x{n:x})</pre>'

print(htmlize({1,2,3}))
print(htmlize(abs))
print(htmlize('Hello \n world.'))
print(htmlize(42))
print(htmlize(['test', 123, {3,2,1}]))

# 装饰器最好通过实现__call__方法的类实现

# 参数化的注册装饰器
registry = set()
def register(active=True): # 装饰器工厂函数
    def decorate(func):
        print('running register(active=%s)->decorate(%s)' % (active, func))
        if active:
            registry.add(func)
        else:
            registry.discard(func)
        return func
    return decorate

@register(active=False)
def f1(): print('running f1()')
@register()
def f2(): print('running f2()')
def f3(): print('running f3()')
print(registry)
register(active=False)(f2)
print(registry)

# 参数化clock装饰器
import time
DEFAULT_FMT = '[{elapsed:0.8f}s] {name}({args}) -> {result}'
def clock(fmt=DEFAULT_FMT):
    def decorate(func):
        def clocked(*_args):
            t0 = time.time()
            _result = func(*_args)
            elapsed = time.time() - t0
            name = func.__name__
            args = ', '.join(repr(arg) for arg in _args)
            result = repr(_result)
            print(fmt.format(**locals()))
            return _result
        return clocked
    return decorate

@clock('{name}: {elapsed}s')
def snooze(s): time.sleep(s)
for i in range(3): snooze(.123)
{% endhighlight %}
  
第八章
{% highlight python %}
a = {'a':1}
b = {'a':1}
c = a # 别名
print((a == b, a is b, a is c))
# == 比较两个对象的值(__eq__) is 比较对象的标识
# 在变量和单例值之间比较时应使用is，is不能重载，比==速度快

# 元组的不可变性指tuple数据结构的物理内容(保存的引用)不可变，与引用的对象无关
t = (1, [1,2]); t[1].append(3); print(t)

# 复制列表 list [:] 浅复制：复制了最外层的容器，副本中的元素是源容器中元素的引用
l1 = [3, [1, 2], (4, 5)]
l2 = list(l1)
l3 = l1[:]
print(l1 == l2, l1 is l2, l3)

# copy, deepcopy
class Bus:
    def __init__(self, passengers=None):
        if passengers is None:
            self.passengers = []
        else:
            self.passengers = list(passengers) # 复制, 否则为别名
    def pick(self, name):
        self.passengers.append(name)
    def drop(self, name):
        self.passengers.remove(name)
import copy
bus1 = Bus(['Alice', 'Bill', 'Claire', 'David'])
bus2 = copy.copy(bus1)
bus3 = copy.deepcopy(bus1)
bus1.drop('Bill')
print(bus2.passengers, (id(bus1.passengers), id(bus2.passengers), id(bus3.passengers)))
print(bus3.passengers)

# 循环引用
a = [10, 20]
b = [a, 30]
a.append(b)
print(a)
c = copy.deepcopy(a) # deepcopy会记住已经复制的对象
print(c)

'''
python唯一支持的参数传递模式是`共享传参`(call by sharing) java的引用类型也是这样
函数的各个形式参数获得实参中各个引用的副本, 即函数内部形参是实参的别名.
'''

# 不要使用可变类型作为参数的默认值
class HauntedBus:
    def __init__(self, passengers = []):
        self.passengers = passengers # self.passengers 变成了 passengers 的别名
    def pick(self, name):
        self.passengers.append(name)
    def drop(self, name):
        self.passengers.remove(name)
bus1 = HauntedBus()
bus1.pick('Alice')
bus3 = HauntedBus()
print(bus3.passengers)
print(HauntedBus.__init__.__defaults__[0] is bus3.passengers)
# 通常使用None作为接受可变值的参数的默认值.
# 慎重考虑函数是否要修改传入的可变参数

# del和垃圾回收
'''
del语句删除名称, 可能会导致对象被当作垃圾回收, 但仅当删除的变量保存的是对象的最后一个引用, 或者无法得到对象时.
重新绑定也可能会导致对象的引用计数归零, 导致对象被销毁.
在cpython中垃圾回收使用的主要算法是引用计数, 每个对象都会统计有多少引用指向自己, 当引用计数归零时对象就立即被销毁.
cpython会在对象上调用__del__方法(如果定义了), 然后释放分配给对象的内存.
'''

import weakref
s1 = {1, 2, 3}
s2 = s1
def bye():
    print('Gone with the wind...')
ender = weakref.finalize(s1, bye)
print(ender.alive)
del s1
print(ender.alive)
s2 = 'spam'
print(ender.alive)

# 弱引用不会增加对象的引用数量，引用的目标对象称为所指对象(referent)
# WeakValueDictionary类实现一种可变映射, 里面的值是对象的弱引用, 被引用对象在其他地方被回收后对应的键会自动在WeakValueDictionary中删除
# 常用于缓存
class Cheese:
    def __init__(self, kind):
        self.kind = kind
    def __repr__(self) -> str:
        return 'Cheese(%r)' % self.kind

stock = weakref.WeakValueDictionary()
catalog = [Cheese('Red Leicester'), Cheese('Tilsit'), Cheese('Brie'), Cheese('Parmesan')]
for cheese in catalog:
    stock[cheese.kind] = cheese
print(sorted(stock.keys()))
del catalog
print(sorted(stock.keys())) # for循环里的cheese是全局变量
del cheese
print(sorted(stock.keys()))

# CPython的限制. 基本的list和dict实例不能作为所指对象, 但它们的子类可以

t1 = (1, 2, 3)
t2 = tuple(t1) # 如果参数是一个元组，则返回值是同一个对象. str, bytes, frozenset实例也有这种行为
print(t1 is t2)

# 驻留. 小整数, 字符串字面量
s1 = 'ABC'
s2 = 'ABC'
print(s1 is s2)
{% endhighlight %}

第九章
{% highlight python %}
from array import array
import math

class Vector2d:
    # __slots__ = ('__x', '__y') 表示只有两个属性，避免使用__dict__从而节省空间
    typecode = 'd'
    # 类属性可以为实例属性提供默认值

    def __init__(self, x, y):
        self.__x = float(x)
        self.__y = float(y)
    
    @property #@property装饰器把读值方法标记为特性，方法名与公开属性同名
    def x(self): return self.__x
    @property
    def y(self): return self.__y

    def __iter__(self): # 可迭代对象才能拆包
        return (i for i in (self.x, self.y))

    def __repr__(self):
        class_name = type(self).__name__
        return '{}({!r}, {!r})'.format(class_name, *self)

    def __str__(self):
        return str(tuple(self))

    def __bytes__(self):
        return (bytes([ord(self.typecode)])) + bytes(array(self.typecode, self))

    def __eq__(self, other):
        return tuple(self) == tuple(other)

    def __abs__(self):
        return math.hypot(self.x, self.y)

    def __bool__(self):
        return bool(abs(self))

    @classmethod # 定义类方法，第一个参数是类本身
    def frombytes(cls, octets):
        typecode = chr(octets[0])
        memv = memoryview(octets[1:]).cast(typecode)
        return cls(*memv)

    def __format__(self, fmt_spec=''): # Format Specification Mini-Language
        if fmt_spec.endswith('p'):
            fmt_spec = fmt_spec[:-1]
            coords = (abs(self), self.angel())
            outer_fmt = '<{}, {}>'
        else:
            coords = self
            outer_fmt = '({}, {})'
        components = (format(c, fmt_spec) for c in coords)
        return outer_fmt.format(*components)

    def angel(self):
        return math.atan2(self.y, self.x)

    def __hash__(self):
        return hash(self.x) ^ hash(self.y) # 实例的散列值不应该变化

class Demo:
    @classmethod
    def a(*args): return args
    @staticmethod # 静态方法就是普通的函数
    def b(*args): return args
print(Demo.a(), Demo.b())

v1 = Vector2d(3, 4)
print(v1 == eval(repr(v1)) == Vector2d.frombytes(bytes(v1)))
print(format(v1, '.5fp'))
print(v1.__dict__) # 名称改写 (name mangling)
v1._Vector2d__x = 6
print(v1)

'''
定义__slots__之后实例不能再有__slots__中没列出来的属性, 除非把__dict__加入__slots__.
每个子类都要定义__slots__, 因为解释器会忽略继承的__slots__
需要弱引用要把__weakref__加入__slots
'''

v1 = Vector2d(1.1, 2.2)
v1.typecode = 'f' # 定义实例属性, 类属性不变
print(bytes(v1))
# 修改类属性 Vector2d.typecode = 'f'

# 一般创建子类来定制类属性
class ShortVector2d(Vector2d):
    typecode = 'f'

v2 = ShortVector2d(1.1, 2.2)
print(bytes(v2))
{% endhighlight %}
  
第10章
{% highlight python %}
from array import array
import reprlib
import math
import numbers
import functools
import operator
import itertools

# 切片原理
class MySeq:
    def __getitem__(self, index):
        return index
s = MySeq()
print(s[1], s[1:4], s[1:4:2, 9], s[1:4:2, 7:9])
print(slice(None, 10, 2).indices(5)) # S.indices(len) -> (start, stop, stride)

class Vector:
    typecode = 'd'
    shortcut_names = 'xyzt'

    def __init__(self, components):
        self._components = array(self.typecode, components)
    
    def __iter__(self):
        return iter(self._components)

    def __repr__(self):
        components = reprlib.repr(self._components) # 限制长度
        components = components[components.find('['):-1]
        return 'Vector({})'.format(components)

    def __str__(self):
        return str(tuple(self))

    def __bytes__(self):
        return (bytes([ord(self.typecode)]) + bytes(self._components))

    def __eq__(self, other):
        return tuple(self) == tuple(other)

    def __abs__(self):
        return math.sqrt(sum(x*x for x in self))

    def __bool__(self):
        return bool(abs(self))

    @classmethod
    def frombytes(cls, octects):
        typecode = chr(octects[0])
        memv = memoryview(octects[1:]).cast(typecode)
        return cls(memv)

    def __len__(self):
        return len(self._components)

    def __getitem__(self, index):
        cls = type(self)
        if isinstance(index, slice):
            return cls(self._components[index])
        elif isinstance(index, numbers.Integral):
            return self._components[index]
        else:
            raise TypeError(f'{cls.__name__} indices must be integers')

    def __getattr__(self, name):
        cls = type(self)
        if len(name) == 1:
            pos = cls.shortcut_names.find(name)
            if 0 <= pos < len(self._components):
                return self._components[pos]
            raise AttributeError(f'{cls.__name__!r} object has no attribute {name!r}')
            
    def __setattr__(self, name, value):
        cls = type(self)
        if len(name) == 1:
            if name in cls.shortcut_names:
                msg = f'readonly attribute {name!r}'
            elif name.islower():
                msg = f"can't set attribute 'a' to 'z' in {name!r}"
            else: msg = ''
            if msg: raise AttributeError(msg)
        super().__setattr__(name, value)

    # __setitem__ 支持v[0]=1
    def __eq__(self, other):
        return len(self) == len(other) and all(a == b for a, b in zip(self, other))

    def __hash__(self):
        hashes = (hash(x) for x in self._components)
        return functools.reduce(operator.xor, hashes, 0) # 序列为空返回0否则以0为归约中第一个参数

    def angle(self, n):
        r = math.sqrt(sum(x*x for x in self[n:]))
        a = math.atan2(r, self[n-1])
        if (n == len(self) - 1) and (self[-1] < 0):
            return math.pi*2 - a
        else: return a

    def angles(self):
        return (self.angle(n) for n in range(1, len(self)))

    def __format__(self, fmt_spec=''):
        if fmt_spec.endswith('h'):
            fmt_spec = fmt_spec[:-1]
            coords = itertools.chain([abs(self)], self.angles())
            outer_fmt = '<{}>'
        else:
            coords = self
            outer_fmt = '({})'
        components = (format(c, fmt_spec) for c in coords)
        return outer_fmt.format(', '.join(components))


v1 = Vector(range(7))
print(v1[-1], v1[1:4], type(v1[1:4]))
print(v1.x, v1.y)
print(f'{v1:h}')
{% endhighlight %}
                                                   
第11章
{% highlight python %}
import collections
from collections import abc
import numbers
import random

def test(a, b):
    return range(0, 30, 10)[b]

class Foo:
    def __getitem__(self, pos):
        return range(5)[pos]
Foo.__getitem__ = test # 猴子补丁. 不改变源代码而对功能进行追加和变更

f = Foo()
print(f[1], list(i for i in f), 20 in f)
# 没有__iter__, __contains__, python会调用__getitem__设法让in和迭代可用

class A:
    def __len__(self): return 233
print(isinstance(A(), abc.Sized)) # Sized的__subclasshook__在A.__dict__检查到了‘__len__’

Card = collections.namedtuple('Card', ['rank', 'suit'])
class FrenchDeck2(abc.MutableSequence):
    ranks = [str(n) for n in range(2, 11)] + list('JQKA')
    suits = 'spades diamonds clubs hearts'.split()

    def __init__(self):
        self._cards = [Card(rank, suit) for suit in self.suits for rank in self.ranks]

    def __len__(self):
        return len(self._cards)

    def __getitem__(self, pos):
        return self._cards[pos]

    def __setitem__(self, pos, val): # 之后可以使用random.shuffle
        self._cards[pos] = val

    def __delitem__(self, pos):
        del self._cards[pos]

    def insert(self, pos, val):
        self._cards.insert(pos, val)

# collections.abc 16个抽象基类; numbers：Number, Complex, Real, Rational, Integral
print(isinstance(1.234, numbers.Real))

import abc
class Tombola(abc.ABC):
    @abc.abstractmethod
    def load(self, iterable):
        '''从可迭代对象中添加元素'''

    @abc.abstractmethod
    def pick(self):
        '''随机删除元素并将其返回'''

    def loaded(self):
        return bool(self.inspect())

    def inspect(self):
        items = []
        while True:
            try:
                items.append(self.pick())
            except LookupError:
                break
        self.load(items)
        return tuple(sorted(items))

# 抽象方法可以有实现代码，子类必须覆盖抽象方法，但子类中可以用super()来调用抽象方法
# 在@abstractmethodhedef语句之间不能有其他装饰器

class BingoCage(Tombola):
    def __init__(self, items):
        self._randomizer = random.SystemRandom()
        self._items = []
        self.load(items)

    def load(self, items):
        self._items.extend(items)
        self._randomizer.shuffle(self._items)

    def pick(self):
        try:
            return self._items.pop()
        except IndexError:
            raise LookupError('pick from empty BingoCage')

    def __call__(self):
        self.pick()

class LotteryBlower(Tombola):
    def __init__(self, iterable):
        self._balls = list(iterable)

    def load(self, iterable):
        self._balls.extend(iterable)

    def pick(self):
        try:
            pos = random.randrange(len(self._balls))
        except ValueError:
            raise LookupError('pick from empty LotteryBlower')
        return self._balls.pop(pos)

    def loaded(self):
        return bool(self._balls)

    def inspect(self):
        return tuple(sorted(self._balls))

@Tombola.register #注册虚拟子类. 不会有检查. 相当于 Tombola.register(TomboList) 宣称实现了该有的接口
class TomboList(list):
    def pick(self):
        if self:
            pos = random.randrange(len(self))
            return self.pop(pos)
        else:
            raise LookupError('pop from empty TomboList')
    
    load = list.extend

    def loaded(self):
        return bool(self)
    
    def inspect(self):
        return tuple(sorted(self))

print(issubclass(TomboList, Tombola))
print(TomboList.__mro__)
print(Tombola.__subclasses__(), Tombola._dump_registry())
{% endhighlight %}
                                                   
第12章
{% highlight python %}
class ADict(dict):
    def __getitem__(self, key):
        return 42

a = ADict(q=1)
print(a['q'])
d = {}
d.update(a) # 内置类型的方法通常会忽略用户覆盖的方法.
print(d)

import collections
class BDict(collections.UserDict):
    def __getitem__(self, key):
        return 42

a = BDict(q=1)
print(a['q'])
d = {}
d.update(a)
print(d)

# 多重继承
class A:
    def ping(self): print('pingA', self)

class B(A):
    def pong(self): print('pongB', self)

class C(A):
    def pong(self): print('pongC', self)

class D(B, C):
    def ping(self):
        super().ping()
        print('pingD:', self)

    def pingpong(self):
        self.ping()
        super().ping() # A.ping(self)
        self.pong()
        super().pong()
        C.pong(self)

d = D()
d.pong()
C.pong(d)

# 方法解析顺序 Method Resolution Order MRO
print(D.__mro__)
d.ping()
d.pingpong()
{% endhighlight %}
                                                   
第13章
{% highlight python %}
from array import array
from ast import Add, NotIn
import reprlib
import math
import numbers
import functools
import operator
import itertools

class Vector:
    typecode = 'd'
    shortcut_names = 'xyzt'

    def __init__(self, components):
        self._components = array(self.typecode, components)
    
    def __iter__(self):
        return iter(self._components)

    def __repr__(self):
        components = reprlib.repr(self._components)
        components = components[components.find('['):-1]
        return 'Vector({})'.format(components)

    def __str__(self):
        return str(tuple(self))

    def __bytes__(self):
        return (bytes([ord(self.typecode)]) + bytes(self._components))

    def __eq__(self, other):
        return tuple(self) == tuple(other)

    # 一元运算符和中缀运算符结果应该是新对象, 并且绝不能修改操作数

    def __abs__(self):
        return math.sqrt(sum(x*x for x in self))

    def __neg__(self):
        return Vector(-x for x in self)

    def __pos__(self):
        return Vector(self)

    def __add__(self, other):
        try: # 鸭子类型
            pairs = itertools.zip_longest(self, other, fillvalue=0.0)
            return Vector(a + b for a, b in pairs)
        except TypeError:
            return NotImplemented # 让编译器尝试对调操作数

    def __radd__(self, other):
        return self + other

    def __mul__(self, scalar):
        if isinstance(scalar, numbers.Real): #显式测试
            return Vector(n * scalar for n in self)
        else:
            return NotImplemented
    
    def __rmul__(self, scalar):
        return self * scalar

    def __matmul__(self, other):
        try:
            return sum(a * b for a, b in zip(self, other))
        except TypeError:
            return NotImplemented
    
    def __rmatmul__(self, other):
        return self @ other

    def __bool__(self):
        return bool(abs(self))

    @classmethod
    def frombytes(cls, octects):
        typecode = chr(octects[0])
        memv = memoryview(octects[1:]).cast(typecode)
        return cls(memv)

    def __len__(self):
        return len(self._components)

    def __getitem__(self, index):
        cls = type(self)
        if isinstance(index, slice):
            return cls(self._components[index])
        elif isinstance(index, numbers.Integral):
            return self._components[index]
        else:
            raise TypeError(f'{cls.__name__} indices must be integers')

    def __getattr__(self, name):
        cls = type(self)
        if len(name) == 1:
            pos = cls.shortcut_names.find(name)
            if 0 <= pos < len(self._components):
                return self._components[pos]
            raise AttributeError(f'{cls.__name__!r} object has no attribute {name!r}')
            
    def __setattr__(self, name, value):
        cls = type(self)
        if len(name) == 1:
            if name in cls.shortcut_names:
                msg = f'readonly attribute {name!r}'
            elif name.islower():
                msg = f"can't set attribute 'a' to 'z' in {name!r}"
            else: msg = ''
            if msg: raise AttributeError(msg)
        super().__setattr__(name, value)

    def __eq__(self, other):
        if isinstance(other, Vector):
            return len(self) == len(other) and all(a == b for a, b in zip(self, other))
        else:
            return NotImplemented

    def __hash__(self):
        hashes = (hash(x) for x in self._components)
        return functools.reduce(operator.xor, hashes, 0)

    def angle(self, n):
        r = math.sqrt(sum(x*x for x in self[n:]))
        a = math.atan2(r, self[n-1])
        if (n == len(self) - 1) and (self[-1] < 0):
            return math.pi*2 - a
        else: return a

    def angles(self):
        return (self.angle(n) for n in range(1, len(self)))

    def __format__(self, fmt_spec=''):
        if fmt_spec.endswith('h'):
            fmt_spec = fmt_spec[:-1]
            coords = itertools.chain([abs(self)], self.angles())
            outer_fmt = '<{}>'
        else:
            coords = self
            outer_fmt = '({})'
        components = (format(c, fmt_spec) for c in coords)
        return outer_fmt.format(', '.join(components))

from c11 import Tombola, BingoCage
class AddableBingoCage(BingoCage):
    def __add__(self, other):
        if isinstance(other, Tombola):
            return AddableBingoCage(self.inspect() + other.inspect())
        else:
            return NotImplemented
    
    def __iadd__(self, other):
        if isinstance(other, Tombola):
            other_iterable = other.inspect()
        else:
            try:
                other_iterable = iter(other)
            except TypeError:
                self_cls = type(self).__name__
                raise TypeError(f'right operand in += must be {self_cls:r} or an iterable')
        self.load(other_iterable)
        return self # 增量赋值特殊方法必须返回self

globe = AddableBingoCage('aeiou')
globe += AddableBingoCage('1234')
print(globe.inspect())

# list.extend +=
# 对序列类型+一般要求左右类型相同, += 右操作数往往可以是任何可迭代对象
{% endhighlight %}    
  
第14章
{% highlight python %}
import re
import reprlib

class Foo:
    def __iter__(self):
        pass
from collections import abc
print(issubclass(Foo, abc.Iterable))

# 可迭代：有__iter__或者有__getitem__从0开始. 迭代器还要有__next__
'''
迭代器: 实现了无参数的__next__方法, 返回序列中的下一个元素; 没有元素了则抛出StopIteration异常.
Python中的迭代器还实现了__iter__方法, 因此迭代器也可以迭代
'''

RE_WORD = re.compile('\w+')

class Sentence1:
    def __init__(self, text):
        self. text = text
        self.words = RE_WORD.findall(text)

    def __getitem__(self, index):
        return self.words[index]

    def __len__(self):
        return len(self.words)

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'
        
#迭代器模式. 迭代器可以迭代(__iter__返回自己)，但可迭代对象不是迭代器(不能实现__next__)
class Sentence2:
    def __init__(self, text):
        self. text = text
        self.words = RE_WORD.findall(text)

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        return SentenceIterator(self.words)

class SentenceIterator:
    def __init__(self, words):
        self.words = words
        self.index = 0

    def __next__(self):
        try:
            word = self.words[self.index]
        except IndexError:
            raise StopIteration()
        self.index += 1
        return word

    def __iter__(self):
        return self

# 符合python习惯 生成器函数
class Sentence3:
    def __init__(self, text):
        self. text = text
        self.words = RE_WORD.findall(text)

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        for word in self.words:
            yield word
        # 或者 return iter(self.words)

# 只要函数定义中有yield关键字，该函数就是生成器函数, 调用生成器函数会返回一个生成器对象
def gen_123():
    print('One')
    yield 1
    yield 2
    yield 3
    print('Three')
for i in gen_123(): print(i)
g = gen_123()
print(next(g), '---')
print([i for i in gen_123()])
g = (x for x in gen_123())
for i in g: print(i)

# 惰性实现
class Sentence4:
    def __init__(self, text):
        self.text = text

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        for match in RE_WORD.finditer(self.text):
            yield match.group()
      # 生成器表达式.
      # return (match.group() for match in RE_WORD.finditer(self.text))     

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 等差数列
class ArithmeticProgression:
    def __init__(self, begin, step, end=None):
        self.begin = begin
        self.step = step
        self.end = end

    def __iter__(self):
        result = type(self.begin + self.step)(self.begin)
        forever = self.end is None
        index = 0
        while forever or result < self.end:
            yield result
            index += 1
            result = self.begin + self.step * index # 降低浮点数累积效应风险

# 简化
def artiprog_gen(begin, step, end=None):
    result = type(begin + step)(begin)
    forever = end is None
    index = 0
    while forever or result < end:
        yield result
        index += 1
        result = begin + step * index

# 利用标准库再简化. 也是生成器工厂函数
from itertools import count, takewhile
def artiprog_gen2(begin, step, end=None):
    first = type(begin + step)(begin)
    ap_gen = count(first, step)
    if end is not None:
        ap_gen = takewhile(lambda n: n < end, ap_gen)
    return ap_gen

def my_chain(*iterables):
    for i in iterables:
        yield from i
print(list(my_chain('ABC', '123')))

# filter, enumerate, map, zip, reversed(序列), all, any, max, min, sum
# itertools: compress, dropwhile, filterfalse, islice, takewhile, accumulate, starmap, chain, chain.from_iterable
#            zip_longest, count, cycle, repeat, 
#            组合学生成器 product, permutations, combinations, combinations_with_replacement
#            groupby, tee
# functools: reduce

'''
iter(func, sentinel)
逐行读取直到文件末尾或遇到空行. '\n'称哨符
with open('mydata.txt') as fp:
    for line in iter(fp.readline, '\n'):
        process_line
'''
{% endhighlight %}
                                             
第15章
{% highlight python %}
'''
else
for/else 仅当for循环运行完毕(没有被break中止)才运行else块
while/else 仅当while循环因为条件为假退出时才运行else块
try/else 仅当try块没有异常抛出时才运行else块

with语句开始运行时会在上下文管理器对象上调用__enter__, 结束后调用__exit__
'''

class LookingGlass:
    def __enter__(self):
        import sys
        self.original_write = sys.stdout.write
        sys.stdout.write = self.reverse_write
        return 'JABBERWOCKY'

    def reverse_write(self, text):
        self.original_write(text[::-1])

    def __exit__(self, exc_type, exc_value, traceback):
        import sys
        sys.stdout.write = self.original_write
        if exc_type is ZeroDivisionError:
            print('Please DO NOT divide by zero!')
        return True # 告诉解释器已经处理异常

with LookingGlass() as what:
    print(what)
    print('Alice - MajoKoiNiki')
print('Normal.')

import contextlib
@contextlib.contextmanager # 把函数包装成实现了__enter__, __exit__的类
def looking_glass():
    import sys
    original_write = sys.stdout.write

    def reverse_write(text):
        original_write(text[::-1])

    sys.stdout.write = reverse_write
    msg = ''
    try: # 我们无法知道用户会在with块中做什么
        yield 'JABBERWOCKY'
    except ZeroDivisionError:
        msg = 'Please DO NOT divide by zero!'
    finally:
        sys.stdout.write = original_write
        if msg: print(msg)

with looking_glass() as what:
    # print(1/0)
    print(what)
    print('Alice - MajoKoiNiki')
print('Normal.')
{% endhighlight %}

第16章
{% highlight python %}
def simple_coroutine():
    print('-> coroutine started')
    x = yield
    print('-> coroutine received:', x)

my_coro = simple_coroutine()
next(my_coro) # 预激协程. 向前执行到第一个yield表达式
try:
    my_coro.send(42)
except StopIteration:
    pass

from inspect import getgeneratorstate
from typing import NamedTuple
from unicodedata import name
def simple_coroutine2(a):
    print('-> Started: a =', a)
    b = yield a
    print('-> Received: b =', b)
    c = yield a + b
    print('-> Received: c =', c)

my_coro = simple_coroutine2(1)
print(getgeneratorstate(my_coro))
next(my_coro)
print(getgeneratorstate(my_coro))
print(my_coro.send(2))
print(getgeneratorstate(my_coro))
try:
    print(my_coro.send(4))
except StopIteration:
    pass
print(getgeneratorstate(my_coro))

# 预激协程的装饰器
from functools import wraps
def coroutine(func):
    @wraps(func)
    def primer(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)
        return gen
    return primer

@coroutine
def averager():
    total = 0.0
    count = 0
    average = None
    while True:
        term = yield average
        total += term
        count += 1
        average = total/count

coro_avg = averager()
print(coro_avg.send(10))
print(coro_avg.send(30))
print(coro_avg.send(5))
coro_avg.close()

class DemoException(Exception):
    """demo"""

def demo_exc_handling():
    print('-> coroutine started')
    try:
        while True:
            try:
                x = yield
            except DemoException:
                print('*** DemoException handled. Continuing...')
            else:
                print(f'-> coroutine received: {x!r}')
    finally:
        print('-> coroutine ending')
    raise RuntimeError('This line should never run.') 

exc_coro = demo_exc_handling()
next(exc_coro)
exc_coro.send(123)
exc_coro.throw(DemoException)
exc_coro.send(456)
# exc_coro.throw(ZeroDivisionError) 会停止

from collections import namedtuple
Result = namedtuple('Result', 'count average')

@coroutine
def averager():
    total = 0.0
    count = 0
    average = None
    while True:
        term = yield
        if term is None:
            break
        total += term
        count += 1
        average = total/count
    return Result(count, average)

coro_avg = averager()
coro_avg.send(10)
coro_avg.send(30)
coro_avg.send(5)
try:
    coro_avg.send(None)
except StopIteration as exc:
    result = exc.value
print(result)
{% endhighlight %}
                                             
