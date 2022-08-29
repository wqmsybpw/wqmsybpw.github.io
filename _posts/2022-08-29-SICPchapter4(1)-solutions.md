---
layout: post
title: "SICP第四章部分习题解答(一)"
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

## 4.1

```racket
#lang sicp

(define (no-operands? ops) (null? ops))
(define (first-operand ops) (car ops))
(define (rest-operands ops) (cdr ops))

(define (eval exp env)
  (display exp) (newline)
  exp)

(define (list-of-values exps env)
  (if (no-operands? exps)
      '()
      (cons (eval (first-operand exps) env)
            (list-of-values (rest-operands exps) env))))

(define (list-of-values-lr exps env)
  (let ((res (cons 'left 'right)))
    (if (no-operands? exps)
        '()
        (begin
          (set-car! res (eval (first-operand exps) env))
          (set-cdr! res (list-of-values-lr (rest-operands exps) env))
          res))))

(define (list-of-values-rl exps env)
  (let ((res (cons 'left 'right)))
    (if (no-operands? exps)
        '()
        (begin
          (set-cdr! res (list-of-values-rl (rest-operands exps) env))
          (set-car! res (eval (first-operand exps) env))
          res))))

(list-of-values '(1 2 3) '())
(list-of-values-rl '(1 2 3) '())
(list-of-values-lr '(1 2 3) '())
```

## 4.2

(a)define会被当成过程. (b)修改application?认定'call开头为过程应用.

## 4.3

大概是这个感觉.

```racket
(define (install-eval-package)
  (define (self-evaluating? exp)
    (cond ((number? exp) true)
          ((string? exp) true)
          (else false)))
  (put 'self-evaluating? self-evaluating?)
  (define (variable? exp) (symbol? exp))
  (put 'variable? variable?)
  (define (tagged-list? exp tag)
    (if (pair? exp)
        (eq? (car exp) tag)
        false))
  (define (quoted? exp)
    (tagged-list? exp 'quote))
  (put 'quoted? quoted?)
  (define (text-of-quotation exp) (cadr exp))
  (put 'text-of-quotation text-of-quotation)
  (define (application? exp) (pair? exp))
  (put 'application? application?)
  (define (operator exp) (car exp))
  (put 'operator operator)
  (define (operands exp) (cdr exp))
  (put 'operands operands)
  (define (eval-assignment exp env)
    (set-variable-value! (assignment-variable exp)
                        (eval (assignment-value exp) env)
                        env)
    'ok)
  (put 'set! eval-assignment)
  (define (eval-definition exp env)
    (define-variable! (definition-variable exp)
                      (eval (definition-value exp) env)
                      env)
    'ok)
  (put 'define eval-definition)
  (define (eval-if exp env)
    (if (true? (eval (if-predicate exp) env))
        (eval (if-consequent exp) env)
        (eval (if-alternative exp) env)))
  (put 'if eval-if)
  ; 后略...
  'ok)

(define (self-evaluating? exp)
  ((get 'self-evaluating?) exp))

(define (variable? exp)
  ((get 'variable?) exp))

(define (lookup-variable-value exp env)
  ((get 'lookup-variable-value) exp env))

(define (quoted? exp)
  ((get 'quoted?) exp))

(define (text-of-quotation exp)
  ((get 'text-of-quotation) exp))

(define (application? exp)
  ((get 'application?) exp))

(define (operator exp)
  ((get 'operator) exp))

(define (list-of-values exps env)
  ((get 'list-of-values) exps env))

(define (operands exp)
  ((get 'operands) exp))

(define (eval exp env)
  (cond ((self-evaluating? exp) exp)
        ((variable? exp) (lookup-variable-value exp env))
        ((quoted? exp) (text-of-quotation exp))
        ((get (car exp)) ((get (car exp)) exp env))
        ((application? exp)
         (apply (eval (operator exp) env)
                      (list-of-values (operands exp) env))))
        (else
         (error "Unknown expression type -- EVAL" exp)))
```

## 4.4

在`eval`的`cond`的分支里添加识别和处理and, or形式的代码.

```racket
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

        ((and? exp) (eval-and (cdr exp) env))
        ((or? exp) (eval-or (cdr exp) env))

        ((application? exp)
         (apply (eval (operator exp) env)
                (list-of-values (operands exp) env)))
        (else
         (error "Unknown expression type -- EVAL" exp))))
```

语法过程和求值过程:

```racket
(define (and? exp) (tagged-list? exp 'and))

(define (eval-and exps env)
  (define (iter exps last-res)
    (if (null? exps)
        last-res
        (let ((res (eval (car exps) env)))
          (if (true? res)
              (iter (cdr exps) res)
              false))))
  (if (null? exps)
      true
      (iter exps true)))

(define (or? exp) (tagged-list? exp 'or))

(define (eval-or exps env)
  (define (iter exps)
    (if (null? exps)
        false
        (let ((res (eval (car exps) env)))
          (if (true? res)
              true
              (iter (cdr exps))))))
  (iter exps))
```

另一种方式, 实现为派生表达式:

参考: [https://beautifulracket.com/explainer/macros.html](https://beautifulracket.com/explainer/macros.html)

```racket
(define (eval exp env)
  (cond ((self-evaluating? exp) exp)
        ......
        ((and? exp) (eval (and->if exp) env))
        ((or? exp) (eval (or->if exp) env))
        ......))

(define (and-body and-exp) (cdr and-exp))
(define (or-body or-exp) (cdr or-exp))

(define (and->if exp)
  (define (expand exps)
    (if (not (null? exps))
        (make-if (car exps)
                 (if (null? (cddr exps))
                     (cadr exps)
                     (expand (cdr exps)))
                 false)))
  (let ((body (and-body exp)))
    (cond ((null? body) true)
          ((null? (cdr body)) (car body))
          (else (expand (and-body exp))))))

(define (or->if exp)
  (define (expand exps)
    (if (not (null? exps))
        (make-if (car exps)
                 true
                 (if (null? (cddr exps))
                     (cadr exps)
                     (expand (cdr exps))))))
  (let ((body (or-body exp)))
    (cond ((null? body) false)
          ((null? (cdr body)) (car body))
          (else (expand (or-body exp))))))

(and->if '(and (expr a) (expr b)))
(and->if '(and (expr a) (expr b) (expr c)))
(or->if '(or (expr a) (expr b)))
(or->if '(or (expr a) (expr b) (expr c)))
(and->if '(and))
(and->if '(and (x 1)))
(or->if '(or))
(or->if '(or false))
```

## 4.5

```racket
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

(cond->if '(cond ((expr 1) => x) ((expr 2) => y) ((expr 3) 3) (else 4)))
(cond->if '(cond ((assoc 'b '((a 1) (b 2))) => cadr) (else false)))
; =>
((lambda (__@ImplyRes) (if __@ImplyRes (cadr __@ImplyRes) (begin false))) (assoc (quote b) (quote ((a 1) (b 2)))))
```

看[wiki](http://community.schemewiki.org/?sicp-ex-4.5)发现RaphyJake思路和我一样, 用lambda防止执行两次`(cond-predicate first)`,
然后下面说可能出现内部lambda参数与外部绑定同名的问题, 或许可以考虑把用户代码绑定的名字都预处理下.

wiki里的代码有看不懂的, 提前执行的, 执行两次的, 只执行一次(make-lambda; make-let)但可能存在同名冲突的...只有x3v的代码只执行一次且没有冲突, 但超出了题目要求改的范围.

## 4.6

```racket
; eval条件分支添加
((let? exp) (eval (let->combination exp) env))
;;;;
; let表达式
(define (let? exp) (tagged-list? exp 'let))

(define (let-bindings exp) (cadr exp))

(define (let-body exp) (cddr exp))

(define (let->combination exp)
  (let ((bindings (let-bindings exp)))
    (cons (make-lambda (map car bindings)
                       (let-body exp))
          (map cadr bindings))))
```

测试

```racket
#lang sicp
; (let ((v1 e1) (v2 e2) .. (vn en)) body) -> ((lambda (v1 v2 ... vn) body) e1 e2 .. en)
(define t '(let ((v1 e1) (v2 e2) (vn en)) body))
(let->combination t)
(define (lambda-parameters exp) (cadr exp))
(define (lambda-body exp) (cddr exp))
(lambda-parameters '(lambda (v1 v2 vn) body))
(lambda-body '(lambda (v1 v2 vn) (+ v1 v2 vn) (newline)))
```

## 4.7

```racket
;;; eval条件分支添加
((let*? exp) (eval (let*->nested-lets exp) env))
;;;

(define (let*? exp) (tagged-list? exp 'let*))

(define (let*-bindings exp) (cadr exp))

(define (let*-body exp) (cddr exp))

(define (make-let bindings body) 
  (cons 'let (cons bindings body)))

(define (let*->nested-lets exp)
  (define (iter bindings body)
    (if (not (null? (cdr bindings)))
        (make-let (list (car bindings))
                  (list (iter (cdr bindings) body)))
        (make-let (list (car bindings)) body)))
  (iter (let*-bindings exp) (let*-body exp)))
```

## 4.8

```racket
(define (named-let? exp) (not (pair? (cadr exp))))

(define (named-let-bindings exp)
  (caddr exp))

(define (named-let-body exp)
  (cdddr exp))

(define (named-let-name exp) (cadr exp))

(define (named-let->define exp)
  (let ((name (named-let-name exp))
        (bindings (named-let-bindings exp))
        (body (named-let-body exp)))
    (list
     (list 'define
           name
           (make-lambda (map car bindings)
                        body))
     (cons name (map cadr bindings)))))

(define (let->combination exp)
  (if (named-let? exp)
      (make-lambda '() (named-let->define exp))
      (let ((bindings (let-bindings exp)))
        (cons (make-lambda (map car bindings)
                           (let-body exp))
              (map cadr bindings)))))
```

## 4.9

```racket
(while? t)
(while-cond t)
(while-body t)

(define (while->lambda exp)
  (list (make-lambda
   '()
   (list (list 'define
               '(while)
               (list 'cond
                     (list 
                      (while-cond exp)
                      (sequence->exp (while-body exp))
                      '(while))))
         '(while)))))

(define x 0)
(while->lambda '(while (< x 5) (set! x (+ x 1)) (display x)))
((lambda () (define (while) (cond ((< x 5) (begin (set! x (+ x 1)) (display x)) (while)))) (while)))
```

## 4.10

修改各个选择器就可以拓展或修改语法.

## 4.11

```racket
#lang sicp

(define (enclosing-environment env) (cdr env))

(define (first-frame env) (car env))

(define the-empty-environment '())

(define (make-frame variables values)
  (cons (cons 'frame 'head) (map cons variables values)))

(define (extend-environment vars vals base-env)
  (if (= (length vars) (length vals))
      (cons (make-frame vars vals) base-env)
      (if (< (length vars) (length vals))
          (error "Too many arguments supplied" vars vals)
          (error "Too few arguments supplied" vars vals))))

(define (lookup-variable-value var env)
  (define (env-loop env)
    (if (eq? env the-empty-environment)
        (error "Unbound variable" var)
        (let ((frame (first-frame env)))
          (let ((res (assoc var frame)))
            (if res
                (cdr res)
                (env-loop (enclosing-environment env)))))))
  (env-loop env))

(define (set-variable-value! var val env)
  (define (env-loop env)
    (define (scan frame)
      (cond ((null? frame)
             (env-loop (enclosing-environment env)))
            ((eq? var (caar frame))
             (set-cdr! (car frame) val))
            (else (scan (cdr frame)))))
    (if (eq? env the-empty-environment)
        (error "Unbound variable -- SET!" var)
        (scan (first-frame env))))
  (env-loop env))

(define (add-binding-to-frame! var val frame)
  (set-cdr! frame (cons (cons var val) (cdr frame))))

(define (define-variable! var val env)
  (let ((frame (first-frame env)))
    (define (scan f)
      (cond ((null? f)
             (add-binding-to-frame! var val frame))
            ((eq? var (caar f))
             (set-cdr! (car f) val))
            (else (scan (cdr f)))))
    (scan frame)))

(define test-env
  (extend-environment 
   '(a b c d) 
   '(1 2 3 4) 
   the-empty-environment))

(lookup-variable-value 'c test-env)
(set-variable-value! 'b 6 test-env)
(lookup-variable-value 'b test-env)
(define-variable! 'e 5 test-env)
(display test-env)
```

## 4.12

```racket
(define (make-frame variables values)
  ; 从frame中查找var, 返回 (var . val), 不存在返回 false
  (define (getv var)
    1)
  ; 修改frame中的var对应的val
  ; 没有找到var时返回'failure
  (define (setv var val)
    1)
  ; 在frame中添加或修改一对var, val
  (define (defv var val)
    1)
  ; 打印 frame
  (define (print)
    1)
  (define (dispatch msg)
    (cond ((eq? msg 'getv) getv)
          ((eq? msg 'setv) setv)
          ((eq? msg 'defv) defv)
          ((eq? msg 'print) print)
          (else (error "?"))))
  dispatch)

(define (get-var var frame)
  ((frame 'getv) var))

(define (frame-set var val frame)
  ((frame 'setv) var val))

(define (frame-define var val frame)
  ((frame 'defv) var val))

(define (print-frame frame)
  ((frame 'print)))

(define (enclosing-environment env) (cdr env))

(define (first-frame env) (car env))

(define the-empty-environment '())

(define (extend-environment vars vals base-env)
  (if (= (length vars) (length vals))
      (cons (make-frame vars vals) base-env)
      (if (< (length vars) (length vals))
          (error "Too many arguments supplied" vars vals)
          (error "Too few arguments supplied" vars vals))))

(define (env-loop var val env action)
  (if (eq? env the-empty-environment)
      (error "Unbound variable" var)
      (let ((frame (first-frame env)))
        (cond ((eq? action 'lookup)
               (let ((res (get-var var frame)))
                 (if res
                     (cdr res)
                     (env-loop var val (enclosing-environment env) 'lookup))))
              ((eq? action 'set)
               (let ((res (frame-set var val frame)))
                 (if (eq? res 'failure)
                     (env-loop var val (enclosing-environment env) 'set))))))))

(define (lookup-variable-value var env)
  (env-loop var nil env 'lookup))

(define (set-variable-value! var val env)
  (env-loop var val env 'set))

(define (define-variable! var val env)
  (let ((frame (first-frame env)))
    (frame-define var val frame)))

(define test-env
  (extend-environment 
   '(a b c d) 
   '(1 2 3 4) 
   the-empty-environment))

(lookup-variable-value 'c test-env)
(set-variable-value! 'b 6 test-env)
(lookup-variable-value 'b test-env)
(define-variable! 'e 5 test-env)
(display test-env)
```

一种实现:

```racket
(define (make-frame variables values)
  (define the-frame '())

  ; 从frame中查找var, 返回 (var . val), 不存在返回 false
  (define (getv var)
    (define (scan vars vals)
      (cond ((null? vars) false)
            ((eq? var (car vars))
             (cons var (car vals)))
            (else (scan (cdr vars) (cdr vals)))))
    (scan (car the-frame) (cdr the-frame)))

  ; 修改frame中的var对应的val
  ; 没有找到var时返回'failure
  (define (setv var val)
    (define (scan vars vals)
      (cond ((null? vars) 'failure)
            ((eq? var (car vars))
             (set-car! vals val))
            (else (scan (cdr vars) (cdr vals)))))
      (scan (car the-frame) (cdr the-frame)))

  ; 在frame中添加或修改一对var, val
  (define (defv var val)
    (define (add-binding-to-frame! var val)
      (set-car! the-frame (cons var (car the-frame)))
      (set-cdr! the-frame (cons val (cdr the-frame))))
    (define (scan vars vals)
      (cond ((null? vars)
             (add-binding-to-frame! var val))
            ((eq? var (car vars))
             (set-car! vals val))
            (else (scan (cdr vars) (cdr vals)))))
    (scan (car the-frame) (cdr the-frame)))

  (define (print)
    (display the-frame)
    (newline))

  (define (dispatch msg)
    (cond ((eq? msg 'getv) getv)
          ((eq? msg 'setv) setv)
          ((eq? msg 'defv) defv)
          ((eq? msg 'print) print)
          (else (error "?"))))

  (set! the-frame (cons variables values))
  dispatch)
```

## 4.13

只删除第一个框架里的约束.

```racket
(define (make-unbound! var env)
  (let ((frame (first-frame env)))
    (define (scan last-var last-val vars vals)
      (cond ((eq? var (car vars))
             (cond ((eq? '() (cdr vars))
                    (set-cdr! last-var '())
                    (set-cdr! last-val '()))
                   (else
                    (set-car! vars (cadr vars))
                    (set-cdr! vars (cddr vars))
                    (set-car! vals (cadr vals))
                    (set-cdr! vals (cddr vals)))))
            (else (if (not (null? vars))
                      (scan vars vals (cdr vars) (cdr vals))))))
    (scan '() '()
          (frame-variables frame)
          (frame-values frame))))
```

## 4.14

经过`eval`的处理后`map`的第一个参数会变成第一个元素为`primitive`或`procedure`的表, 所以系统的map会出错.

## 4.15

停机问题, 相关资料有很多.

## 4.16

```racket
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

(define (scan-out-defines body)
  (define (scan b bindings let-b)
    (let ((expr (car b)))
      (if (tagged-list? expr 'define)
        (let ((vr (definition-variable expr))
              (vl (definition-value expr)))
                (scan (cdr b)
                      (cons (list vr ''*unassigned*) bindings) 
                      (cons (list 'set! vr vl) let-b)))
        (if (null? bindings)
            body
            (list (make-let (reverse bindings) (append (reverse let-b) b)))))))
  (scan body '() '()))

(define (make-procedure parameters body env)
  (list 'procedure parameters (scan-out-defines body) env))
```

## 4.19

```racket
我觉得`Alyssa`的观点更合理.
```

## 4.20

```racket
;; eval条件分支添加
((letrec? exp) (eval (letrec->let exp) env))
;;

(define (letrec? exp) (tagged-list? exp 'letrec))

(define (letrec->let exp)
  (let ((bindings (let-bindings exp)))
    (make-let (map (lambda (x) (list (car x) ''unassigned)) bindings)
              (append (map (lambda (vr vl) (list 'set! vr vl))
                           (map car bindings)
                           (map cadr bindings))
                      (let-body exp)))))
```

## 4.21

a)

```racket
((lambda (n)
   ((lambda (fib)
      (fib fib n))
    (lambda (fibo k)
      (if (< k 3)
          1
          (+ (fibo fibo (- k 1)) (fibo fibo (- k 2)))))))
 12)
```

b)

```racket
(define (f x)
  ((lambda (even? odd?)
     (even? even? odd? x))
   (lambda (ev? od? n)
     (if (= n 0) true (od? ev? od? (- n 1))))
   (lambda (ev? od? n)
     (if (= n 0) false (ev? ev? od? (- n 1))))))
```

---

到这里为止的求值器的代. 每次执行程序对同一个过程都需要重复做语法分析, 非常低效.

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

(define (make-unbound! var env)
  (let ((frame (first-frame env)))
    (define (scan last-var last-val vars vals)
      (cond ((eq? var (car vars))
             (cond ((eq? '() (cdr vars))
                    (set-cdr! last-var '())
                    (set-cdr! last-val '()))
                   (else
                    (set-car! vars (cadr vars))
                    (set-cdr! vars (cddr vars))
                    (set-car! vals (cadr vals))
                    (set-cdr! vals (cddr vals)))))
            (else (if (not (null? vars))
                      (scan vars vals (cdr vars) (cdr vals))))))
    (scan '() '()
          (frame-variables frame)
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
        ))

(define (primitive-procedure-names)
  (map car primitive-procedures))

(define (primitive-procedure-objects)
  (map (lambda (proc) (list 'primitive (cadr proc)))
       primitive-procedures))

(define (apply-primitive-procedure proc args)
  (apply-in-underlying-scheme
   (primitive-implementation proc) args))

;;

(define (scan-out-defines body)
  (define (scan b bindings let-b)
    (let ((expr (car b)))
      (if (tagged-list? expr 'define)
        (let ((vr (definition-variable expr))
              (vl (definition-value expr)))
                (scan (cdr b)
                      (cons (list vr ''*unassigned*) bindings) 
                      (cons (list 'set! vr vl) let-b)))
        (if (null? bindings)
            body
            (list (make-let (reverse bindings) (append (reverse let-b) b)))))))
  (scan body '() '()))

(define (make-procedure parameters body env)
  (list 'procedure parameters (scan-out-defines body) env))

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
        ((and? exp) (eval (and->if exp) env))
        ((or? exp) (eval (or->if exp) env))
        ((let? exp) (eval (let->combination exp) env))
        ((let*? exp) (eval (let*->nested-lets exp) env))
        ((letrec? exp) (eval (letrec->let exp) env))
        ((application? exp)
         (applyx (eval (operator exp) env)
                (list-of-values (operands exp) env)))
        (else
         (error "Unknown expression type -- EVAL" exp))))

(define (applyx procedure arguments) ;apply的话racket会报错, 和apply-primitive-procedure有关
  (cond ((primitive-procedure? procedure)
         (apply-primitive-procedure procedure arguments))
        ((compound-procedure? procedure)
         (eval-sequence
          (procedure-body procedure)
          (extend-environment
           (procedure-parameters procedure)
           arguments
           (procedure-environment procedure))))
        (else
         (error "Unknown procedure type -- APPLY" procedure))))

;;

(define (list-of-values exps env)
  (if (no-operands? exps)
      '()
      (cons (eval (first-operand exps) env)
            (list-of-values (rest-operands exps) env))))

(define (eval-if exp env)
  (if (true? (eval (if-predicate exp) env))
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

(define (and? exp) (tagged-list? exp 'and))
(define (eval-and exps env)
  (define (iter exps last-res)
    (if (null? exps)
        last-res
        (let ((res (eval (car exps) env)))
          (if (true? res)
              (iter (cdr exps) res)
              false))))
  (iter exps true))

(define (or? exp) (tagged-list? exp 'or))
(define (eval-or exps env)
  (define (iter exps)
    (if (null? exps)
        false
        (let ((res (eval (car exps) env)))
          (if (true? res)
              true
              (iter (cdr exps))))))
  (iter exps))

(define (and-body and-exp) (cdr and-exp))
(define (or-body or-exp) (cdr or-exp))

(define (and->if exp)
  (define (expand exps)
    (if (not (null? exps))
        (make-if (car exps)
                 (if (null? (cddr exps))
                     (cadr exps)
                     (expand (cdr exps)))
                 false)))
  (let ((body (and-body exp)))
    (cond ((null? body) true)
          ((null? (cdr body)) (car body))
          (else (expand (and-body exp))))))

(define (or->if exp)
  (define (expand exps)
    (if (not (null? exps))
        (make-if (car exps)
                 true
                 (if (null? (cddr exps))
                     (cadr exps)
                     (expand (cdr exps))))))
  (let ((body (or-body exp)))
    (cond ((null? body) false)
          ((null? (cdr body)) (car body))
          (else (expand (or-body exp))))))

(define (let? exp) (tagged-list? exp 'let))

(define (let-bindings exp) (cadr exp))

(define (let-body exp) (cddr exp))

(define (named-let? exp) (not (pair? (cadr exp))))

(define (named-let-bindings exp)
  (caddr exp))

(define (named-let-body exp)
  (cdddr exp))

(define (named-let-name exp) (cadr exp))

(define (named-let->define exp)
  (let ((name (named-let-name exp))
        (bindings (named-let-bindings exp))
        (body (named-let-body exp)))
    (list
     (list 'define
           name
           (make-lambda (map car bindings)
                        body))
     (cons name (map cadr bindings)))))

(define (let->combination exp)
  (if (named-let? exp)
      (make-lambda '() (named-let->define exp))
      (let ((bindings (let-bindings exp)))
        (cons (make-lambda (map car bindings)
                           (let-body exp))
              (map cadr bindings)))))

(define (let*? exp) (tagged-list? exp 'let*))

(define (let*-bindings exp) (cadr exp))

(define (let*-body exp) (cddr exp))

(define (make-let bindings body)
  (cons 'let (cons bindings body)))

(define (let*->nested-lets exp)
  (define (iter bindings body)
    (if (not (null? (cdr bindings)))
        (make-let (list (car bindings))
                  (list (iter (cdr bindings) body)))
        (make-let (list (car bindings)) body)))
  (iter (let*-bindings exp) (let*-body exp)))

(define (letrec? exp) (tagged-list? exp 'letrec))

(define (letrec->let exp)
  (let ((bindings (let-bindings exp)))
    (make-let (map (lambda (x) (list (car x) ''unassigned)) bindings)
              (append (map (lambda (vr vl) (list 'set! vr vl))
                           (map car bindings)
                           (map cadr bindings))
                      (let-body exp)))))

;;

(define input-prompt ";;; M-Eval input:")
(define output-prompt ";;; M-Eval value:")

(define (driver-loop)
  (prompt-for-input input-prompt)
  (let ((input (read)))
    (let ((output (eval input the-global-environment)))
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

;(driver-loop)
(eval '(define (append x y) (if (null? x) y (cons (car x) (append (cdr x) y)))) 
      the-global-environment)
(eval '(append '(a b c) '(d e f)) the-global-environment)
(eval '(define (map proc lst) (if (null? lst) '() (cons (proc (car lst)) (map proc (cdr lst)))))
      the-global-environment)
(eval '(map (lambda (x) (+ x 1)) '(1 2 3 4)) the-global-environment)
(eval '(define (f) (define u (+ 2 1)) (+ u 2) (define v (+ 3 2)) (+ u v) (* u v))
      the-global-environment)
(eval '(f) the-global-environment)
(eval '(letrec ((fact (lambda (n) (if (= n 1) 1 (* n (fact (- n 1))))))) (fact 5)) the-global-environment)
```

---

将语法分析与执行分离.

## 4.22

```racket
#lang sicp

;;

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

(define (make-unbound! var env)
  (let ((frame (first-frame env)))
    (define (scan last-var last-val vars vals)
      (cond ((eq? var (car vars))
             (cond ((eq? '() (cdr vars))
                    (set-cdr! last-var '())
                    (set-cdr! last-val '()))
                   (else
                    (set-car! vars (cadr vars))
                    (set-cdr! vars (cddr vars))
                    (set-car! vals (cadr vals))
                    (set-cdr! vals (cddr vals)))))
            (else (if (not (null? vars))
                      (scan vars vals (cdr vars) (cdr vals))))))
    (scan '() '()
          (frame-variables frame)
          (frame-values frame))))

;;

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
        ))

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

(define (eval exp env)
  ((analyze exp) env))

(define (analyze exp)
  (cond ((self-evaluating? exp)
         (analyze-self-evaluating exp))
        ((quoted? exp) (analyze-quoted exp))
        ((variable? exp) (analyze-variable exp))
        ((assignment? exp) (analyze-assignment exp))
        ((definition? exp) (analyze-definition exp))
        ((if? exp) (analyze-if exp))
        ((lambda? exp) (analyze-lambda exp))
        ((begin? exp) (analyze-sequence (begin-actions exp)))
        ((cond? exp) (analyze (cond->if exp)))
        ((let? exp) (analyze (let->combination exp)))
        ((application? exp) (analyze-application exp))
        (else
         (error "Unknown expression type -- ANALYZE" exp))))

(define (analyze-self-evaluating exp)
  (lambda (env) exp))

(define (analyze-quoted exp)
  (let ((qval (text-of-quotation exp)))
    (lambda (env) qval)))

(define (analyze-variable exp)
  (lambda (env) (lookup-variable-value exp env)))

(define (analyze-assignment exp)
  (let ((var (assignment-variable exp))
        (vproc (analyze (assignment-value exp))))
    (lambda (env)
      (set-variable-value! var (vproc env) env)
      'ok)))

(define (analyze-definition exp)
  (let ((var (definition-variable exp))
        (vproc (analyze (definition-value exp))))
    (lambda (env)
      (define-variable! var (vproc env) env)
      'ok)))

(define (analyze-if exp)
  (let ((pproc (analyze (if-predicate exp)))
        (cproc (analyze (if-consequent exp)))
        (aproc (analyze (if-alternative exp))))
    (lambda (env)
      (if (true? (pproc env))
          (cproc env)
          (aproc env)))))

(define (analyze-lambda exp)
  (let ((vars (lambda-parameters exp))
        (bproc (analyze-sequence (lambda-body exp))))
    (lambda (env) (make-procedure vars bproc env))))

(define (analyze-sequence exps)
  (define (sequentially proc1 proc2)
    (lambda (env) (proc1 env) (proc2 env)))
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
    (lambda (env)
      (execute-application (fproc env)
                           (map (lambda (aproc) (aproc env))
                                aprocs)))))

(define (execute-application proc args)
  (cond ((primitive-procedure? proc)
         (apply-primitive-procedure proc args))
        ((compound-procedure? proc)
         ((procedure-body proc)
          (extend-environment (procedure-parameters proc)
                              args
                              (procedure-environment proc))))
        (else
         (error "Unknown procedure type -- EXECUTE-APPLICATION" proc))))

;;

(define input-prompt ";;; M-Eval input:")
(define output-prompt ";;; M-Eval value:")

(define (driver-loop)
  (prompt-for-input input-prompt)
  (let ((input (read)))
    (let ((output (eval input the-global-environment)))
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

;(driver-loop)
(eval '(define (append x y) (if (null? x) y (cons (car x) (append (cdr x) y)))) 
      the-global-environment)
(eval '(append '(a b c) '(d e f)) the-global-environment)
(eval '(define (map proc lst) (if (null? lst) '() (cons (proc (car lst)) (map proc (cdr lst)))))
      the-global-environment)
(eval '(map (lambda (x) (+ x 1)) '(1 2 3 4)) the-global-environment)
(eval '(let ((v 1)) (+ v 4)) the-global-environment)
```
