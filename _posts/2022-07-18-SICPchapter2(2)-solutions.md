---
layout: post
title: "SICP第二章部分习题解答(二)"
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

## 2.54

```racket
(define (equal? a b)
  (cond ((and (symbol? a) (symbol? b)) (eq? a b))
        ((and (null? a) (null? b)) #t)
        ((and (list? a) (list? b) 
              (not (null? a)) (not (null? b)))
         (and (eq? (car a) (car b)) 
              (equal? (cdr a) (cdr b))))
        (else #f)))
```

## 2.56-2.57

```racket
#lang sicp

(define (variable? x) (symbol? x))

(define (same-variable? v1 v2)
  (and (variable? v1) (variable? v2) (eq? v1 v2)))

(define (=number? x a)
  (and (number? x) (= x a)))

(define (make-sum a1 a2)
  (cond ((=number? a1 0) a2)
        ((=number? a2 0) a1)
        ((and (number? a1) (number? a2)) (+ a1 a2))
        (else (list '+ a1 a2))))

(define (make-product m1 m2)
  (cond ((or (=number? m1 0) (=number? m2 0)) 0)
        ((=number? m1 1) m2)
        ((=number? m2 1) m1)
        ((and (number? m1) (number? m2)) (* m1 m2))
        (else (list '* m1 m2))))

(define (sum? x)
  (and (pair? x) (eq? (car x) '+)))

;(ext-exp '(+ 1 2 3 4 5)) -> (+ 1 (+ 2 (+ 3 (+ 4 5))))
(define (ext-exp exp)
  (letrec ((op (car exp))
           (acc (lambda (s)
                  (if (null? (cdr s))
                      (car s)
                      (list op (car s) (acc (cdr s)))))))
    (acc (cdr exp))))

(define (addend s) (cadr s))

(define (augend s) 
  (if (> (length (cddr s)) 1) 
      (ext-exp (cons '+ (cddr s)))
      (caddr s)))

(define (product? x)
  (and (pair? x) (eq? (car x) '*)))

(define (multiplier p) (cadr p))

(define (multiplicand p)
  (if (> (length (cddr p)) 1) 
      (ext-exp (cons '* (cddr p)))
      (caddr p)))

(define (exponentiation? x)
  (eq? (car x) '**))

(define (base x)
  (cadr x))

(define (exponent x)
  (caddr x))

(define (make-exponentiation b e)
  (cond ((=number? b 1) 1)
        ((=number? e 0) 1)
        ((=number? e 1) b)
        ((and (number? b) (number? e)) (expt b e))
        (else (list '** b e))))

(define (deriv exp var)
  (cond ((number? exp) 0)
        ((variable? exp)
         (if (same-variable? exp var) 1 0))
        ((sum? exp)
         (make-sum (deriv (addend exp) var)
                   (deriv (augend exp) var)))
        ((product? exp)
         (make-sum
          (make-product (multiplier exp)
                        (deriv (multiplicand exp) var))
          (make-product (deriv (multiplier exp) var)
                        (multiplicand exp))))
        ((exponentiation? exp)
         (make-product (exponent exp)
                       (make-product 
                        (make-exponentiation (base exp)
                                             (make-sum (exponent exp) (- 1)))
                                     (deriv (base exp) var))))
        (else
         (error "unkown expression type -- DERIV" exp))))

(deriv '(** x 8) 'x)
(deriv '(* (* x y) (+ x 3)) 'x)
(deriv '(* x y (+ x 3)) 'x)
```

## 2.58

只需要做(b)就行了.

加法最后算，所以先把加法左右分开求导求和.

```racket
#lang sicp

;exp = left op right -> (left . right)
(define (split op exp)
  (define (iter left right)
    (cond ((null? right) #f)
          ((eq? op (car right)) (cons left (cdr right)))
          (else (iter (cons (car right) left) (cdr right)))))
  (iter '() exp))

(define (variable? x) (symbol? x))

(define (same-variable? v1 v2)
  (and (variable? v1) (variable? v2) (eq? v1 v2)))

(define (=number? x a)
  (and (number? x) (= x a)))

(define (make-sum a1 a2)
  (cond ((=number? a1 0) a2)
        ((=number? a2 0) a1)
        ((and (number? a1) (number? a2)) (+ a1 a2))
        (else (list a1 '+ a2))))

(define (make-product m1 m2)
  (cond ((or (=number? m1 0) (=number? m2 0)) 0)
        ((=number? m1 1) m2)
        ((=number? m2 1) m1)
        ((and (number? m1) (number? m2)) (* m1 m2))
        (else (list m1 '* m2))))

(define (sum? exp)
  (and (list? exp) (memq '+ exp)))

(define (product? exp)
  (and (list? exp) (not (memq '+ exp))))

(define (left op exp)
  (let ((r (car (split op exp))))
    (if (and (list? r) (= (length r) 1)) (car r) r)))

(define (right op exp)
  (let ((r (cdr (split op exp))))
    (if (and (list? r) (= (length r) 1)) (car r) r)))

(define (addend exp)
  (left '+ exp))

(define (augend exp)
  (right '+ exp))

(define (multiplier exp)
  (left '* exp))

(define (multiplicand exp)
  (right '* exp))

(define (deriv exp var)
  (cond ((number? exp) 0)
        ((variable? exp)
         (if (same-variable? exp var) 1 0))
        ((sum? exp)
         (make-sum (deriv (addend exp) var)
                   (deriv (augend exp) var)))
        ((product? exp)
         (make-sum
          (make-product (multiplier exp)
                        (deriv (multiplicand exp) var))
          (make-product (deriv (multiplier exp) var)
                        (multiplicand exp))))
        (else
         (error "unkown expression type -- DERIV" exp))))

(deriv '(3 * (x + (y + 2))) 'x)
(deriv '(x + (3 * (x + (y + 2)))) 'x)
(deriv '(x + 3 * (x + y + 2)) 'x)
(deriv '(x + 3 * (7 * x + y + 2)) 'x)
(deriv '(x * y * (x + 3)) 'x)
(deriv '((x * y) + (x * y + z)) 'x)
(deriv '(x * y + 1 + x * 3 + 4) 'x)
(deriv '(10 + 3 * x) 'x)
```

## 2.59

```racket
(define (union-set set1 set2)
  (cond ((null? set2) set1)
        ((null? set1) set2)
        ((element-of-set? (car set2) set1)
         (union-set set1 (cdr set2)))
        (else (union-set (cons (car set2) set1) (cdr set2)))))
```

2.60没啥意思.

## 2.61, 2.62

集合作为排序的表.

```racket
(define (adjoin-set x set)
  (cond ((or (null? set) (< x (car set)))
         (cons x set))
        ((= x (car set)) set)
        (else (cons (car set) (adjoin-set x (cdr set))))))

(define (union-set set1 set2)
  (cond ((null? set1) set2)
        ((null? set2) set1)
        (else (let ((x1 (car set1)) (x2 (car set2)))
                (cond ((= x1 x2) (cons x1 (union-set (cdr set1) (cdr set2))))
                      ((< x1 x2) (cons x1 (union-set (cdr set1) set2)))
                      ((> x1 x2) (cons x2 (union-set set1 (cdr set2)))))))))
```

## 2.65

利用前面给的程序.

```racket
(define (tree->list tree)
  (if (null? tree)
      '()
      (append (tree->list (left-branch tree))
              (cons (entry tree)
                    (tree->list (right-branch tree))))))

(define (list->tree elements)
  (car (partial-tree elements (length elements))))

(define (partial-tree elts n)
  (if (= n 0)
      (cons '() elts)
      (let ((left-size (quotient (- n 1) 2)))
        (let ((left-result (partial-tree elts left-size)))
          (let ((left-tree (car left-result))
                (non-left-elts (cdr left-result))
                (right-size (- n (+ left-size 1))))
            (let ((this->entry (car non-left-elts))
                  (right-result (partial-tree (cdr non-left-elts)
                                              right-size)))
              (let ((right-tree (car right-result))
                    (remaining-elts (cdr right-result)))
                (cons (make-tree this->entry left-tree right-tree)
                      remaining-elts))))))))

(define (union-lset set1 set2)
  (cond ((null? set1) set2)
        ((null? set2) set1)
        (else (let ((x1 (car set1)) (x2 (car set2)))
                (cond ((= x1 x2) (cons x1 (union-lset (cdr set1) (cdr set2))))
                      ((< x1 x2) (cons x1 (union-lset (cdr set1) set2)))
                      ((> x1 x2) (cons x2 (union-lset set1 (cdr set2)))))))))

(define (union-set set1 set2)
  (list->tree (union-lset (tree->list set1) (tree->list set2))))

(define (intersection-lset set1 set2)
  (if (or (null? set1) (null? set2))
      '()
      (let ((x1 (car set1)) (x2 (car set2)))
        (cond ((= x1 x2)
               (cons x1
                     (intersection-lset (cdr set1)
                                       (cdr set2))))
              ((< x1 x2)
               (intersection-lset (cdr set1) set2))
              ((> x1 x2)
               (intersection-lset set1 (cdr set2)))))))

(define (intersection-set set1 set2)
  (list->tree (intersection-lset (tree->list set1) (tree->list set2))))
```

## 2.66

```racket
(define (lookup given-key set-of-records)
  (cond ((null? set-of-records) #f)
        ((equal? given-key (key (car set-of-records))) (car set-of-records))
        ((< given-key (key (car set-of-records)))
         (lookup given-key (left-branch set-of-records)))
        ((> given-key (key (car set-of-records)))
         (lookup given-key (right-branch set-of-records)))))
```

## 2.67-70

哈夫曼编码.

```racket
#lang sicp

(define (make-leaf symbol weight)
  (list 'leaf symbol weight))

(define (leaf? object)
  (eq? (car object) 'leaf))

(define (symbol-leaf x) (cadr x))
(define (weight-leaf x) (caddr x))

(define (make-code-tree left right)
  (list left
        right
        (append (symbols left) (symbols right))
        (+ (weight left) (weight right))))

(define (left-branch tree) (car tree))
(define (right-branch tree) (cadr tree))

(define (symbols tree)
  (if (leaf? tree)
      (list (symbol-leaf tree))
      (caddr tree)))

(define (weight tree)
  (if (leaf? tree)
      (weight-leaf tree)
      (cadddr tree)))

(define (decode bits tree)
  (define (decode-1 bits current-branch)
    (if (null? bits)
        '()
        (let ((next-branch
               (choose-branch (car bits) current-branch)))
          (if (leaf? next-branch)
              (cons (symbol-leaf next-branch)
                    (decode-1 (cdr bits) tree))
              (decode-1 (cdr bits) next-branch)))))
  (decode-1 bits tree))

(define (choose-branch bit branch)
  (cond ((= bit 0) (left-branch branch))
        ((= bit 1) (right-branch branch))
        (else (error "bad bit -- CHOOSE-BRANCH" bit))))

(define (adjoin-set x set)
  (cond ((null? set) (list x))
        ((< (weight x) (weight (car set))) (cons x set))
        (else (cons (car set)
                    (adjoin-set x (cdr set))))))

(define (make-leaf-set pairs)
  (if (null? pairs)
      '()
      (let ((pair (car pairs)))
        (adjoin-set (make-leaf (car pair)   ; symbol
                               (cadr pair)) ; frequency
                    (make-leaf-set (cdr pairs))))))

(define sample-tree
  (make-code-tree (make-leaf 'A 4)
                  (make-code-tree
                   (make-leaf 'B 2)
                   (make-code-tree (make-leaf 'D 1)
                                   (make-leaf 'C 1)))))

(define sample-message '(0 1 1 0 0 1 0 1 0 1 1 1 0))

(decode sample-message sample-tree)
; '(0 1 1 0 0 1 0 1 0 1 1 1 0)
; '(A D     A B   B   C     A)

(define (encode message tree)
  (if (null? message)
      '()
      (append (encode-symbol (car message) tree)
              (encode (cdr message) tree))))

(define (encode-symbol symbol tree)
  (define (scan tree bits)
    (cond ((leaf? tree)
           (if (eq? (symbol-leaf tree) symbol)
               bits
               #f))
          (else (let ((left-result (scan (left-branch tree) (append bits '(0)))))
                  (cond ((not (eq? left-result #f)) left-result)
                        (else
                         (let ((right-result (scan (right-branch tree) (append bits '(1)))))
                           (cond ((not (eq? right-result #f)) right-result)
                                 (else #f)))))))))
  (if (memq symbol (symbols tree))
      (scan tree '())
      (error "bad symbol -- ENCODE " symbol)))

(encode '(A D A B B C A) sample-tree)

(define (generate-huffman-tree pairs)
  (successive-merge (make-leaf-set pairs)))

(define (successive-merge set)
  (if (= 1 (length set))
      (car set)
      (successive-merge 
       (adjoin-set 
        (make-code-tree (car set) (cadr set)) 
        (cddr set)))))

(display sample-tree) (newline)
(generate-huffman-tree '((A 4) (B 2) (C 1) (D 1)))

(define tree-270
  (generate-huffman-tree '((a 2) (boom 1) (Get 2) (job 2) (na 16) (Sha 3) (yip 9) (Wah 1))))

(define song '(Get a job Sha na na na na na na na na Get a job Sha na na na na na na na na Wah yip yip yip yip yip yip yip yip yip Sha boom))
(length (encode song tree-270))
(encode song tree-270)
(decode (encode song tree-270) tree-270)
```

## 2.73-76

2.4主要介绍三种策略`message-passing`, `explicit dispatch`, `data-directed`.

相关问题: [ExpressionProblem](http://wiki.c2.com/?ExpressionProblem).

## 2.77-80

题很简单，就是complex-package真的长...

```racket
#lang racket

(define __table (make-hash))
(define (put key1 key2 value) (hash-set! __table (list key1 key2) value))
(define (get key1 key2) (hash-ref __table (list key1 key2) #f))

(define (attach-tag type-tag contents)
  (if (eq? type-tag 'scheme-number)
      contents
      (cons type-tag contents)))

(define (type-tag datum)
  (cond ((pair? datum) (car datum))
        ((number? datum) 'scheme-number)
        (else (error "Bad tagged datum -- TYPE-TAG" datum))))

(define (contents datum)
  (cond ((pair? datum) (cdr datum))
        ((number? datum) datum)
        (else (error "Bad tagged datum -- CONTENTS" datum))))

(define (apply-generic op . args)
  (let ((type-tags (map type-tag args)))
    (let ((proc (get op type-tags)))
      (if proc
          (apply proc (map contents args))
          (error
           "No method for these types -- APPLY-GENERIC"
           (list op type-tags))))))

(define (add x y) (apply-generic 'add x y))
(define (sub x y) (apply-generic 'sub x y))
(define (mul x y) (apply-generic 'mul x y))
(define (div x y) (apply-generic 'div x y))

(define (install-scheme-number-package)
  (define (tag x)
    (attach-tag 'scheme-number x))
  (put 'add '(scheme-number scheme-number)
       (lambda (x y) (tag (+ x y))))
  (put 'sub '(scheme-number scheme-number)
       (lambda (x y) (tag (- x y))))
  (put 'mul '(scheme-number scheme-number)
       (lambda (x y) (tag (* x y))))
  (put 'div '(scheme-number scheme-number)
       (lambda (x y) (tag (/ x y))))
  (put 'make 'scheme-number
       (lambda (x) (tag x)))
  (put 'equ? '(scheme-number scheme-number)
       (lambda (x y) (= x y)))
  (put '=zero? '(scheme-number)
       (lambda (x) (= x 0)))
  'done)

(define (make-scheme-nubmer n)
  ((get 'make 'scheme-number) n))

(define (install-rational-package)
  (define (numer x) (car x))
  (define (denom x) (cdr x))
  (define (make-rat n d)
    (let ((g (gcd n d)))
      (cons (/ n g) (/ d g))))
  (define (add-rat x y)
    (make-rat (+ (* (numer x) (denom y))
                 (* (numer y) (denom x)))
              (* (denom x) (denom y))))
  (define (sub-rat x y)
    (make-rat (- (* (numer x) (denom y))
                 (* (numer y) (denom x)))
              (* (denom x) (denom y))))
  (define (mul-rat x y)
    (make-rat (* (numer x) (numer y))
              (* (denom x) (denom y))))
  (define (div-rat x y)
    (make-rat (* (numer x) (denom y))
              (* (denom x) (numer y))))
  (define (tag x) (attach-tag 'rational x))
  (define (equ? x y)
    (= (* (numer x) (denom y))
      (* (numer y) (denom x))))
  (define (=zero? x)
    (and (= 0 (numer x))
         (not (= 0 (denom x)))))
  (put 'add '(rational rational)
       (lambda (x y) (tag (add-rat x y))))
  (put 'sub '(rational rational)
       (lambda (x y) (tag (sub-rat x y))))
  (put 'mul '(rational rational)
       (lambda (x y) (tag (mul-rat x y))))
  (put 'div '(rational rational)
       (lambda (x y) (tag (div-rat x y))))
  (put 'make 'rational
       (lambda (n d) (tag (make-rat n d))))
  (put 'equ? '(rational rational)
       (lambda (x y) (equ? x y)))
  (put '=zero? '(rational)
       (lambda (x) (=zero? x)))
  'done)

(define (make-rational n d)
  ((get 'make 'rational) n d))

(define (install-complex-package)

  (define (make-from-real-imag x y)
    ((get 'make-from-real-imag '(rectangular)) x y))

  (define (make-from-mag-ang r a)
    ((get 'make-from-mag-ang '(polar)) r a))

  (define (add-complex z1 z2)
    (make-from-real-imag (+ (real-part z1) (real-part z2))
                         (+ (imag-part z1) (imag-part z2))))

  (define (sub-complex z1 z2)
    (make-from-real-imag (- (real-part z1) (real-part z2))
                         (- (imag-part z1) (imag-part z2))))

  (define (mul-complex z1 z2)
    (make-from-mag-ang (* (magnitude z1) (magnitude z2))
                       (+ (angle z1) (angle z2))))

  (define (div-complex z1 z2)
    (make-from-mag-ang (/ (magnitude z1) (magnitude z2))
                       (- (angle z1) (angle z2))))

  (define (tag z) (attach-tag 'complex z))

  (define (square x) (* x x))
  ;(define (rectangular? z)
  ;  (eq? (type-tag z) '(rectangular)))
  ;(define (polar? z)
  ;  (eq? (type-tag z) '(polar)))
  (define (real-part-rectangular z) (car z))

  (put 'real-part '(rectangular)
       (lambda (z) (real-part-rectangular z)))

  (define (imag-part-rectangular z) (cdr z))

  (put 'imag-part '(rectangular)
       (lambda (z) (imag-part-rectangular z)))

  (define (magnitude-rectangular z)
    (sqrt (+ (square (real-part-rectangular z))
             (square (imag-part-rectangular z)))))

  (put 'magnitude '(rectangular)
       (lambda (z) (magnitude-rectangular z)))

  (define (angle-rectangular z)
    (atan (imag-part-rectangular z)
          (real-part-rectangular z)))

  (put 'angle '(rectangular)
       (lambda (z) (angle-rectangular z)))

  (define (make-from-real-imag-rectangular x y)
    (attach-tag 'rectangular (cons x y)))

  (put 'make-from-real-imag '(rectangular)
       (lambda (x y) (make-from-real-imag-rectangular x y)))

  (define (make-from-ang-rectangular r a)
    (attach-tag 'rectangular
                (cons (* r (cos a)) (* r (sin a)))))

  (put 'make-from-ang '(rectangular)
       (lambda (r a) (make-from-ang-rectangular r a)))

  (define (real-part-polar z)
    (* (magnitude-polar z) (cos (angle-polar z))))

  (put 'real-part '(polar)
       (lambda (z) (real-part-polar z)))

  (define (imag-part-polar z)
    (* (magnitude-polar z) (sin (angle-polar z))))

  (put 'imag-part '(polar)
       (lambda (z) (imag-part-polar z)))

  (define (magnitude-polar z) (car z))

  (put 'magnitude '(polar)
       (lambda (z) (magnitude-polar z)))

  (define (angle-polar z) (cdr z))

  (put 'angle '(polar)
       (lambda (z) (angle-polar z)))

  (define (make-from-real-imag-polar x y)
    (attach-tag '(polar)
                (cons (sqrt (+ (square x) (square y)))
                      (atan y x))))

  (put 'make-from-real-imag '(polar)
       (lambda (x y) (make-from-real-imag-polar x y)))

  (define (make-from-mag-ang-polar r a)
    (attach-tag 'polar (cons r a)))

  (put 'make-from-mag-ang '(polar)
       (lambda (r a) (make-from-mag-ang-polar r a)))

  (put 'add '(complex complex)
       (lambda (z1 z2) (tag (add-complex z1 z2))))

  (put 'sub '(complex complex)
       (lambda (z1 z2) (tag (sub-complex z1 z2))))

  (put 'mul '(complex complex)
       (lambda (z1 z2) (tag (mul-complex z1 z2))))

  (put 'div '(complex complex)
       (lambda (z1 z2) (tag (div-complex z1 z2))))

  (put 'make-from-real-imag 'complex
       (lambda (x y) (tag (make-from-real-imag x y))))

  (put 'make-from-mag-ang 'complex
       (lambda (r a) (tag (make-from-mag-ang r a))))

  (put 'real-part '(complex) real-part)
  (put 'imag-part '(complex) imag-part)
  (put 'magnitude '(complex) magnitude)
  (put 'angle '(complex) angle)

  (put 'equ? '(rectangular rectangular)
       (lambda (x y) (and (= (real-part-rectangular x) (real-part-rectangular y))
                          (= (imag-part-rectangular x) (imag-part-rectangular y)))))

  (put 'equ? '(polar polar)
       (lambda (x y) (and (= (magnitude-polar x) (magnitude-polar y))
                          (= (angle-polar x) (angle-polar y)))))

  (define (equ? x y) (apply-generic 'equ? x y))

  (put 'equ? '(complex complex)
       (lambda (x y) (equ? x y)))

  (put '=zero? '(rectangular)
       (lambda (x) (and (=zero? (real-part-rectangular x)) 
                        (=zero? (imag-part-rectangular x)))))

  (put '=zero? '(polar) 
       (lambda (x) (=zero? (magnitude-polar x))))

  (define (=zero? x) (apply-generic '=zero? x))

  (put '=zero? '(complex) =zero?)

  'done)

(define (make-complex-from-real-imag x y)
  ((get 'make-from-real-imag 'complex) x y))

(define (make-complex-from-mag-ang r a)
  ((get 'make-from-mag-ang 'complex) r a))

(define (real-part z)
  (apply-generic 'real-part z))
(define (imag-part z)
  (apply-generic 'imag-part z))
(define (magnitude z)
  (display z) (newline)
  (apply-generic 'magnitude z))
(define (angle z)
  (apply-generic 'angle z))

(install-complex-package)
(define z (make-complex-from-real-imag 2 3))
(magnitude z) ;ex2.77
(add (make-complex-from-real-imag 1 2) (make-complex-from-real-imag 1 2))

;; ex 2.78
(install-scheme-number-package)
(add 1 2)
(add (make-scheme-nubmer 1) (make-scheme-nubmer 2))
(attach-tag 'log 5)

;; ex2.79
(define (equ? x y) (apply-generic 'equ? x y))
(equ? 1 1)
(equ? (make-scheme-nubmer 1) (make-scheme-nubmer 2))
(install-rational-package)
(equ? (make-rational 1 2) (make-rational 1 2))
(equ? (make-complex-from-real-imag 1 2) (make-complex-from-real-imag 1 2))

;; ex2.80
(define (=zero? x) (apply-generic '=zero? x))
(=zero? 0)
(=zero? (make-scheme-nubmer 0))
(=zero? (make-rational 0 1))
(=zero? (make-complex-from-real-imag 0 0))
(=zero? (make-complex-from-real-imag 0 1))
```

## 2.81

相对于之前几个的题代码添加修改了:

放类型转换过程的表.

```racket
(define __coercion_table (make-hash))
(define (put-coercion key1 key2 value) (hash-set! __coercion_table (list key1 key2) value))
(define (get-coercion key1 key2) (hash-ref __coercion_table (list key1 key2) #f))
```

题目说明的一种策略的实现

```racket
#| 练习2.82
   遍历, 将所有的参数都强制到第i个参数的类型, 返回可行的类型 |#
(define (convert-check args)
  (define (check i-type)
    (andmap (lambda (a)
              (or (equal? i-type (type-tag a))
                  (not (eq? #f (get-coercion (type-tag a) i-type)))))
            args))
  (define (iter i len)
    (if (< i len)
        (let ((i-type (type-tag (list-ref args i))))
          (if (check i-type)
              i-type
              (iter (+ i 1) len)))
        #f))
  (iter 0 (length args)))
```

修改了`apply-generic`以处理不同类型多个参数的情况.

```racket
(define (apply-generic op . args)
  (let ((type-tags (map type-tag args)))
    (let ((proc (get op type-tags)))
      (if proc
          (apply proc (map contents args))
          (if (= (length args) 2)
              (let ((type1 (car type-tags))
                    (type2 (cadr type-tags))
                    (a1 (car args))
                    (a2 (cadr args)))
                (if (equal? type1 type2)
                    (error "#1 No method for the type"
                           (list op type-tags))
                    (let ((t1->t2 (get-coercion type1 type2))
                          (t2->t1 (get-coercion type2 type1)))
                      (cond (t1->t2
                             (apply-generic op (t1->t2 a1) a2))
                            (t2->t1
                             (apply-generic op a1 (t2->t1 a2)))
                            (else (error "#2 No method for these types"
                                         (list op type-tags)))))))
              (let ((type (convert-check args)))
                (if (false? type)
                    (error "#3 No method for these types"
                           (list op type-tags))
                    (foldl
                     (lambda (x y)
                       (apply-generic
                        op
                        ((get-coercion (type-tag x) type) x)
                        ((get-coercion (type-tag y) type) y)))
                     (apply-generic
                      op
                      ((get-coercion (type-tag (car args)) type) (car args))
                      ((get-coercion (type-tag (cadr args)) type) (cadr args)))
                     (cddr args)))))))))
```

`rational-package`添加`(put 'numer '(rational) numer) (put 'denom '(rational) denom)`.

最外层添加

```racket
(define (numer r) (apply-generic 'numer r))
(define (denom r) (apply-generic 'denom r))
```

修改`(define (angle z) (apply-generic 'angle z))`之后的代码为

```racket
(install-scheme-number-package)
(install-rational-package)
(install-complex-package)

; 添加类型转换过程
(define (scheme-number->complex n)
  (make-complex-from-real-imag (contents n) 0))
(put-coercion 'scheme-number 'complex scheme-number->complex)
(define (rational->complex r)
  (make-complex-from-real-imag (/ (numer r) (denom r)) 0))
(put-coercion 'rational 'complex rational->complex)

; 简化convert-check
(define (scheme-number->scheme-number n) n)
(define (complex->complex z) z)
(define (rational->rational r) r)
(put-coercion 'scheme-number 'scheme-number scheme-number->scheme-number)
(put-coercion 'complex 'complex complex->complex)
(put-coercion 'rational 'rational rational->rational)
```

最后测试`(apply-generic 'add 1 (make-rational 3 2) 1 (make-complex-from-real-imag 1 1) 1 1)`, 所有参数都会被强制转换为complex类型, 结果为`'(complex rectangular 13/2 . 1)`

这种策略的不足: 比如我没写`scheme-number->rational`, 虽然这两种类型都可以转换到`complex`, 但上面的程序无法计算只有rational和scheme-number两种类型的情况.

## 2.83-85

为了利用之前的代码测试，假设`scheme-number`就是整数，实数包就不写了.

在上一题代码的基础上修改.

```racket
(define type-tower '(scheme-number rational complex))
(define (_raise x cnt) ; 提升cnt次
  (if (< cnt 1)
      x
      (_raise (raise x) (- cnt 1))))
(define (type-level x)
  (index-of type-tower (type-tag x)))

; 不到最低一层且先投影再提升与原数相等就继续下降
(define (drop x)
  (if (and (not (equal? (car type-tower) (type-tag x))) 
           (equ? x (raise (project x))))
      (drop (project x))
      x))

(define (apply-generic op . args)
  (let ((type-tags (map type-tag args)))
    (let ((proc (get op type-tags)))
      (if proc
          (if (ormap (lambda (x) (equal? op x)) '(raise project equ? =zero?)) 
              (apply proc (map contents args)) ;防止死循环
              (drop (apply proc (map contents args))))
          (let ((max-type (apply max (map type-level args))))
            (drop (foldl
             (lambda (x y)
               (apply-generic
                 op
                 (_raise x (- max-type (type-level x)))
                 y))
             (apply-generic
               op
               (_raise (car args) (- max-type (type-level (car args))))
               (_raise (cadr args) (- max-type (type-level (cadr args)))))
             (cddr args))))))))

(define add (lambda args (apply apply-generic 'add args)))
(define (project x) (apply-generic 'project x))

; rational-package添加
  (define (project x)
    (round (/ (numer x) (denom x))))
  (put 'project '(rational) project)

; complex-package添加
  (put 'project '(rectangular)
       (lambda (x) (make-rational (real-part-rectangular x) 1)))
  (put 'project '(polar)
       (lambda (x) (make-rational (real-part-polar x) 1)))
  (put 'project '(complex)
       (lambda (x) (apply-generic 'project x)))

; 最后测试
(add 1 (make-rational 3 2) 1 (make-complex-from-real-imag 1 1) 1)
(add 1 (make-rational 3 2) 1 (make-complex-from-real-imag 1 0) 1)
(add 1 2 (make-rational 3 2) 4 5)
(add 1 2 (make-rational 3 1) 4 5)
#|'(complex rectangular 11/2 . 1)
  '(rational 11 . 2)
  '(rational 27 . 2)
  15|#
```

## 2.86

同样从上面的代码修改，只有`scheme-number, rational, complex`. `scheme-number`当成整数.

很容易想到的思路，把`rational`和`complex`包里的运算都归约到`scheme-number`, 但工作量挺大的, 就改了个加法测试了一下. 但是调试可以看到`apply-generic`等过程做了大量没意义的操作，优化空间挺大的.

添加如sine等新运算就很简单了，略.

```racket
(define (apply-generic op . args)
  (let ((type-tags (map type-tag args)))
    (let ((proc (get op type-tags)))
      (if proc
          (if (ormap (lambda (x) (equal? op x)) '(add sub mul div))
              (drop (apply proc (map contents args)))
              (apply proc (map contents args))) ;防止死循环
          (letrec ((max-type (apply max (map type-level args)))
                   (result (foldl
                            (lambda (x y)
                              (apply-generic
                               op
                               (_raise x (- max-type (type-level x)))
                               y))
                            (apply-generic
                             op
                             (_raise (car args) (- max-type (type-level (car args))))
                             (_raise (cadr args) (- max-type (type-level (cadr args)))))
                            (cddr args))))
            (if (ormap (lambda (x) (equal? op x)) '(add sub mul div)) 
                (drop result) 
                result))))))

; rational-package
  (define (make-rat n d)
    (if (equal? (type-tag n) 'rational) 
        (cdr n)
        (let ((g (gcd n d)))
          (cons (apply-generic 'div n g) (apply-generic 'div d g)))))
  (define (add-rat x y)
    (make-rat (apply-generic 'add 
                             (apply-generic 'mul (numer x) (denom y))
                              (apply-generic 'mul (numer y) (denom x)))
              (apply-generic 'mul (denom x) (denom y))))
  (define (raise x)
    (make-complex-from-real-imag (apply-generic 'div (numer x) (denom x)) 0))
  (define (project x)
    (round (apply-generic 'div (numer x) (denom x))))

; complex-package
  (define (add-complex z1 z2)
    (make-from-real-imag (apply-generic 'add (real-part z1) (real-part z2))
                         (apply-generic 'add (imag-part z1) (imag-part z2))))
  (put 'equ? '(rectangular rectangular)
       (lambda (x y) (and (apply-generic 'equ? (real-part-rectangular x) (real-part-rectangular y))
                          (apply-generic 'equ? (imag-part-rectangular x) (imag-part-rectangular y)))))

; 测试
(add (make-complex-from-real-imag (make-rational 2 3) 0)
     (make-complex-from-real-imag 1 (make-rational 6 7)))
; '(complex rectangular (rational 5 . 3) rational 6 . 7)
```

## 2.5.3

实现多项式算术系统, 还有添加有理函数. 和之前一节练习的目的差不多, 不过是加强版.

因为练习的目的已经达到了, 而且时间吃紧, 所以这一节就放弃了.

[课程视频](https://www.bilibili.com/video/BV1Xx41117tr?p=8)上讲过多项式算术这一部分, 还是很精彩的.
