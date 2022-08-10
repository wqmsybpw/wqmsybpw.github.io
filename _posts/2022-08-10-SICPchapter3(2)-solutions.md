---
layout: post
title: "SICP第三章部分习题解答(二)"
tags: [blog]
author: wqpw
---

<head>
    <style>
      .ruizhi {
        height: 144px;
        width: 144px;
        background-image: url('https://img-static.mihoyo.com/communityweb/upload/ace5032439f963286da0e5609a4c74ae.png');
      };
    </style>
    <script>
		function wink() {
		  this.style.opacity = 0.4;
		}
		function recover() {
		  this.style.opacity = 1;
		}
		function show() {
		  this.style.display = "none";
		  this.nextElementSibling.style.display = "";
		}

		document.body.onload = () => {
		  let codes = document.querySelectorAll("code");
		  for (let elem of codes) {
			if (elem.className == "language-plaintext highlighter-rouge") {
				continue;
		    }
			let d = document.createElement("div");
			d.classList.add("ruizhi");
			d.onmouseover = wink;
			d.onmouseleave = recover;
			d.onclick = show;
			elem.parentElement.insertBefore(d, elem);
			elem.style.display = "none";
		  }
		}
  </script>
</head>

使用[Racket](https://www.racket-lang.org/)并安装`sicp`包.

## 3.50

```racket
#lang sicp

(define (stream-car stream) (car stream))
(define (stream-cdr stream) (force (cdr stream)))

(define (stream-ref s n)
  (if (= n 0)
      (stream-car s)
      (stream-ref (stream-cdr s) (- n 1))))

; ex3.50
(define (stream-map proc . argstreams)
  (if (stream-null? (car argstreams))
      the-empty-stream
      (cons-stream
       (apply proc (map stream-car argstreams))
       (apply stream-map
              (cons proc (map stream-cdr argstreams))))))

(define (stream-for-each proc s)
  (if (stream-null? s)
      'done
      (begin (proc (stream-car s))
             (stream-for-each proc (stream-cdr s)))))

(define (stream-filter pred stream)
  (cond ((stream-null? stream) the-empty-stream)
        ((pred (stream-car stream))
         (cons-stream (stream-car stream)
                      (stream-filter pred
                                     (stream-cdr stream))))
        (else (stream-filter pred (stream-cdr stream)))))

(define (stream-enumerate-interval low high)
  (if (> low high)
      the-empty-stream
      (cons-stream
       low
       (stream-enumerate-interval (+ low 1) high))))

(define (displayln x)
  (display x) (newline))

(define (display-stream s)
  (stream-for-each displayln s))
```

## 3.54

```racket
(define (mul-stream s1 s2)
  (stream-map * s1 s2))
(define ones (cons-stream 1 ones))
(define integers (cons-stream 1 (add-stream ones integers)))
(define factorials (cons-stream 1 (mul-stream factorials integers)))
```

## 3.55

(partial-sums A) =  
{S_0, S_1, S_2, ...} =  
{0, S_0, S_1, ...} + {A_0, A_1, A_2, ...}  

```racket
(define (partial-sums A)
  (add-stream A (cons-stream 0 (partial-sums A))))
```

## 3.56

```racket
(define (merge s1 s2)
  (cond ((stream-null? s1) s2)
        ((stream-null? s2) s1)
        (else
         (let ((s1car (stream-car s1))
               (s2car (stream-car s2)))
           (cond ((< s1car s2car)
                  (cons-stream s1car (merge (stream-cdr s1) s2)))
                 ((> s1car s2car)
                  (cons-stream s2car (merge s1 (stream-cdr s2))))
                 (else
                  (cons-stream s1car
                               (merge (stream-cdr s1)
                                      (stream-cdr s2)))))))))

(define ex3.56 (cons-stream 1 (merge (scale-stream ex3.56 2) 
                                     (merge (scale-stream ex3.56 3)
                                            (scale-stream ex3.56 5)))))

(for-each (lambda(x) (displayln (stream-ref ex3.56 x))) '(5 8 9 12 34 79 132))
```

## 3.58

```racket
(define (expand num den radix)
  (cons-stream
   (quotient (* num radix) den)
   (expand (remainder (* num radix) den) den radix)))

(display "0.")
(for-each (lambda(x) (display (stream-ref (expand 300 512 2) x))) '(0 1 2 3 4 5 6 7 8))
(newline)
; 0.100101100
```

## 3.59

```racket
(define ones (cons-stream 1 ones))

(define harmonic-series
  (stream-map / ones integers))

(define (integrate-series s)
  (mul-stream harmonic-series s))

(define exp-series
  (cons-stream 1 (integrate-series exp-series)))

(define (loop res cnt series)
  (if (= cnt -1)
      res
      (loop (+ res (stream-ref series cnt)) (- cnt 1) series)))

(define sine-series
  (cons-stream 0 (integrate-series cosine-series)))

(define cosine-series
  (cons-stream 1 (integrate-series (scale-stream sine-series -1))))

(loop 0. 20 cosine-series) ; cos1 ~= 0.5403023058681398
(loop 0. 20 sine-series) ; sin1 ~= 0.8414709848078965

(define (+-x-stream x)  ; x -x x -x x ...
  (cons-stream x (stream-map (lambda (y) (- y)) (+-x-stream x))))

(define +-1stream (+-x-stream 1))
(define 0.5stream (cons-stream 0.5 0.5stream))

(define factorials (cons-stream 1 (mul-stream factorials integers)))
(define (fact n)
  (stream-ref factorials n))
(define even-fact (stream-map fact (stream-map (lambda (x) (* 2 x)) integers)))

(define cosine-series2
  (cons-stream
   1
   (mul-stream
    (+-x-stream -1)
    (stream-map / ones even-fact))))

(define (cycle lst)
  (define idx 0)
  (define x 0)
  (define (_cycle)
    (set! x (list-ref lst idx))
    (set! idx (modulo (+ idx 1) (length lst)))
    x)
  (define (cs)
    (define c (_cycle))
    (cons-stream c (cs)))
  (cs))

(define cosine-series3
  (mul-stream
   (cycle '(1 0 -1 0))
   (mul-stream
    0.5stream
    (add-stream exp-series
                (mul-stream +-1stream
                            exp-series)))))

(loop 0. 20 cosine-series2)
(loop 0. 20 cosine-series3)
```

## 3.60

对角线形式

![1](https://testt-1257276208.cos.ap-chengdu.myqcloud.com/bg/637efdefe86749c89f8209068f921fa0.png)

分成三块, 相当于:

```racket
(mul-series A B)
= (cons 
    (* (car A) (car B))
    (add
      (scale (cdr B) (car A))
      (mul-series (cdr A) B)))
```

```racket
(define (mul-series s1 s2)
  (cons-stream (* (stream-car s1) (stream-car s2))
               (add-stream
                (scale-stream (stream-cdr s2) (stream-car s1))
                (mul-series (stream-cdr s1) s2))))

(define cos1^2+sin1^2 (add-stream (mul-series cosine-series cosine-series)
                      (mul-series sine-series sine-series)))
(loop 0. 20 cos1^2+sin1^2) ; 1.0
(define e^2 (mul-series exp-series exp-series))
(loop 0. 20 e^2) ; 7.389056098930605
```

## 3.61

```racket
(define (inv-series s)
  (cons-stream 1
               (mul-series (scale-stream (stream-cdr s) -1)
                           (inv-series s))))

(define 1/e (inv-series exp-series))
(loop 0. 20 1/e) ; 0.36787944117144233
```

## 3.62

```racket
(define (div-series s1 s2)
  (if (= 0 (stream-car s2))
      (error "ERROR.")
      (mul-series s1 (inv-series s2))))

(define tan-series (div-series sine-series cosine-series))
(loop 0. 100 tan-series) ; 1.5574077246549023
```

## 3.64

```racket
(define (stream-limit s tolerance)
  (let ((s0 (stream-ref s 0))
        (s1 (stream-ref s 1)))
    (if (< (abs (- s1 s0)) tolerance)
        s1
        (stream-limit (stream-cdr s) tolerance))))
```

## 3.65

```racket
(define (loop2 cnt series)
  (for-each (lambda(x) (display (stream-ref series x)) (display " ")) (range 0 cnt)) (newline))

; ex3.59 harmonic-series, cycle ex3.55 partial-sums
(define ln2 (partial-sums (mul-stream (cycle '(1. -1)) harmonic-series)))

(loop2 20 ln2)
(loop2 20 (euler-transform ln2))
(loop2 20 (accelerated-sequence euler-transform ln2))
```

## 3.67

```racket
(define (interleave s1 s2)
  (if (stream-null? s1)
      s2
      (cons-stream (stream-car s1)
                   (interleave s2 (stream-cdr s1)))))

(define (pairs2 s t)
  (cons-stream
   (list (stream-car s) (stream-car t))
   (interleave
    (interleave
     (stream-map (lambda (x) (list (stream-car s) x))
                 (stream-cdr t))
     (stream-map (lambda (x) (list (stream-car t) x))
                 (stream-cdr s)))
    (pairs2 (stream-cdr s) (stream-cdr t)))))
```

## 3.69

```racket
; 遍历s把si中的元素插到(pairs ti ui)里面
; 利用interleave交替选择各个流, 但结果不太好
; 不如想办法改ex2.41
(define (triples s t u)
  (cons-stream
   (list (stream-car s) (stream-car t) (stream-car u))
   (interleave
    (stream-map
     (lambda (p) (cons (stream-car s) p))
     (stream-cdr (pairs t u))) ; cdr避免(s[i], t[i], u[i])重复出现
    (triples (stream-cdr s) (stream-cdr t) (stream-cdr u)))))

(loop2 20 (triples integers integers integers))

(define Pythagoras
  (stream-filter 
   (lambda (p) (= (square (caddr p))
                  (+ (square (car p)) (square (cadr p)))))
   (triples integers integers integers)))

(loop2 7 Pythagoras) ; 很慢
```

根据ex2.41改的python版, 暂时还不知道scheme怎么写这种形式:

```python
def integers():
    c = 1
    while True:
        yield c
        c += 1

def add_idx(g):
    idx = 0
    while True:
        yield (idx, next(g))
        idx += 1

def triples(s, t, u):
    ss = add_idx(s())
    us = add_idx(u())
    i, si = next(ss)
    k, uk = next(us)

    while True:
        ts = add_idx(t())
        j, tj = next(ts)
        yield (si, tj, uk)

        while j < k:
            j, tj = next(ts)
            yield (si, tj, uk)
            while i < j:
                i, si = next(ss)
                yield (si, tj, uk)
                
            ss = add_idx(s())
            i, si = next(ss)

        k, uk = next(us)

p = triples(integers, integers, integers)
for _ in range(20):
    print(str(next(p)).replace(', ', ' '), end=' ')

def pythagoras():
    p = triples(integers, integers, integers)
    while True:
        i, j, k = next(p)
        if i*i + j*j == k*k:
            yield (i, j, k)

sg = pythagoras()
for _ in range(30):
    print(str(next(sg)).replace(', ', ' '), end=' ')
```

## 3.70

题目描述读起来有点绕.

```racket
(define (merge-weighted s1 s2 weight)
  (cond ((stream-null? s1) s2)
        ((stream-null? s2) s1)
        (else
         (let ((s1car (stream-car s1))
               (s2car (stream-car s2)))
           (cond ((<= (weight s1car) (weight s2car))
                  (cons-stream s1car (merge-weighted (stream-cdr s1) s2 weight)))
                 ((> (weight s1car) (weight s2car))
                  (cons-stream s2car (merge-weighted s1 (stream-cdr s2) weight))))))))

; 按照pairs, 左到右上到下保证i<=j
(define (weighted-pairs s1 s2 weight)
  (cons-stream
   (list (stream-car s1) (stream-car s2))
   (merge-weighted
    (stream-map (lambda (x) (list (stream-car s1) x))
                (stream-cdr s2))
    (weighted-pairs (stream-cdr s1) (stream-cdr s2) weight)
    weight)))

(define ex370a
  (weighted-pairs
   integers integers
   (lambda (p)
     (+ (car p) (cadr p)))))

(loop2 10 ex370a)

(define ex370b
  (weighted-pairs
   (stream-filter
    (lambda (x)
      (if (or (= 0 (remainder x 2))
              (= 0 (remainder x 3))
              (= 0 (remainder x 5)))
          false true))
    integers)
   (stream-filter
    (lambda (x)
      (if (or (= 0 (remainder x 2))
              (= 0 (remainder x 3))
              (= 0 (remainder x 5)))
          false true))
    integers)
   (lambda (p)
     (+ (* 2 (car p)) (* 3 (cadr p)) (* 5 (car p) (cadr p))))))

(loop2 10 ex370b)
```

## 3.71

```racket
(define (cube x) (* x x x))
(define p-cube (lambda (p) (+ (cube (car p)) (cube (cadr p)))))

(define ex371
  (weighted-pairs
   integers integers
   p-cube))

(define (iter s)
  (let ((p1 (stream-car s))
        (p2 (stream-car (stream-cdr s))))
    (if (= (p-cube p1) (p-cube p2))
        (cons-stream (p-cube p1)
                     (iter (stream-cdr (stream-cdr s)))) 
                     ;或许有连续三个相等的, 跳过避免重复
                     ;改程序试了下, 第一个有连续三个相等的是 87539319
        (iter (stream-cdr s)))))

(define Ramanujan (iter ex371))

(loop2 6 Ramanujan) ;1729 4104 13832 20683 32832 39312
```

## 3.72

这个就很简单了.

```racket
(define p-square (lambda (p) (+ (square (car p)) (square (cadr p)))))

(define ex372
  (weighted-pairs
   integers integers
   p-square))

(define (iter s)
  (let ((p1 (stream-car s))
        (p2 (stream-car (stream-cdr s)))
        (p3 (stream-car (stream-cdr (stream-cdr s)))))
    (if (= (p-square p1) (p-square p2) (p-square p3))
        (cons-stream (list p1 p2 p3 (p-square p1))
                     (iter (stream-cdr (stream-cdr (stream-cdr s)))))
        (iter (stream-cdr s)))))

(define ex372-sol (iter ex372))

(loop2 10 ex372-sol)
```

## 3.73

照着图写就行.

```racket
(define (RC R C dt)
  (lambda (i v0)
    (add-stream
     (scale-stream i R)
     (integral (scale-stream i (/ 1 C)) v0 dt))))
```

## 3.74

```racket
(define (sign-change-detector b a)
  (cond ((and (< a 0) (>= b 0)) 1)
        ((and (>= a 0) (< b 0)) -1)
        (else 0)))

(define (random-in-range low high)
  (let ((range (- high low)))
    (+ low (random range))))

(define sense-data 
  (stream-map (lambda (x) (random-in-range -5. 5.)) integers))

(define zero-crossings
  (stream-map sign-change-detector sense-data (cons-stream 0 sense-data)))
```

## 3.75

```racket
(define (make-zero-crossings input-stream last-avpt last-value)
  (let ((avpt (/ (+ (stream-car input-stream) last-value) 2)))
    (cons-stream (sign-change-detector avpt last-avpt)
                 (make-zero-crossings (stream-cdr input-stream)
                                      avpt
                                      (stream-car input-stream)))))
```

## 3.76

```racket
(define zero-crossings-3
  (stream-map sign-change-detector 
              (smooth sense-data)
              (smooth (cons-stream 0 sense-data))))
```

## 3.77

```racket
(define (integral2 delayed-integrand initial-value dt)
  (cons-stream initial-value
               (let ((integrand (force delayed-integrand)))
                 (if (stream-null? integrand)
                     the-empty-stream
                     (integral2 (delay (stream-cdr integrand))
                                (+ (* dt (stream-car integrand))
                                   initial-value)
                                dt)))))

(define (solve2 f y0 dt)
  (let ((y '*unsigned*)
        (dy '*unsigned*))
    (set! y (integral2 (delay dy) y0 dt))
    (set! dy (stream-map f y))
    y))

(stream-ref (solve2 (lambda (y) y) 1 0.001) 1000)
```

## 3.78

```racket
(define (solve-2nd-78 a b dt y0 dy0)
  (let ((y '*unsigned*)
        (ddy '*unsigned*)
        (dy '*unsigned*))
    (set! y (integral (delay dy) y0 dt))
    (set! dy (integral (delay ddy) dy0 dt))
    (set! ddy (add-stream (scale-stream dy a)
                          (scale-stream y b)))
    y))

(stream-ref (solve-2nd-78 0.5 0.5 0.001 1 1) 1000) ; y=e^x
```

## 3.79

这部分题学之前看起来感觉还挺难的..

```racket
; y'' = f(y', y)
(define (solve-2nd-79 f dt y0 dy0)
  (let ((y '*unsigned*)
        (ddy '*unsigned*)
        (dy '*unsigned*))
    (set! y (integral (delay dy) y0 dt))
    (set! dy (integral (delay ddy) dy0 dt))
    (set! ddy (stream-map f dy y))
    y))

(stream-ref (solve-2nd-79 (lambda (dy y) (+ (* 0.5 dy) (* 0.5 y))) 0.001 1 1) 1000) ; y=e^x
```

## 3.80

```racket
(define (RLC R L C dt)
  (lambda (vC0 iL0)
    (let ((vC-stream '*unsigned*)
          (iL-stream '*unsigned*)
          (dvC '*unsigned*)
          (diL '*unsigned*))
      (set! iL-stream (integral (delay diL) iL0 dt))
      (set! vC-stream (integral (delay dvC) vC0 dt))
      (set! dvC (scale-stream iL-stream (/ -1 C)))
      (set! diL (add-stream (scale-stream vC-stream (/ 1 L))
                            (scale-stream iL-stream (- (/ R L)))))
      (stream-map cons vC-stream iL-stream))))
```

## 3.81

```racket
(define (rand msg-stream seed)
  (let ((x seed))
    (if (eq? 'generate (stream-car msg-stream))
        (cons-stream (rand-update x) (rand (stream-cdr msg-stream) seed))
        (let ((nx (rand-update (cadr (stream-car msg-stream)))))
          (cons-stream nx
           (rand (stream-cdr msg-stream) nx))))))

(define requests
  (cons-stream 'generate
               (cons-stream 'generate
                            (cons-stream '(reset 500)
                                         (cons-stream 'generate
                                                      the-empty-stream)))))
(loop2 4 (rand requests 20))
```

## 3.82

```racket
(define (monte-carlo experiment-stream passwd failed)
  (define (next passwd failed)
    (cons-stream
     (/ passwd (+ passwd failed))
     (monte-carlo
      (stream-cdr experiment-stream) passwd failed)))
  (if (stream-car experiment-stream)
      (next (+ passwd 1) failed)
      (next passwd (+ failed 1))))

(define (random-in-range-stream low high)
  (cons-stream (random-in-range low high)
               (random-in-range-stream low high)))

(define (estimate-integral P x1 x2 y1 y2)
  (define experiment-stream
    (stream-map
     P
     (random-in-range-stream x1 x2)
     (random-in-range-stream y1 y2)))
  (monte-carlo experiment-stream 0 0))

(define estmate-pi
  (scale-stream
     (estimate-integral 
      (lambda (x y) (<= (+ (square x) (square y)) 1.))
      (- 1.) 1. (- 1.) 1.)
     4.))

(stream-ref estmate-pi 300000)
```
