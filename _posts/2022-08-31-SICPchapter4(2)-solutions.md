---
layout: post
title: "SICP第四章部分习题解答(二)"
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

4.2 Scheme的变形——惰性求值

---

## 4.31

简单修改测试了一下, 比较随便.

```racket
(define primitive-procedure
  (list (list 'car car)
        (list 'cdr cdr)
        (list 'cons cons)
        (list 'null? null?)
        ; other primitive procedures ...
        (list '+ +)
        (list '* *)
        (list '= =)
        (list '- -)
        (list '/ /)
        ))

(define (applyx procedure arguments env)
  (cond ((primitive-procedure? procedure)
         (apply-primitive-procedure
          procedure
          (list-of-arg-values arguments env)))
        ((compound-procedure? procedure)
         (eval-sequence
          (procedure-body procedure)
          (let ((parameters (procedure-parameters procedure)))
            (extend-environment
             (map (lambda (x) (if (pair? x) (car x) x))
                  parameters)
             (list-of-delayed-args
              arguments
              (map (lambda (x)
                     (cond ((pair? x) (if (eq? 'lazy (cadr x)) 2 1))
                           (else 0))) parameters)
              env)
             (procedure-environment procedure)))))
        (else
         (error "Unknown procedure type -- APPLY" procedure))))

(define (list-of-delayed-args exps flags env)
  (if (no-operands? exps)
      '()
      (cons (cond  ((= (car flags) 0)
                    (eval (first-operand exps) env))
                   ((= (car flags) 1)
                    (delay-it (first-operand exps) env 1))
                   ((= (car flags) 2)
                    (delay-it (first-operand exps) env 2)))
            (list-of-delayed-args (rest-operands exps)
                                  (cdr flags)
                                  env))))

(define (delay-it exp env flag)
  (if (= flag 1) 
      (list 'thunk-memo exp env) 
      (list 'thunk exp env)))

(define (thunk-memo? obj)
  (tagged-list? obj 'thunk-memo))

(define (force-it obj)
  (cond ((thunk-memo? obj)
         (let ((result (actual-value (thunk-exp obj)
                                     (thunk-env obj))))
           (set-car! obj 'evaluated-thunk)
           (set-car! (cdr obj) result)
           (set-cdr! (cdr obj) '()) ; 删除env
           result))
        ((thunk? obj)
          (actual-value (thunk-exp obj)
                        (thunk-env obj)))
        ((evaluated-thunk? obj)
         (thunk-value obj))
        (else obj)))

(define (xeval exp)
  (eval exp the-global-environment))

;(xeval '(define (try a b) (if (= a 0) 1 b)))
;(xeval '(try 0 (/ 1 0))) 报错

(xeval '(define (try a (b lazy)) (if (= a 0) 1 b)))
(xeval '(try 0 (/ 1 0)))

(newline)
(xeval '(define cnt1 0))
(xeval '(define (test1 (x lazy-memo)) (set! cnt1 (+ cnt1 1)) x))
(xeval '(define q (test1 (test1 233))))
(newline)

(xeval '(+ q 0))
(xeval 'cnt1)
(xeval '(+ q 0))
(xeval 'cnt1)
(xeval '(+ q 0))
(xeval 'cnt1) ; 不变

(newline)
(xeval '(define cnt2 0))
(xeval '(define (test2 (x lazy)) (set! cnt2 (+ cnt2 1)) x))
(xeval '(define w (test2 (test2 233))))
(newline)

(xeval '(+ w 0))
(xeval 'cnt2)
(xeval '(+ w 0))
(xeval 'cnt2)
(xeval '(+ w 0))
(xeval 'cnt2) ; 每次访问w后加1
```

---

使用练习31之前书上描述的求值器, 加上新的`cons, car, cdr`.

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

(define primitive-procedure
  (list (list 'car car)
        (list 'cdr cdr)
        (list 'cons cons)
        (list 'null? null?)
        ; other primitive procedures ...
        (list '+ +)
        (list '* *)
        (list '= =)
        (list '- -)
        (list 'list list)))

(define (primitive-procedure-names)
  (map car primitive-procedure))

(define (primitive-procedure-objects)
  (map (lambda (proc) (list 'primitive (cadr proc)))
       primitive-procedure))

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

;;

(define (eval exp env)
  (cond ((self-evaluating? exp) exp)
        ((variable? exp) (lookup-variable-value exp env))
        ((quoted? exp) (text-of-quotation exp))
        ((assignment? exp) (eval-assignment exp env))
        ((definition? exp) (eval-definition exp env))
        ((if? exp) (eval-if exp env))
        ((lambda? exp)
         (make-procedure (lambda-parameters exp)
                         (lambda-body exp)
                         env))
        ((begin? exp)
         (eval-sequence (begin-actions exp) env))
        ((cond? exp) (eval (cond->if exp) env))
        ((application? exp)
         (applyx (actual-value (operator exp) env)
                 (operands exp)
                 env))
        (else
         (error "Unknown expression type -- EVAL" exp))))

(define (applyx procedure arguments env)
  (cond ((primitive-procedure? procedure)
         (apply-primitive-procedure
          procedure
          (list-of-arg-values arguments env)))
        ((compound-procedure? procedure)
         (eval-sequence
          (procedure-body procedure)
          (extend-environment
           (procedure-parameters procedure)
           (list-of-delayed-args arguments env)
           (procedure-environment procedure))))
        (else
         (error "Unknown procedure type -- APPLY" procedure))))

(define (actual-value exp env)
  (force-it (eval exp env)))

;;

(define (list-of-arg-values exps env)
  (if (no-operands? exps)
      '()
      (cons (actual-value (first-operand exps) env)
            (list-of-arg-values (rest-operands exps)
                                env))))

(define (list-of-delayed-args exps env)
  (if (no-operands? exps)
      '()
      (cons (delay-it (first-operand exps) env)
            (list-of-delayed-args (rest-operands exps)
                                  env))))

(define (delay-it exp env)
  (list 'thunk exp env))

(define (thunk? obj)
  (tagged-list? obj 'thunk))

(define (thunk-exp thunk) (cadr thunk))
(define (thunk-env thunk) (caddr thunk))

(define (evaluated-thunk? obj)
  (tagged-list? obj 'evaluated-thunk))

(define (thunk-value evaluated-thunk) (cadr evaluated-thunk))

(define (force-it obj)
  (cond ((thunk? obj)
         (let ((result (actual-value (thunk-exp obj)
                                     (thunk-env obj))))
           (set-car! obj 'evaluated-thunk)
           (set-car! (cdr obj) result)
           (set-cdr! (cdr obj) '()) ; 删除env
           result))
        ((evaluated-thunk? obj)
         (thunk-value obj))
        (else obj)))

;;

(define (eval-if exp env)
  (if (true? (actual-value (if-predicate exp) env))
      (eval (if-consequent exp) env)
      (eval (if-alternative exp) env)))

(define (eval-sequence exps env)
  (cond ((last-exp? exps) (eval (first-exp exps) env))
        (else (eval (first-exp exps) env)
              (eval-sequence (rest-exps exps) env))))

(define (eval-assignment exp env)
  (set-variable-value! (assignment-variable exp)
                       (eval (assignment-value exp) env)
                       env)
  'ok)

(define (eval-definition exp env)
  (define-variable! (definition-variable exp)
    (eval (definition-value exp) env)
    env)
  'ok)

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

;;

(define input-prompt ";;; L-Eval input:")
(define output-prompt ";;; L-Eval value:")

(define (driver-loop)
  (prompt-for-input input-prompt)
  (let ((input (read)))
    (let ((output (actual-value input the-global-environment)))
      (announce-output output-prompt)
      (user-print output)))
  (driver-loop))

(define (prompt-for-input string)
  (newline) (newline) (display string) (newline))

(define (announce-output string)
  (newline) (display string) (newline))

(define (user-print object)
  (if (compound-procedure? object)
      (display (list 'compound-procedure
                     (procedure-parameters object)
                     (procedure-body object)
                     (procedure-environment object)))
      (display object)))

(define the-global-environment (setup-environment))

(define (xeval exp) (actual-value exp the-global-environment))

(xeval '(define (cons x y)
         (lambda (m) (m x y))))

(xeval '(define (car z) (z (lambda (p q) p))))
(xeval '(define (cdr z) (z (lambda (p q) q))))

(xeval '(define (list-ref items n)
         (if (= n 0)
             (car items)
             (list-ref (cdr items) (- n 1)))))

(xeval '(define (map proc items)
          (if (null? items)
              '()
              (cons (proc (car items))
                    (map proc (cdr items))))))

(xeval '(define (scale-list items factor)
          (map (lambda (x) (* x factor)) items)))

(xeval '(define (add-lists list1 list2)
          (cond ((null? list1) list2)
                ((null? list2) list1)
                (else (cons (+ (car list1) (car list2))
                            (add-lists (cdr list1) (cdr list2)))))))

(xeval '(define ones (cons 1 ones)))

(xeval '(define integers (cons 1 (add-lists ones integers))))

(xeval '(list-ref integers 17))

;(driver-loop)
```

## 4.32

主要特性在于`cons`两个参数都是惰性的.

于是练习3.68原本会死循环的程序在这个求值器里就可以用了.

```racket
(xeval '(define (interleave s1 s2)
          (if (null? s1)
              s2
              (cons (car s1)
                    (interleave s2 (cdr s1))))))

(xeval '(define (pairs s t)
          (interleave
           (map (lambda (x) (list (car s) x))
                t)
           (pairs (cdr s) (cdr t)))))

(xeval '(define t (pairs integers integers)))

(map (lambda (x) (xeval (list 'list-ref 't x))) '(0 1 2 3 4 5 6 7 8 9 10))
```

## 4.33

很快就能想到的一种方式, 利用`cons`转换成派生表达式:

```racket
; 修改eval引号分支
        ((quoted? exp) (text-of-quotation exp env))

; 修改text-of-quotation
(define (text-of-quotation exp env) 
  (if (pair? (cadr exp))
      (eval (quoted-lst->cons (cadr exp)) env)
      (cadr exp)))

(define (quoted-lst->cons lst)
  (if (null? lst)
      (list 'quote '())
      (list 'cons (list 'quote (car lst)) (quoted-lst->cons (cdr lst)))))

(xeval '(car '(a b c)))
(xeval '(cdr '(d)))
```

## 4.34

方式有很多, 简单的比如就只提示是一个表或者只输出前几个元素.

```racket
有点累, 暂时不做了.
```
