---
layout: post
title: "SICP第三章部分习题解答(一)"
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

## 3.1

引入变量.

```racket
(define (make-accumulator n)
  (lambda (x)
    (set! n (+ n x))
    n))
```

## 3.2

```racket
(define (make-monitored f)
  (define count 0)
  (define (mf x)
    (cond ((eq? x 'how-many-calls) count)
          ((eq? x 'reset-count) (set! count 0))
          (else
           (set! count (+ 1 count))
           (f x))))
  mf)
```

## 3.3-4

```racket
(define (make-account balance passwd)
  (define tries 0)
  (define (call-the-cops) (error "Cops are coming!"))
  (define (withdraw amount)
    (if (>= balance amount)
        (begin (set! balance (- balance amount))
               balance)
        "Insufficient funds"))
  (define (deposit amount)
    (set! balance (+ balance amount))
    balance)
  (define (dispatch pwd m)
    (if (eq? passwd pwd)
        (cond ((eq? m 'withdraw) withdraw)
              ((eq? m 'deposit) deposit)
              (else (error "Unknown request -- MAKE-ACCOUNT"
                           m)))
        (begin (set! tries (+ 1 tries))
               (if (= 7 tries)
                   (call-the-cops)
                   (lambda (x) (display "Incorrect PASSWORD\n"))))))
  dispatch)
```

## 3.5

```racket
#lang sicp

(define (square x) (* x x))

(define (monte-carlo trials experiment)
  (define (iter trials-remaining trials-passwd)
    (cond ((= trials-remaining 0)
           (/ trials-passwd trials))
          ((experiment)
           (iter (- trials-remaining 1) (+ 1 trials-passwd)))
          (else (iter (- trials-remaining 1) trials-passwd))))
  (iter trials 0))

(define (random-in-range low high)
  (let ((range (- high low)))
    (+ low (random range))))

(define (estimate-integral P x1 x2 y1 y2 trials)
  (define (experiment)
    (P (random-in-range x1 x2) (random-in-range y1 y2)))
  (monte-carlo trials experiment))

(define (estmate-pi trials)
  (* 4.
     (estimate-integral 
      (lambda (x y) (<= (+ (square x) (square y)) 1.))
      (- 1.) 1. (- 1.) 1. trials)))

(estmate-pi 50000)
```

## 3.6

```racket
(define rand
  (let ((x random-init))
    (lambda (msg)
      (cond ((eq? msg 'generate)
             (set! x (rand-update x))
             x)
            ((eq? msg 'reset)
             (lambda (nx) (set! x nx)))))))
```

## 3.7

```racket
(define (make-joint account passwd new-passwd)
  (lambda (pwd msg)
    (if (eq? pwd new-passwd)
        (account passwd msg)
        (account 'error 'error))))
```

## 3.8

```racket
(define (ff)
  (let ((flag 1))
    (lambda (x)
      (if (= x 0)
          (begin (set! flag 0) flag)
          flag))))

(define f1 (ff))
(define f2 (ff))

(+ (f1 0) (f1 1)) ;0
(+ (f2 1) (f2 0)) ;1
```

## 3.17

```racket
#lang sicp

(define inf-list '(1 2 3 4))
(set-cdr! (cdddr inf-list) inf-list)

(define (count-pairs x)
  (letrec [(memo '())
           (count
            (lambda (x)
              (if (or (not (pair? x)) 
                      (memq x memo))
                  0
                  (begin
                    (set! memo (cons x memo))
                    (+ (count (car x))
                       (count (cdr x))
                       1)))))]
    (count x)))

(count-pairs inf-list)
```

## 3.18-19

```racket
(define (cycle-1? x)
  (letrec [(memo '())
           (iter
            (lambda (x)
              (cond ((memq x memo) #t)
                    ((null? x) #f)
                    (else (begin
                            (set! memo (cons x memo))
                            (iter (cdr x)))))))]
    (iter x)))

(define (cycle-2? x)
  (define f x)
  (define s x)
  (define (iter)
    (if (and (not (null? (cdr f))) (not (null? (cddr f))))
        (begin (set! s (cdr s))
               (set! f (cddr f))
               (if (eq? s f)
                   #t
                   (iter)))
        #f))
  (if (null? x)
      #f
      (iter)))

(define (cycle-3? x)
  (define (check s f)
    (cond ((eq? s f) #t)
          ((or (null? f) (null? (cdr f)) (null? (cddr f))) #f)
          (else (check (cdr s) (cddr f)))))
  (if (null? x)
      #f
      (check x (cdr x))))
```

## 3.21

```racket
(define (print-queue queue)
  (for-each 
    (lambda (x) (display x) (display " "))
    (front-ptr queue))
  (newline))
```

## 3.22

```racket
#lang sicp

(define (make-queue)
  (let [(front-ptr '())
        (rear-ptr '())]
    (define (set-front-ptr! item) (set! front-ptr item))
    (define (set-rear-ptr! item) (set! rear-ptr item))
    (define (empty-queue?) (null? front-ptr))
    (define (front-queue)
      (if (empty-queue?)
          (error "FRONT called with an empty queue")
          (car front-ptr)))
    (define (insert-queue! item)
      (let [(new-pair (cons item '()))]
        (cond ((empty-queue?)
               (set-front-ptr! new-pair)
               (set-rear-ptr! new-pair))
              (else
               (set-cdr! rear-ptr new-pair)
               (set-rear-ptr! new-pair)))))
    (define (delete-queue!)
      (cond ((empty-queue?)
             (error "DELETE! called with an empty queue"))
            (else
             (set-front-ptr! (cdr front-ptr)))))
    (define (print-queue)
      (for-each
       (lambda (x) (display x) (display " "))
       front-ptr)
      (newline))
    (define (dispatch m)
      (cond [(eq? m 'print-queue) print-queue]
            [(eq? m 'delete-queue!) delete-queue!]
            [(eq? m 'insert-queue!) insert-queue!]
            [(eq? m 'front-queue) front-queue]
            [(eq? m 'empty-queue) empty-queue?]
            [(eq? m 'set-front-ptr!) set-front-ptr!]
            [(eq? m 'set-rear-ptr!) set-rear-ptr!]))
    dispatch))

(define q1 (make-queue))
((q1 'insert-queue!) 'a)
((q1 'insert-queue!) 'b)
((q1 'insert-queue!) 'c)
((q1 'delete-queue!))
((q1 'insert-queue!) 'd)
((q1 'print-queue))
((q1 'empty-queue))
```

## 3.23

双端队列.

```racket
#lang sicp

; '(item (bk . fd))
(define (make-node item)
  (cons item (cons '() '())))

(define (set-bk! node1 node2)
  (set-car! (cdr node1) node2))

(define (set-fd! node1 node2)
  (set-cdr! (cdr node1) node2))

(define (get-bk node)
  (cadr node))

(define (get-fd node)
  (cddr node))

(define (make-deque)
  (let [(head (make-node 'head))
        (tail (make-node 'tail))]
    (set-fd! head tail)
    (set-bk! head tail)
    (set-fd! tail head)
    (set-bk! tail head)
    (cons head tail))) ; 两个哨兵

(define (head-deque deque)
  (car deque))

(define (tail-deque deque)
  (cdr deque))

(define (front-deque deque)
  (car (get-fd (head-deque deque))))

(define (rear-deque deque)
  (car (get-bk (tail-deque deque))))

(define (empty-deque? deque)
  (eq? (get-fd (head-deque deque)) (tail-deque deque)))

(define (front-insert-deque! deque item)
  (let* [(new-node (make-node item))
         (head (head-deque deque))
         (head-next (get-fd head))]
    (set-bk! new-node head)
    (set-fd! new-node head-next)
    (set-fd! head new-node)
    (set-bk! head-next new-node)
    deque))

(define (rear-insert-deque! deque item)
  (let* [(new-node (make-node item))
         (tail (tail-deque deque))
         (tail-prev (get-bk tail))]
    (set-fd! new-node tail)
    (set-bk! new-node tail-prev)
    (set-fd! tail-prev new-node)
    (set-bk! tail new-node)
    deque))

(define (front-delete-deque! deque)
  (let* [(head (head-deque deque))
         (front (get-fd head))
         (front-next (get-fd front))]
    (set-fd! head front-next)
    (set-bk! front-next head)
    (set-fd! front '())
    (set-bk! front '())
    deque))

(define (rear-delete-deque! deque)
  (let* [(tail (tail-deque deque))
         (rear (get-bk tail))
         (rear-prev (get-bk rear))]
    (set-bk! tail rear-prev)
    (set-fd! rear-prev tail)
    (set-fd! rear '())
    (set-bk! rear '())
    deque))

(define (print-deque deque)
  (define tail (tail-deque deque))
  (define (iter f)
    (if (not (eq? f tail))
        (begin
          (display (car f))
          (display " ")
          (iter (get-fd f)))))
  (iter (get-fd (head-deque deque)))
  (newline))

(define dq1 (make-deque))
(empty-deque? dq1)
(front-insert-deque! dq1 'a)
(rear-insert-deque! dq1 'b)
(front-insert-deque! dq1 1)
(rear-insert-deque! dq1 2)
(front-deque dq1)
(rear-deque dq1)
(print-deque dq1) ; 1 a b 2
(front-delete-deque! dq1)
(rear-delete-deque! dq1)
(print-deque dq1) ; a b
```

## 3.24

```racket
#lang sicp

(define (make-table same-key?)
  (let ((local-table (list '*table*)))
    (define (assoc key records)
      (cond ((null? records) #f)
            ((same-key? key (caar records)) (car records))
            (else (assoc key (cdr records)))))
    (define (lookup key-1 key-2)
      (let ((subtable (assoc key-1 (cdr local-table))))
        (if subtable
            (let ((record (assoc key-2 (cdr subtable))))
              (if record
                  (cdr record)
                  #f))
            #f)))
    (define (insert! key-1 key-2 value)
      (let ((subtable (assoc key-1 (cdr local-table))))
        (if subtable
            (let ((record (assoc key-2 (cdr subtable))))
              (if record
                  (set-cdr! record value)
                  (set-cdr! subtable
                            (cons (cons key-2 value)
                                  (cdr subtable)))))
            (set-cdr! local-table
                      (cons (list key-1
                                  (cons key-2 value))
                            (cdr local-table)))))
      'ok)
    (define (dispatch m)
      (cond ((eq? m 'lookup-proc) lookup)
            ((eq? m 'insert-proc!) insert!)
            ((eq? m 'display) local-table)
            (else (error "Unknown operation -- TABLE" m))))
    dispatch))

(define operation-table (make-table equal?))
(define get (operation-table 'lookup-proc))
(define put (operation-table 'insert-proc!))
```

## 3.25

```racket
#lang sicp

(define (make-table)
  (let ((local-table (list '*table*)))
    (define (assoc key records)
      (cond ((null? records) #f)
            ((equal? key (caar records)) (car records))
            (else (assoc key (cdr records)))))
    (define (lookup key)
      (let ((record (assoc key (cdr local-table))))
        (if record (cdr record) #f)))
    (define (insert! key value)
      (let ((record (assoc key (cdr local-table))))
        (if record
            (set-cdr! record value)
            (set-cdr! local-table
                      (cons (cons key value) (cdr local-table)))))
      'ok)
    (define (dispatch m)
      (cond ((eq? m 'lookup-proc) lookup)
            ((eq? m 'insert-proc!) insert!)
            ((eq? m 'display) local-table)
            (else (error "Unknown operation -- TABLE" m))))
    dispatch))

(define tlb (make-table))
(define get (tlb 'lookup-proc))
(define put (tlb 'insert-proc!))

(put '(1) 'a)
(put '(1 1) 'b)
(put '(2 2 4 5 6) 'c)
(put '(2 1 3) 'd)
(tlb 'display)
(get '(2 2 4 5 6))
(get '(2 1 3))
```

## 3.26

```racket
#lang sicp
(define (make-table)
  (let ((local-tree '()))
    (define (entry tree) (car tree))
    (define (left-branch tree) (cadr tree))
    (define (right-branch tree) (caddr tree))
    (define (_make-tree entry left right)
      (list entry left right))
    (define (key x) (car x))
    (define (less? p q) (< (key p) (key q)))
    (define (greater? p q) (> (key p) (key q)))
    (define (insert x tree)
      (cond ((null? tree) (_make-tree x '() '()))
            ((equal? (key x) (key (entry tree))) tree)
            ((less? x (entry tree))
             (_make-tree (entry tree)
                         (insert x (left-branch tree))
                         (right-branch tree)))
            ((greater? x (entry tree))
             (_make-tree (entry tree)
                         (left-branch tree)
                         (insert x (right-branch tree))))))
    (define (insert! k v)
      (set! local-tree (insert (cons k v) local-tree)))
    (define (_lookup k tree)
      (cond ((null? tree) #f)
            ((equal? k (key (car tree))) (car tree))
            ((< k (key (car tree)))
             (_lookup k (left-branch tree)))
            ((> k (key (car tree)))
             (_lookup k (right-branch tree)))))
    (define (lookup k)
      (_lookup k local-tree))
    (define (dispatch m)
      (cond ((eq? m 'lookup) lookup)
            ((eq? m 'insert!) insert!)
            ((eq? m 'display) (display local-tree) (newline))
            (else (error "Unknown operation."))))
    dispatch))

(define t (make-table))
((t 'insert!) 3 'a)
((t 'insert!) 2 'b)
((t 'insert!) 1 'c)
((t 'insert!) 4 'd)
((t 'insert!) 5 'e)
(t 'display)
((t 'lookup) 4)
```

## 3.3.4

数字电路模拟

```racket
#lang sicp

(define (make-queue)
  (let [(front-ptr '())
        (rear-ptr '())]
    (define (set-front-ptr! item) (set! front-ptr item))
    (define (set-rear-ptr! item) (set! rear-ptr item))
    (define (empty-queue?) (null? front-ptr))
    (define (front-queue)
      (if (empty-queue?)
          (error "FRONT called with an empty queue")
          (car front-ptr)))
    (define (insert-queue! item)
      (let [(new-pair (cons item '()))]
        (cond ((empty-queue?)
               (set-front-ptr! new-pair)
               (set-rear-ptr! new-pair))
              (else
               (set-cdr! rear-ptr new-pair)
               (set-rear-ptr! new-pair)))))
    (define (delete-queue!)
      (cond ((empty-queue?)
             (error "DELETE! called with an empty queue"))
            (else
             (set-front-ptr! (cdr front-ptr)))))
    (define (print-queue)
      (for-each
       (lambda (x) (display x) (display " "))
       front-ptr)
      (newline))
    (define (dispatch m)
      (cond [(eq? m 'print-queue) print-queue]
            [(eq? m 'delete-queue!) delete-queue!]
            [(eq? m 'insert-queue!) insert-queue!]
            [(eq? m 'front-queue) front-queue]
            [(eq? m 'empty-queue) empty-queue?]
            [(eq? m 'set-front-ptr!) set-front-ptr!]
            [(eq? m 'set-rear-ptr!) set-rear-ptr!]))
    dispatch))

(define (insert-queue! q x)
  ((q 'insert-queue!) x))
(define (delete-queue! q)
  ((q 'delete-queue!)))
(define (empty-queue? q)
  ((q 'empty-queue)))
(define (front-queue q)
  ((q 'front-queue)))

(define (make-wire)
  (let [(signal-value 0) (action-procedures '())]
    (define (set-my-signal! new-value)
      (if (not (= signal-value new-value))
          (begin (set! signal-value new-value)
                 (call-each action-procedures))
          'done))
    (define (accept-action-procedure! proc)
      (set! action-procedures (cons proc action-procedures))
      (proc)) ; 若不先执行proc, 设置门之前的(set-signal 1)等于没有; 而且inverter需要马上触发.
    (define (dispatch m)
      (cond ((eq? m 'get-signal) signal-value)
            ((eq? m 'set-signal!) set-my-signal!)
            ((eq? m 'add-action!) accept-action-procedure!)
            (else (error "Unknown operation -- WIRE" m))))
    dispatch))

(define (call-each procedures)
  (if (null? procedures)
      'done
      (begin
        ((car procedures))
        (call-each (cdr procedures)))))

(define (get-signal wire) (wire 'get-signal))

(define (set-signal! wire new-value)
  ((wire 'set-signal!) new-value))

(define (add-action! wire action-procedure)
  ((wire 'add-action!) action-procedure))

(define (after-delay delay action)
  (add-to-agenda! (+ delay (current-time the-agenda))
                  action
                  the-agenda))

(define (propagate)
  (if (empty-agenda? the-agenda)
      'done
      (let ((first-item (first-agenda-item the-agenda)))
        (first-item)
        (remove-first-agenda-item! the-agenda)
        (propagate))))

(define (probe name wire)
  (add-action! wire
               (lambda ()
                 (newline)
                 (display name)
                 (display " ")
                 (display (current-time the-agenda))
                 (display "  New-value = ")
                 (display (get-signal wire)))))

(define (make-agenda) (list 0))

(define (make-time-segment time queue)
  (cons time queue))

(define (segment-time s) (car s))
(define (segment-queue s) (cdr s))

(define (current-time agenda) (car agenda))

(define (set-current-time! agenda time)
  (set-car! agenda time))

(define (segments agenda) (cdr agenda))

(define (set-segments! agenda segments)
  (set-cdr! agenda segments))

(define (first-segment agenda) (car (segments agenda)))
(define (rest-segments agenda) (cdr (segments agenda)))

(define (empty-agenda? agenda)
  (null? (segments agenda)))

(define (add-to-agenda! time action agenda)
  (define (belongs-before? segments)
    (or (null? segments)
        (< time (segment-time (car segments)))))

  (define (make-new-time-segment time action)
    (let ((q (make-queue)))
      (insert-queue! q action)
      (make-time-segment time q)))

  (define (add-to-segments! segments)
    (if (= (segment-time (car segments)) time)
        (insert-queue! (segment-queue (car segments))
                       action)
        (let ((rest (cdr segments)))
          (if (belongs-before? rest)
              (set-cdr!
               segments
               (cons (make-new-time-segment time action)
                     (cdr segments)))
              (add-to-segments! rest)))))

  (let ((segments (segments agenda)))
    (if (belongs-before? segments)
        (set-segments!
         agenda
         (cons (make-new-time-segment time action)
               segments))
        (add-to-segments! segments))))

(define (remove-first-agenda-item! agenda)
  (let ((q (segment-queue (first-segment agenda))))
    (delete-queue! q)
    (if (empty-queue? q)
        (set-segments! agenda (rest-segments agenda)))))

(define (first-agenda-item agenda)
  (if (empty-agenda? agenda)
      (error "Agenda is empty -- FIRST-AGENDA-ITEM")
      (let ((first-seg (first-segment agenda)))
        (set-current-time! agenda (segment-time first-seg))
        (front-queue (segment-queue first-seg)))))

(define the-agenda (make-agenda))
(define inverter-delay 3)
(define and-gate-delay 3)
(define or-gate-delay 5)

(define (and-gate a1 a2 output)
  (define (and-action-procedure)
    (let ((new-value
           (logical-and (get-signal a1) (get-signal a2))))
      (after-delay and-gate-delay
                   (lambda ()
                     (set-signal! output new-value)))))
  (add-action! a1 and-action-procedure)
  (add-action! a2 and-action-procedure)
  'ok)

(define (logical-and s1 s2)
  (if (and (= s1 1) (= s2 1)) 1 0))

; ex 3.28
(define (or-gate a1 a2 output)
  (define (or-action-procedure)
    (let ((new-value
           (logical-or (get-signal a1) (get-signal a2))))
      (after-delay or-gate-delay
                   (lambda ()
                     (set-signal! output new-value)))))
  (add-action! a1 or-action-procedure)
  (add-action! a2 or-action-procedure)
  'ok)

(define (logical-or s1 s2)
  (if (and (= s1 0) (= s2 0)) 0 1))

(define (logical-not s)
  (cond ((= s 0) 1)
        ((= s 1) 0)
        (else (error "Invalid signal" s))))

(define (inverter input output)
  (define (invert-input)
    (let [(new-value (logical-not (get-signal input)))]
      (after-delay inverter-delay
                   (lambda ()
                     (set-signal! output new-value)))))
  (add-action! input invert-input)
  'ok)

; ex3.29
; a | b = ~(~a & ~b)
; 2*inverter-delay + and-gate-delay
(define (or-gate-2 a1 a2 output)
  (let [(o1 (make-wire))
        (o2 (make-wire))
        (o3 (make-wire))]
    (inverter a1 o1)
    (inverter a2 o2)
    (and-gate o1 o2 o3)
    (inverter o3 output)
    'ok))

(define (half-adder a b s c)
  (let [(d (make-wire)) (e (make-wire))]
    (or-gate a b d)
    (and-gate a b c)
    (inverter c e)
    (and-gate d e s)
    'ok))

(define (full-adder a b c-in sum c-out)
  (let [(s (make-wire))
        (c1 (make-wire))
        (c2 (make-wire))]
    (half-adder b c-in s c1)
    (half-adder a s sum c2)
    (or-gate c1 c2 c-out)
    'ok))

; ex3.30 n位串行进位加法器
; n: Int
; ak, bk, ck: list[n]wire
; c: wire
(define (ripple-carry-adder n ak bk sk c)
  (define (iter i c-in)
    (if (= i 0)
        'ok
        (begin
          (let ((c-out (make-wire))) 
            (full-adder (list-ref ak (- i 1))
                        (list-ref bk (- i 1))
                        c-in
                        (list-ref sk (- i 1))
                        (if (= i 1) c c-out))
            (iter (- i 1) c-out)))))
  (let ((cn (make-wire)))
    (set-signal! cn 0)
    (iter n cn)))

(define (set-signals! lst vals)
  (map (lambda (w v) (set-signal! w v)) lst vals))

(define (add-test v1 v2)
  (define Ak (list (make-wire) (make-wire) (make-wire) (make-wire)))
  (define Bk (list (make-wire) (make-wire) (make-wire) (make-wire)))
  (define Sk (list (make-wire) (make-wire) (make-wire) (make-wire)))
  (define C (make-wire))
  (ripple-carry-adder 4 Ak Bk Sk C)
  (set-signals! Ak v1)
  (set-signals! Bk v2)
  (set-signals! Sk '(0 0 0 0))
  (propagate)
  (for-each 
   (lambda (w) (display (get-signal w)) (display " ")) Sk) ;结果
  (newline) (display (get-signal C)) (newline)) ; 进位

(add-test '(1 1 0 1) '(0 0 0 1))
(add-test '(1 0 1 0) '(1 0 0 1))
```

## 3.3.5

约束系统

```racket
#lang sicp

(define (make-connector)
  (let [(value false) (informant false) (constraints '())]
    (define (set-my-value newval setter)
      (cond [(not (has-value? me))
             (set! value newval)
             (set! informant setter)
             (for-each-except setter
                              inform-about-value
                              constraints)]
            [(not (= value newval))
             (error "Contradiction" (list value newval))]
            (else 'ignored)))
    (define (forget-my-value retractor)
      (if (eq? retractor informant)
          (begin (set! informant false)
                 (for-each-except retractor
                                  inform-about-no-value
                                  constraints))
          'ignored))
    (define (connect new-constraint)
      (if (not (memq new-constraint constraints))
          (set! constraints
                (cons new-constraint constraints)))
      (if (has-value? me)
          (inform-about-value new-constraint))
      'done)
    (define (me request)
      (cond [(eq? request 'has-value?)
             (if informant true false)]
            [(eq? request 'value) value]
            [(eq? request 'set-value!) set-my-value]
            [(eq? request 'forget) forget-my-value]
            [(eq? request 'connect) connect]
            (else (error "Unknown operation -- CONNECTOR" request))))
    me))

(define (for-each-except exception procedure list)
  (define (loop items)
    (cond ((null? items) 'done)
          ((eq? (car items) exception) (loop (cdr items)))
          (else (procedure (car items))
                (loop (cdr items)))))
  (loop list))

(define (has-value? connector)
  (connector 'has-value?))

(define (get-value connector)
  (connector 'value))

(define (set-value! connector new-value informant)
  ((connector 'set-value!) new-value informant))

(define (forget-value! connector retractor)
  ((connector 'forget) retractor))

(define (connect connector new-constraint)
  ((connector 'connect) new-constraint))

(define (inform-about-value constraint)
  (constraint 'I-have-a-value))

(define (inform-about-no-value constraint)
  (constraint 'I-lost-my-value))

(define (adder a1 a2 sum)
  (define (process-new-value)
    (cond ((and (has-value? a1) (has-value? a2))
           (set-value! sum
                       (+ (get-value a1) (get-value a2))
                       me))
          ((and (has-value? a1) (has-value? sum))
           (set-value! a2
                       (- (get-value sum) (get-value a1))
                       me))
          ((and (has-value? a2) (has-value? sum))
           (set-value! a1
                       (- (get-value sum) (get-value a2))
                       me))))
  (define (process-forget-value)
    (forget-value! sum me)
    (forget-value! a1 me)
    (forget-value! a2 me)
    (process-new-value))
  (define (me request)
    (cond ((eq? request 'I-have-a-value)
           (process-new-value))
          ((eq? request 'I-lost-my-value)
           (process-forget-value))
          (else
           (error "Unknown request -- ADDER" request))))
  (connect a1 me)
  (connect a2 me)
  (connect sum me)
  me)

(define (multiplier m1 m2 product)
  (define (process-new-value)
    (cond ((or (and (has-value? m1) (= (get-value m1) 0))
               (and (has-value? m2) (= (get-value m2) 0)))
           (set-value! product 0 me))
          ((and (has-value? m1) (has-value? m2))
           (set-value! product
                       (* (get-value m1) (get-value m2))
                       me))
          ((and (has-value? product) (has-value? m1))
           (set-value! m2
                       (/ (get-value product) (get-value m1))
                       me))
          ((and (has-value? product) (has-value? m2))
           (set-value! m1
                       (/ (get-value product) (get-value m2))
                       me))))
  (define (process-forget-value)
    (forget-value! product me)
    (forget-value! m1 me)
    (forget-value! m2 me)
    (process-new-value))
  (define (me request)
    (cond ((eq? request 'I-have-a-value)
           (process-new-value))
          ((eq? request 'I-lost-my-value)
           (process-forget-value))
          (else
           (error "Unknown request -- MULTIPLIER" request))))
  (connect m1 me)
  (connect m2 me)
  (connect product me)
  me)

(define (constant value connector)
  (define (me request)
    (error "Unknown request -- CONSTANT" request))
  (connect connector me)
  (set-value! connector value me)
  me)

(define (probe name connector)
  (define (print-probe value)
    (newline)
    (display "Probe: ")
    (display name)
    (display " = ")
    (display value))
  (define (process-new-value)
    (print-probe (get-value connector)))
  (define (process-forget-value)
    (print-probe "?"))
  (define (me request)
    (cond ((eq? request 'I-have-a-value)
           (process-new-value))
          ((eq? request 'I-lost-my-value)
           (process-forget-value))
          (else
           (error "Unknown request -- PROBE" request))))
  (connect connector me)
  me)

;ex 3.33
(define (averager a b c)
  (let ((d (make-connector))
        (e (make-connector)))
    (constant 0.5 d)
    (adder a b e)
    (multiplier d e c))
  'done)

(define a (make-connector))
(define b (make-connector))
(define c (make-connector))

(averager a b c)
(set-value! a 3 'user)
(set-value! b 4 'user)
(get-value c)
(forget-value! b 'user)
(set-value! b 5 'user)
(get-value c)

; ex 3.35
(define (squarer a b)
  (define (process-new-value)
    (if (has-value? b)
        (if (< (get-value b) 0)
            (error "square less than 0 -- SQUARER" (get-value b))
            (set-value! a (sqrt (get-value b)) me))
        (if (has-value? a)
            (set-value! b (* (get-value a) (get-value a)) me))))
  (define (process-forget-value)
    (forget-value! a me)
    (forget-value! b me)
    (process-new-value))
  (define (me request)
    (cond ((eq? request 'I-have-a-value)
           (process-new-value))
          ((eq? request 'I-lost-my-value)
           (process-forget-value))
          (else
           (error "Unknown request -- SQUARER" request))))
  (connect a me)
  (connect b me)
  me)

(define q (make-connector))
(define w (make-connector))
(define sq (squarer q w))

(set-value! q 5 'user)
(get-value w)

(forget-value! q 'user)
(forget-value! w sq)
(set-value! w 2 'user)
(get-value q)

(forget-value! w 'user) ; 上次q也是user设置的
(set-value! q 6 'user)
(get-value w)

; ex 3.37

(define (c+ x y)
  (let ((z (make-connector)))
    (adder x y z)
    z))

(define (c* x y)
  (let ((z (make-connector)))
    (multiplier x y z)
    z))

(define (cv x)
  (let ((z (make-connector)))
    (constant x z)
    z))

(define (c- x y)
  (let ((z (make-connector)))
    (adder y z x)
    z))

(define (c/ x y)
  (let ((z (make-connector)))
    (multiplier y z x)
    z))

(define (celsius-fahreheit-converter x)
  (c+ (c* (c/ (cv 9) (cv 5))
          x)
      (cv 32)))

(define C (make-connector))
(define F (celsius-fahreheit-converter C))

(set-value! C 37 'user)
(get-value F) ;493/5=98.6
```

## 3.4

```racket
看操作系统教材更好.
```
