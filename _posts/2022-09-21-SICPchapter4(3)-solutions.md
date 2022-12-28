---
layout: post
title: "SICP第四章部分习题解答(三)"
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

4.3 Scheme的变形——非确定性计算

好像很有趣的一节.

## 4.35

根据书上的描述体会一下amb是怎么自动回溯的, 最好画个图

```racket
#lang sicp

(define (require p)
  (if (not p) (amb)))

(define (an-integer-starting-from n)
  (amb n (an-integer-starting-from (+ n 1))))

(define (test low)
  low)

(define (an-integer-between low high)  
   (require (<= low high))
   ; 三个选择点
   (amb low (an-integer-between (+ low 1) high) (test low)))

(an-integer-between 1 3) ; 1
(amb) ; 2
(amb) ; 3
(amb) ; 3
(amb) ; 2
(amb) ; 1
(amb) ; amb tree exhausted
```

```racket
; ex4.35
(define (an-integer-between low high)  
   (require (<= low high))
   (amb low (an-integer-between (+ low 1) high))) 

(define (a-pythagorean-triple-between low high)
  (let ((i (an-integer-between low high)))
    (let ((j (an-integer-between i high)))
      (let ((k (an-integer-between j high)))
        (require (= (+ (* i i) (* j j)) (* k k)))
        (list i j k)))))

(a-pythagorean-triple-between 1 10)
```

## 4.36

因为`an-integer-starting-from`里的选择点没有`require`限制, 有无穷多个, 所以直接用来代替`an-integer-between`会死循环.

```racket
(define (a-pythagorean-triple)
  (let ((i (an-integer-starting-from 1))) ; 1到无穷, 保证可以生成无穷多对
    (let ((j (an-integer-between 1 i))) ; 限制范围(选择点个数)
      (let ((k (an-integer-between j i))) ; 限制范围, 及防止 (3 4 5) (4 3 5) 这种重复
        (require (= (+ (* j j) (* k k)) (* i i)))
        (list j k i)))))

(a-pythagorean-triple)
(amb)
(amb)
(amb)
(amb)
(amb)
(amb)

#|
(3 4 5)
(6 8 10)
(5 12 13)
(9 12 15)
(8 15 17)
(12 16 20)
(7 24 25)
|#
```

## 4.38

中文版题目错误, 应为忽略而不是增加要求. (译者那个勘误表也不全, 前面有些错别字也没有...)

## 4.40

```racket
(define (distinct? items) ; O(n^2)
  (cond ((null? items) true)
        ((null? (cdr items)) true)
        ((member (car items) (cdr items)) false)
        (else (distinct? (cdr items)))))

(define (multiple-dwelling2)
  (let ((baker (amb 1 2 3 4 5))
        (cooper (amb 1 2 3 4 5))
        (fletcher (amb 1 2 3 4 5)))
    (require (not (= baker 5)))
    (require (not (= cooper 1)))
    (require (not (= fletcher 5)))
    (require (not (= fletcher 1)))
    (require (not (= (abs (- fletcher cooper)) 1)))
    (let ((miller (amb 1 2 3 4 5))
          (smith (amb 1 2 3 4 5)))
      (require (not (= (abs (- smith fletcher)) 1)))
      (require (> miller cooper))
      (require
        (distinct? (list baker cooper fletcher miller smith)))
      (list (list 'baker baker)
            (list 'cooper cooper)
            (list 'fletcher fletcher)
            (list 'miller miller)
            (list 'smith smith)))))
```

## 4.41

```racket
#lang sicp

(define (distinct? items)
  (cond ((null? items) true)
        ((null? (cdr items)) true)
        ((member (car items) (cdr items)) false)
        (else (distinct? (cdr items)))))

(define (check b c f m s)
  (if (and (not (= b 5))
           (not (= c 1))
           (not (= f 5))
           (not (= f 1))
           (> m c)
           (not (= (abs (- s f)) 1))
           (not (= (abs (- f c)) 1))
           (distinct? (list b c f m s)))
      true
      false))

(for-each
 (lambda (baker)
   (for-each
    (lambda (cooper)
      (for-each
       (lambda (fletcher)
         (for-each
          (lambda (miller)
            (for-each
             (lambda (smith)
               (if (check baker cooper fletcher miller smith)
                   (display
                    (list
                     (list 'baker baker)
                     (list 'cooper cooper)
                     (list 'fletcher fletcher)
                     (list 'miller miller)
                     (list 'smith smith)))))
             '(1 2 3 4 5)))
          '(1 2 3 4 5)))
       '(1 2 3 4 5)))
    '(1 2 3 4 5)))
 '(1 2 3 4 5))
```

## 4.42

```racket
#lang sicp

(define (require p)
  (if (not p) (amb)))

(define (distinct? items)
  (cond ((null? items) true)
        ((null? (cdr items)) true)
        ((member (car items) (cdr items)) false)
        (else (distinct? (cdr items)))))

; 保证一假一真
(define (xor p q)
  (and (or p q) (not (and p q))))

(define (liar)
  (let ((betty (amb 1 2 3 4 5))
        (ethel (amb 1 2 3 4 5))
        (joan (amb 1 2 3 4 5))
        (kitty (amb 1 2 3 4 5))
        (mary (amb 1 2 3 4 5)))
    (require (xor (= 2 kitty) (= 3 betty)))
    (require (xor (= 1 ethel) (= 2 joan)))
    (require (xor (= 3 joan) (= 5 ethel)))
    (require (xor (= 2 kitty) (= 4 mary)))
    (require (xor (= 4 mary) (= 1 betty)))
    (require (distinct? (list betty ethel joan kitty mary)))
    (list (list 'betty betty)
          (list 'ethel ethel)
          (list 'joan joan)
          (list 'kitty kitty)
          (list 'mary mary))))

(liar)
; ((betty 3) (ethel 5) (joan 2) (kitty 1) (mary 4))
```

## 4.43

转换下形式就很直观了.

先列表, 把人名都对应到数字:

||||||
:-:|:-:|:-:|:-:|:-:|
moore|barnacle|colonel|hall|parker
1|2|3|4|5

||||||
:-:|:-:|:-:|:-:|:-:|
mary|melissa|lorna|gabrielle|rosalind
1|2|3|4|5

设父女关系为`f(x)`, 由题目可知mary的爹是moore, melissa的爹是barnacle, 于是有`f(1)=1, f(2)=2`, 而`f(3), f(4), f(5)`未知.

设人和船名的关系为`g(x)`, 于是有`g(1)=3, g(2)=4, g(3)=2, g(4)=5`, 显然必有`g(5)=1`.

因为船名都不是自己女儿的名字, 所以有`f(x)=/=g(x), x in {1,2,3,4,5}`

因为gabrielle的父亲船的名字是parker的女儿的名字, 所以有`当f(x)=4时g(x)=f(5), x in {1,2,3,4,5}`.

```racket
#lang sicp

(define (require p)
  (if (not p) (amb)))

(define (distinct? items)
  (cond ((null? items) true)
        ((null? (cdr items)) true)
        ((member (car items) (cdr items)) false)
        (else (distinct? (cdr items)))))

(define (g x)
  (cond ((= x 1) 3)
        ((= x 2) 4)
        ((= x 3) 2)
        ((= x 4) 5)
        ((= x 5) 1)))

(define f3 0)
(define f4 0)
(define f5 0)

(define (f x)
  (cond ((= x 1) 1)
        ((= x 2) 2)
        ((= x 3) f3)
        ((= x 4) f4)
        ((= x 5) f5)))

(define (solver)
  (let ((i (amb 3 4 5)))
    (set! f3 i)
    (let ((j (amb 3 4 5)))
      (set! f4 j)
      (let ((k (amb 3 4 5)))
        (set! f5 k)
        (require (distinct? (list i j k)))
        (map (lambda (x) (require (not (= (f x) (g x))))) '(1 2 3 4 5))
        (cond ((= f3 4)
               (require (= (f 5) (g 3))))
              ((= f4 4)
               (require (= (f 5) (g 4))))
              ((= f5 4)
               (require (= (f 5) (g 5)))))
        (map f '(1 2 3 4 5))))))

(solver)
```

可得lorna的爹是colonel.

第二问, 如果不知道`mary`的爹是谁, 可以得到两个解:

```racket
#lang sicp

(define (require p)
  (if (not p) (amb)))

(define (distinct? items)
  (cond ((null? items) true)
        ((null? (cdr items)) true)
        ((member (car items) (cdr items)) false)
        (else (distinct? (cdr items)))))

(define (g x)
  (cond ((= x 1) 3)
        ((= x 2) 4)
        ((= x 3) 2)
        ((= x 4) 5)
        ((= x 5) 1)))

(define f1 0)
(define f3 0)
(define f4 0)
(define f5 0)

(define (f x)
  (cond ((= x 1) f1)
        ((= x 2) 2)
        ((= x 3) f3)
        ((= x 4) f4)
        ((= x 5) f5)))

(define (solver)
  (let ((l (amb 1 3 4 5)))
    (set! f1 l)
    (let ((i (amb 1 3 4 5)))
      (set! f3 i)
      (let ((j (amb 1 3 4 5)))
        (set! f4 j)
        (let ((k (amb 1 3 4 5)))
          (set! f5 k)
          (require (distinct? (list l i j k)))
          (map (lambda (x) (require (not (= (f x) (g x))))) '(1 2 3 4 5))
          (cond ((= f1 4)
                 (require (= (f 5) (g 1))))
                ((= f3 4)
                 (require (= (f 5) (g 3))))
                ((= f4 4)
                 (require (= (f 5) (g 4))))
                ((= f5 4)
                 (require (= (f 5) (g 5)))))
          (map f '(1 2 3 4 5)))))))

(solver)
(amb)
(amb)
; (1 2 3 4 5)
; (4 2 5 1 3)
; amb tree exhausted
```

## 4.44

```racket
#lang sicp

(define (require p)
  (if (not p) (amb)))

(define (distinct? items)
  (cond ((null? items) true)
        ((null? (cdr items)) true)
        ((member (car items) (cdr items)) false)
        (else (distinct? (cdr items)))))

(define (filter pred lst)
  (cond ((null? lst) '())
        ((pred (car lst))
         (cons (car lst)
               (filter pred (cdr lst))))
        (else (filter pred (cdr lst)))))

(define (accumulate op initial sequence)
  (if (null? sequence)
      initial
      (op (car sequence)
          (accumulate op initial (cdr sequence)))))

(define (flatmap proc seq)
  (accumulate append nil (map proc seq)))

(define (an-integer-between low high)
  (require (<= low high))
  (amb low (an-integer-between (+ low 1) high)))

(define (queens board-size)
  (define empty-board '())

  (define (safe? k positions)
    (define (row-col-check obj)
      (lambda (p) (or (= (car p) (car obj))
                      (= (cadr p) (cadr obj)))))
    (define (diag-check obj)
      (lambda (p) (and (not (equal? obj p))
                       (= 1 (abs (/ (- (car obj) (car p)) (- (cadr obj) (cadr p))))))))
    (let ((obj (car (filter (lambda (p) (= (cadr p) k)) positions))))
      (and (= 1 (length (filter (row-col-check obj) positions)))
           (= 0 (length (filter (diag-check obj) positions))))))

  (define (adjoin-position new-row k rest-of-queens)
    (cons (list new-row k) rest-of-queens))

  (define (queen-cols k)
    (if (= k 0)
        (list empty-board)
        (filter
         (lambda (positions) (require (safe? k positions)))
         (flatmap
          (lambda (rest-of-queens)
            (let ((new-row (an-integer-between 1 board-size)))
              (list (adjoin-position new-row k rest-of-queens))))
          (queen-cols (- k 1))))))
    (queen-cols board-size))

(queens 8)
(amb)
(amb)
```

## 4.50

不超出sicp范围内的一个简单暴力低效率的方法.

```racket
; ex4.50
; analyze分支添加 ((ramb? exp) (analyze-ramb exp))

(define (ramb? exp) (tagged-list? exp 'ramb))

(define (analyze-ramb exp)
  (let* ((cprocs (map analyze (amb-choices exp)))
         (len (length cprocs)))
    (lambda (env succeed fail)
      (define (random-next choices stk len)
        (define (random-index len)
          (define (get)
            (let ((r (random len)))
              (cond ((= len (length stk)) (error "RANDOM-INDEX"))
                    ((memq r stk) (get))
                    (else (set! stk (cons r stk))
                          r))))
          (get))
        (if (= len (length stk))
            (fail)
            ((list-ref choices (random-index len))
             env
             succeed
             (lambda ()
               (random-next choices stk len)))))
      (random-next cprocs '() len))))
```

## 4.51

```racket
; analyze分支添加 ((permanent-set? exp) (analyze-permanent-set exp))

(define (permanent-set? exp) (tagged-list? exp 'permanent-set!))

(define (analyze-permanent-set exp)
  (let ((var (assignment-variable exp))
        (vproc (analyze (assignment-value exp))))
    (lambda (env succeed fail)
      (vproc env
             (lambda (val fail2)
               (set-variable-value! var val env)
               (succeed 'ok fail2))
             fail))))
```

## 4.52

```racket
; analyze分支添加 ((if-fail? exp) (analyze-if-fail exp))
(define (if-fail? exp) (tagged-list? exp 'if-fail))

(define (if-fail-1st exp) (cadr exp))
(define (if-fail-2nd exp) (caddr exp))

(define (analyze-if-fail exp)
  (let ((cproc (analyze (if-fail-1st exp)))
        (aproc (analyze (if-fail-2nd exp))))
    (lambda (env succeed fail)
      (cproc env
             (lambda (value fail2) 
               (succeed value fail2))
             (aproc env 
                    (lambda (val fail) 
                      (lambda () (succeed val fail))) 
                    fail)))))
; (if-fail (let ((x (an-element-of '(1 3 5)))) (require (even? x)) x) 'all-odd)
```

实际上就是

```racket
(define (analyze-if-fail exp)
  (let ((cproc (analyze (if-fail-1st exp)))
        (aproc (analyze (if-fail-2nd exp))))
    (lambda (env succeed fail)
      (cproc env
             succeed
             (lambda () (aproc env succeed fail))))))
```

直接执行`(if-fail (let ((x (an-element-of '(1 3 5 8)))) (require (even? x)) x) 'all-odd)`时它的成功继续是`driver-loop`里的那个. 失败继续必须是一个无参过程.

## 4.54

```racket
(define (analyze-require exp)
  (let ((pproc (analyze (require-predicate exp))))
    (lambda (env succeed fail)
      (pproc env
             (lambda (pred-value fail2)
               (if (not (true? pred-value))
                   (fail2)
                   (succeed 'ok fail2)))
             fail))))
```

## 本节amb求值器完整代码

```racket
#lang sicp

(define apply-in-underlying-scheme apply)

(define (enclosing-environment env) (cdr env))

(define (first-frame env) (car env))

(define the-empty-environment '())

(define (make-frame variables values)
  (cons variables values))

(define (frame-variables frame) (car frame))

(define (frame-values frame) (cdr frame))

(define (add-binding-to-frame! var val frame)
  (set-car! frame (cons var (car frame)))
  (set-cdr! frame (cons val (cdr frame))))

(define (extend-environment vars vals base-env)
  (if (= (length vars) (length vals))
      (cons (make-frame vars vals) base-env)
      (if (< (length vars) (length vals))
          (error "Too many arguments supplied" vars vals)
          (error "Too few arguments supplied" vars vals))))

(define (lookup-variable-value var env)
  (define (env-loop env)
    (define (scan vars vals)
      (cond ((null? vars)
             (env-loop (enclosing-environment env)))
            ((eq? var (car vars))
             (if (eq? (car vals) '*unassigned*)
                 (error "ERROR *UNASSIGNED VARIABLE*" var)
                 (car vals)))
            (else (scan (cdr vars) (cdr vals)))))
    (if (eq? env the-empty-environment)
        (error "Unbound variable" var)
        (let ((frame (first-frame env)))
          (scan (frame-variables frame)
                (frame-values frame)))))
  (env-loop env))

(define (set-variable-value! var val env)
  (define (env-loop env)
    (define (scan vars vals)
      (cond ((null? vars)
             (env-loop (enclosing-environment env)))
            ((eq? var (car vars))
             (set-car! vals val))
            (else (scan (cdr vars) (cdr vals)))))
    (if (eq? env the-empty-environment)
        (error "Unbound variable -- SET!" var)
        (let ((frame (first-frame env)))
          (scan (frame-variables frame)
                (frame-values frame)))))
  (env-loop env))

(define (define-variable! var val env)
  (let ((frame (first-frame env)))
    (define (scan vars vals)
      (cond ((null? vars)
             (add-binding-to-frame! var val frame))
            ((eq? var (car vars))
             (set-car! vals val))
            (else (scan (cdr vars) (cdr vals)))))
    (scan (frame-variables frame)
          (frame-values frame))))

;;

(define (setup-environment)
  (let ((initial-env
         (extend-environment (primitive-procedure-names)
                             (primitive-procedure-objects)
                             the-empty-environment)))
    (define-variable! 'true true initial-env)
    (define-variable! 'false false initial-env)
    initial-env))

(define (primitive-procedure? proc)
  (tagged-list? proc 'primitive))

(define (primitive-implementation proc) (cadr proc))

(define primitive-procedures
  (list (list 'car car)
        (list 'cdr cdr)
        (list 'cons cons)
        (list 'null? null?)
        ; other primitive procedures ...
        (list '+ +)
        (list '* *)
        (list '= =)
        (list '- -)
        (list '<= <=)
        (list 'not not)
        (list 'list list)
        (list 'eq? eq?)
        (list '% modulo)))

(define (primitive-procedure-names)
  (map car primitive-procedures))

(define (primitive-procedure-objects)
  (map (lambda (proc) (list 'primitive (cadr proc)))
       primitive-procedures))

(define (apply-primitive-procedure proc args)
  (apply-in-underlying-scheme
   (primitive-implementation proc) args))

;;

(define (make-procedure parameters body env)
  (list 'procedure parameters body env))

(define (compound-procedure? p)
  (tagged-list? p 'procedure))

(define (procedure-body p) (caddr p))

(define (procedure-parameters p) (cadr p))

(define (procedure-environment p) (cadddr p))

(define (true? x)
  (not (eq? x false)))

(define (false? x)
  (eq? x false))

(define (self-evaluating? exp)
  (cond ((number? exp) true)
        ((string? exp) true)
        (else false)))

(define (variable? exp) (symbol? exp))

(define (quoted? exp)
  (tagged-list? exp 'quote))
(define (text-of-quotation exp) (cadr exp))

(define (tagged-list? exp tag)
  (if (pair? exp)
      (eq? (car exp) tag)
      false))

(define (assignment? exp) (tagged-list? exp 'set!))
(define (assignment-variable exp) (cadr exp))
(define (assignment-value exp) (caddr exp))

(define (definition? exp)
  (tagged-list? exp 'define))

(define (definition-variable exp)
  (if (symbol? (cadr exp))
      (cadr exp)
      (caadr exp)))

(define (definition-value exp)
  (if (symbol? (cadr exp))
      (caddr exp)
      (make-lambda (cdadr exp)
                   (cddr exp))))

(define (lambda? exp) (tagged-list? exp 'lambda))
(define (lambda-parameters exp) (cadr exp))
(define (lambda-body exp) (cddr exp))

(define (make-lambda parameters body)
  (cons 'lambda (cons parameters body)))

(define (if? exp) (tagged-list? exp 'if))

(define (if-predicate exp) (cadr exp))
(define (if-consequent exp) (caddr exp))
(define (if-alternative exp)
  (if (not (null? (cdddr exp)))
      (cadddr exp)
      'false))

(define (make-if predicate consequent alternative)
  (list 'if predicate consequent alternative))

(define (begin? exp) (tagged-list? exp 'begin))
(define (begin-actions exp) (cdr exp))
(define (last-exp? seq) (null? (cdr seq)))
(define (first-exp seq) (car seq))
(define (rest-exps seq) (cdr seq))

(define (make-begin seq) (cons 'begin seq))

(define (sequence->exp seq)
  (cond ((null? seq) seq)
        ((last-exp? seq) (first-exp seq))
        (else (make-begin seq))))

(define (application? exp) (pair? exp))
(define (operator exp) (car exp))
(define (operands exp) (cdr exp))
(define (no-operands? ops) (null? ops))
(define (first-operand ops) (car ops))
(define (rest-operands ops) (cdr ops))

(define (cond? exp) (tagged-list? exp 'cond))
(define (cond-clauses exp) (cdr exp))

(define (cond-else-clause? clause)
  (eq? (cond-predicate clause) 'else))

(define (cond-predicate clause) (car clause))
(define (cond-actions clause) (cdr clause))

(define (cond->if exp)
  (expand-clauses (cond-clauses exp)))

(define (expand-clauses clauses)
  (if (null? clauses)
      'false ; clause else no
      (let ((first (car clauses))
            (rest (cdr clauses)))
        (if (cond-else-clause? first)
            (if (null? rest)
                (sequence->exp (cond-actions first))
                (error "ELSE clause isn't last -- COND->IF"
                       clauses))
            (if (eq? (car (cond-actions first)) '=>)
                (let ((recipient (cadr (cond-actions first))))
                  (list (make-lambda
                         '(__@ImplyRes)
                         (list
                          (make-if '__@ImplyRes
                                   (list recipient '__@ImplyRes)
                                   (expand-clauses rest))))
                        (cond-predicate first)))
                (make-if (cond-predicate first)
                         (sequence->exp (cond-actions first))
                         (expand-clauses rest)))))))

(define (let? exp) (tagged-list? exp 'let))

(define (let-bindings exp) (cadr exp))

(define (let-body exp) (cddr exp))

(define (let->combination exp)
  (let ((bindings (let-bindings exp)))
    (cons (make-lambda (map car bindings)
                       (let-body exp))
          (map cadr bindings))))

(define (make-let bindings body)
  (cons 'let (cons bindings body)))

;; AMB

(define (amb? exp) (tagged-list? exp 'amb))

(define (amb-choices exp) (cdr exp))

(define (ambeval exp env succeed fail)
  ((analyze exp) env succeed fail))

(define (analyze exp)
  (cond ((self-evaluating? exp)
         (analyze-self-evaluating exp))
        ((quoted? exp) (analyze-quoted exp))
        ((variable? exp) (analyze-variable exp))
        ((assignment? exp) (analyze-assignment exp))
        ((permanent-set? exp) (analyze-permanent-set exp))
        ((definition? exp) (analyze-definition exp))
        ((require? exp) (analyze-require exp))
        ((if? exp) (analyze-if exp))
        ((if-fail? exp) (analyze-if-fail exp))
        ((lambda? exp) (analyze-lambda exp))
        ((begin? exp) (analyze-sequence (begin-actions exp)))
        ((cond? exp) (analyze (cond->if exp)))
        ((let? exp) (analyze (let->combination exp)))
        ((amb? exp) (analyze-amb exp))
        ((ramb? exp) (analyze-ramb exp))
        ((application? exp) (analyze-application exp))
        (else
         (error "Unknown expression type -- ANALYZE" exp))))

(define (analyze-self-evaluating exp)
  (lambda (env succeed fail)
    (succeed exp fail)))

(define (analyze-quoted exp)
  (let ((qval (text-of-quotation exp)))
    (lambda (env succeed fail)
      (succeed qval fail))))

(define (analyze-variable exp)
  (lambda (env succeed fail)
    (succeed (lookup-variable-value exp env) fail)))

(define (analyze-assignment exp)
  (let ((var (assignment-variable exp))
        (vproc (analyze (assignment-value exp))))
    (lambda (env succeed fail)
      (vproc env
             (lambda (val fail2)
               (let ((old-value
                      (lookup-variable-value var env)))
                 (set-variable-value! var val env)
                 (succeed 'ok
                          (lambda ()
                            (set-variable-value! var
                                                 old-value
                                                 env)
                            (fail2)))))
             fail))))

(define (analyze-definition exp)
  (let ((var (definition-variable exp))
        (vproc (analyze (definition-value exp))))
    (lambda (env succeed fail)
      (vproc env
             (lambda (val fail2)
               (define-variable! var val env)
               (succeed 'ok fail2))
             fail))))

(define (analyze-if exp)
  (let ((pproc (analyze (if-predicate exp)))
        (cproc (analyze (if-consequent exp)))
        (aproc (analyze (if-alternative exp))))
    (lambda (env succeed fail)
      (pproc env
             (lambda (pred-value fail2)
               (if (true? pred-value)
                   (cproc env succeed fail2)
                   (aproc env succeed fail2)))
             fail))))

(define (analyze-lambda exp)
  (let ((vars (lambda-parameters exp))
        (bproc (analyze-sequence (lambda-body exp))))
    (lambda (env succeed fail)
      (succeed (make-procedure vars bproc env) fail))))

(define (analyze-sequence exps)
  (define (sequentially a b)
    (lambda (env succeed fail)
      (a env
         (lambda (a-value fail2)
           (b env succeed fail2))
         fail)))
  (define (loop first-proc rest-procs)
    (if (null? rest-procs)
        first-proc
        (loop (sequentially first-proc (car rest-procs))
              (cdr rest-procs))))
  (let ((procs (map analyze exps)))
    (if (null? procs)
        (error "Empty sequence -- ANALYZE"))
    (loop (car procs) (cdr procs))))

(define (analyze-application exp)
  (let ((fproc (analyze (operator exp)))
        (aprocs (map analyze (operands exp))))
    (lambda (env succeed fail)
      (fproc env
             (lambda (proc fail2)
               (get-args aprocs
                         env
                         (lambda (args fail3)
                           (execute-application
                            proc args succeed fail3))
                         fail2))
             fail))))

(define (get-args aprocs env succeed fail)
  (if (null? aprocs)
      (succeed '() fail)
      ((car aprocs) env
                    (lambda (arg fail2)
                      (get-args (cdr aprocs)
                                env
                                (lambda (args fail3)
                                  (succeed (cons arg args)
                                           fail3))
                                fail2))
                    fail)))

(define (execute-application proc args succeed fail)
  (cond ((primitive-procedure? proc)
         (succeed (apply-primitive-procedure proc args)
                  fail))
        ((compound-procedure? proc)
         ((procedure-body proc)
          (extend-environment (procedure-parameters proc)
                              args
                              (procedure-environment proc))
          succeed
          fail))
        (else
         (error "Unknown procedure type -- EXECUTE-APPLICATION" proc))))

(define (analyze-amb exp)
  (let ((cprocs (map analyze (amb-choices exp))))
    (lambda (env succeed fail)
      (define (try-next choices)
        (if (null? choices)
            (fail)
            ((car choices) env
                           succeed
                           (lambda ()
                             (try-next (cdr choices))))))
      (try-next cprocs))))

(define (ramb? exp) (tagged-list? exp 'ramb))

; ex4.50
(define (analyze-ramb exp)
  (let* ((cprocs (map analyze (amb-choices exp)))
         (len (length cprocs)))
    (lambda (env succeed fail)
      (define (random-next choices stk len)
        (define (random-index len)
          (define (get)
            (let ((r (random len)))
              (cond ((= len (length stk)) (error "RANDOM-INDEX"))
                    ((memq r stk) (get))
                    (else (set! stk (cons r stk))
                          r))))
          (get))
        (if (= len (length stk))
            (fail)
            ((list-ref choices (random-index len))
             env
             succeed
             (lambda ()
               (random-next choices stk len)))))
      (random-next cprocs '() len))))

; ex4.51
(define (permanent-set? exp) (tagged-list? exp 'permanent-set!))

(define (analyze-permanent-set exp)
  (let ((var (assignment-variable exp))
        (vproc (analyze (assignment-value exp))))
    (lambda (env succeed fail)
      (vproc env
             (lambda (val fail2)
               (set-variable-value! var val env)
               (succeed 'ok fail2))
             fail))))

; ex4.52

(define (if-fail? exp) (tagged-list? exp 'if-fail))

(define (if-fail-1st exp) (cadr exp))
(define (if-fail-2nd exp) (caddr exp))

(define (analyze-if-fail exp)
  (let ((cproc (analyze (if-fail-1st exp)))
        (aproc (analyze (if-fail-2nd exp))))
    (lambda (env succeed fail)
      (cproc env
             succeed
             (lambda () (aproc env succeed fail))))))
; (if-fail (let ((x (an-element-of '(1 3 5)))) (require (even? x)) x) 'all-odd)

; ex 4.54

(define (require? exp) (tagged-list? exp 'require))
(define (require-predicate exp) (cadr exp))

(define (analyze-require exp)
  (let ((pproc (analyze (require-predicate exp))))
    (lambda (env succeed fail)
      (pproc env
             (lambda (pred-value fail2)
               (if (not (true? pred-value))
                   (fail2)
                   (succeed 'ok fail2)))
             fail))))

;;

(define input-prompt ";;; Amb-Eval input:")
(define output-prompt ";;; Amb-Eval value:")

(define (driver-loop)
  (define (internal-loop try-again)
    (prompt-for-input input-prompt)
    (let ((input (read)))
      (if (eq? input 'try-again)
          (try-again)
          (begin
            (newline)
            (display ";;; Starting a new problem ")
            (ambeval input
                     the-global-environment
                     (lambda (val next-alternative)
                       (announce-output output-prompt)
                       (user-print val)
                       (internal-loop next-alternative))
                     (lambda ()
                       (announce-output
                        ";;; There are no more values of")
                       (user-print input)
                       (driver-loop)))))))
  (internal-loop
   (lambda ()
     (newline)
     (display ";;; There is no current problem")
     (driver-loop))))

(define (prompt-for-input string)
  (newline) (newline) (display string) (newline))

(define (announce-output string)
  (newline) (display string) (newline))

(define (user-print object)
  (if (compound-procedure? object)
      (display (list 'compound-procedure
                     (procedure-parameters object)
                     (procedure-body object)
                     ;(procedure-environment object)
                     ))
      (display object)))

(define the-global-environment (setup-environment))

;(ambeval '(define (require p) (if (not p) (amb)))
;         the-global-environment (lambda (a b) 'succ) (lambda () 'fail))

(ambeval '(define (an-integer-starting-from n)
            (amb n (an-integer-starting-from (+ n 1))))
         the-global-environment (lambda (a b) 'succ) (lambda () 'fail))

(ambeval '(define (an-random-integer-between low high)
            (require (<= low high))
            (ramb low (an-random-integer-between (+ low 1) high)))
         the-global-environment (lambda (a b) 'succ) (lambda () 'fail))

(ambeval '(define (an-integer-between low high)
            (require (<= low high))
            (amb low (an-integer-between (+ low 1) high)))
         the-global-environment (lambda (a b) 'succ) (lambda () 'fail))

(ambeval '(define (an-element-of items)
            (require (not (null? items)))
            (amb (car items) (an-element-of (cdr items))))
         the-global-environment (lambda (a b) 'succ) (lambda () 'fail))

(ambeval '(define (even? a) (= 0 (% a 2))) 
         the-global-environment (lambda (a b) 'succ) (lambda () 'fail))

(driver-loop)
```

因为时间安排上的问题, 需要暂停SICP一段时间, 希望今年有机会看完QAQ.
