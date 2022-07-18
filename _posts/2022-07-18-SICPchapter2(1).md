---
layout: post
title: "SICP第二章部分习题解答(一)"
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

## 2.1

四种情况:

$d<0,\;n>0$或$d<0,\;n<0$时为$\frac{-n}{-d}$.

$d>0,\;n>0$或$d>0,\;n<0$时为$\frac{n}{d}$.

```racket
(define (make-rat n d)
  (let ((g (gcd n d)))
    (if (< d 0)
        (cons (/ (- n) g) (/ (- d) g))
        (cons (/ n g) (/ d g)))))
```

## 2.2

```racket
#lang racket

(define (make-point x y)
  (cons x y))

(define (x-point p)
  (car p))

(define (y-point p)
  (cdr p))

(define (print-point p)
  (display "(")
  (display (x-point p))
  (display ",")
  (display (y-point p))
  (display ")")
  (newline))

(define (make-segment st ed)
  (cons st ed))

(define (start-segment seg)
  (car seg))

(define (end-segment seg)
  (cdr seg))

(define (midpoint-segment seg)
  (let ((st (start-segment seg))
        (ed (end-segment seg)))
    (make-point
     (/ (+ (x-point st)
           (x-point ed))
        2.)
     (/ (+ (y-point st)
           (y-point ed))
        2.))))

(define s (make-segment (make-point 1 2) (make-point 3 4)))
(print-point (midpoint-segment s))
```

## 2.3

wiki上有个答案实现了可以斜着的矩形表示，我觉得类似旋转这些变换应该让更上一个层次实现.

本来想坚持用`#lang sicp`，但稍微翻了下文档发现`racket`实在太香了.

```racket
#lang racket

(require racket/match)
(require racket/list)

(define (make-point x y)
  (cons x y))

(define (x-point p)
  (car p))

(define (y-point p)
  (cdr p))

(define make-rectangle
  (case-lambda
    [(st ed) (list 'type1 st ed)]           ;左下角,右上角
    [(st wi hi) (list 'type2 st wi hi)]))   ;左下角,宽,高

(define (get-rect-type rect)
  (car rect))

(define (get-rect-st rect)
  (list-ref rect 1))

(define (get-rect-ed rect)
  (if (equal? (get-rect-type rect) 'type1)
      (list-ref rect 2)
      (match-let ([(list st le wi) (rest rect)])
        (make-point (+ (x-point st) le)
                    (+ (y-point st) wi)))))

(define (get-rect-wi rect)
  (if (equal? (get-rect-type rect) 'type1)
      (match-let ([(list st ed) (rest rect)])
        (- (x-point ed) (x-point st)))
      (list-ref rect 2)))

(define (get-rect-hi rect)
  (if (equal? (get-rect-type rect) 'type1)
      (match-let ([(list st ed) (rest rect)])
        (- (y-point ed) (y-point st)))
      (list-ref rect 3)))

(define (get-rect-perimeter rect)
  (* 2 (+ (get-rect-wi rect) (get-rect-hi rect))))

(define (get-rect-area rect)
  (* (get-rect-wi rect)
     (get-rect-hi rect)))

(define rect1 (make-rectangle (make-point (- 1) (- 1)) (make-point 3 1)))
(define rect2 (make-rectangle (make-point (- 1) (- 1)) 4 2))
(define rect3 (make-rectangle (make-point 0 0) (make-point 3 4)))
(define rect4 (make-rectangle (make-point 0 0) 3 4))

(get-rect-perimeter rect1)
(get-rect-perimeter rect2)
(get-rect-area rect1)
(get-rect-area rect2)
(newline)
(get-rect-perimeter rect3)
(get-rect-perimeter rect4)
(get-rect-area rect3)
(get-rect-area rect4)
```

## 2.5

```racket
#lang sicp

(define (square x) (* x x))
(define (fast-expt b n) 
  (define (iter N B A) 
    (cond ((= 0 N) A) 
          ((even? N) (iter (/ N 2) (square B) A)) 
          (else (iter (- N 1) B (* B A))))) 
  (iter n b 1)) 

(define (cons a b)
  (* (fast-expt 2 a) (fast-expt 3 b)))

(define (car p)
  (letrec ((iter 
         (lambda (n cnt) 
           (if (= 0 (modulo n 2))
               (iter (/ n 2) (inc cnt))
               cnt))))
    (iter p 0.)))

(define (cdr p)
  (ceiling (/ (log (/ p (fast-expt 2 (car p)))) (log 3))))

(car (cons 11 17))
(cdr (cons 11 17))
(car (cons 12 34))
(cdr (cons 12 34))
```

## 2.6

```racket
#lang sicp
(define (square x) (* x x))
(define zero (lambda (f) (lambda (x) x)))
(define (add-1 n)
  (lambda (f) (lambda (x) (f ((n f) x)))))
(define one (lambda (f) (lambda (x) (f x))))
(define two (lambda (f) (lambda (x) (f (f x)))))
(define +
  (lambda args (lambda (f) 
                 (lambda (x)
                   (letrec ((tr (lambda (l x) 
                               (if (null? l)
                                   x
                                   (tr (cdr l) (((car l) f) x))))))
                     (tr args x))))))
(((+ one one) inc) 0) ;2
(((+ one two) inc) 0) ;3
(((+ one two one) inc) 0) ;4
(((+ two two two) inc) 0) ;6
((one square) 2) ;4
((two square) 2) ;16
(((+ two one) square) 2) ;2^(2^(1+2))=256
```

[wiki](http://community.schemewiki.org/?sicp-ex-2.6)里`alexh`的答案的说明很好.

## 2.7-2.16

和[区间算术](https://en.wikipedia.org/wiki/Interval_arithmetic#Dependency_problem)有关，不是本书重点，略.

## 2.17, 2.18

```racket
(define (last-pair lst)
  (if (null? (cdr lst))
      lst
      (last-pair (cdr lst))))

(define (reverse lst)
  (if (null? lst)
      '()
      (append (reverse (cdr lst)) (list (car lst)))))
```

## 2.19

```racket
(define (no-more? lst)
  (null? lst))
(define (except-first-denomination lst)
  (cdr lst))
(define (first-denomination lst)
  (car lst))
```

## 2.20

```racket
#lang sicp

(define (same-parity 1st . rest)
  (letrec ((flag (modulo 1st 2))
           (filter (lambda (rest res)
                     (if (null? rest)
                         (append (list 1st) res)
                         (filter (cdr rest)
                                 (if (= (modulo (car rest) 2) flag)
                                     (append res (list (car rest)))
                                     res))))))
    (filter rest '())))
(same-parity 1 2 3 4 5 6 7) ;(1 3 5 7)
(same-parity 2 3 4 5 6 7) ;(2 4 6)

(define (same-parity2 1st . rest)
  (letrec ((flag (modulo 1st 2))
           (filter (lambda (rest res)
                     (if (null? rest)
                         res
                         (filter (cdr rest)
                                 (if (= (modulo (car rest) 2) flag)
                                     (cons (car rest) res)
                                     res))))))
    (reverse (filter rest (list 1st)))))
(same-parity2 1 2 3 4 5 6 7) ;(1 3 5 7)
(same-parity2 2 3 4 5 6 7) ;(2 4 6)
```

## 2.21

```racket
#lang sicp
(define (square x) (* x x))
(define (square-list items)
  (if (null? items)
      nil
      (cons (square (car items)) (square-list (cdr items)))))

(define (square-list2 items)
  (map square items))
```

## 2.23

```racket
(define (for-each proc items)
  (cond ((not (null? items))
             (proc (car items))
             (for-each proc (cdr items)))))
```

## 2.25

```racket
(car (cdaddr '(1 3 (5 7) 9)))
(caar '((7)))
(car (cadadr (cadadr (cadadr '(1 (2 (3 (4 (5 (6 (7)))))))))))
```

## 2.27

```racket
(define (deep-reverse lst)
  (define (iter ans ls)
    (cond ((null? ls) ans)
          ((not (list? ls)) ls)
          (else (iter (cons (deep-reverse (car ls)) ans) (cdr ls)))))
  (iter '() lst))
```

这个更好看:

```racket
(define (deep-reverse t)
  (if (pair? t)
      (reverse (map deep-reverse t))
      t))
```

## 2.28

```racket
(define (fringe tr)
  (cond ((null? tr) '())
        ((not (pair? tr)) (list tr))
        (else (append (fringe (car tr))
                      (fringe (cdr tr))))))

(define (fringe2 tr)
  (define (loop t acc)
    (cond ((null? t) acc)
          ((pair? t) (loop (car t) (loop (cdr t) acc)))
          (else (cons t acc))))
  (loop tr '()))
```

## 2.29

试了wiki里的几个例子，应该是对的吧，写得头都晕了.

(d)只要把两个`cadr`改成`cdr`就行了.

```racket
#lang racket

(define (make-mobile left right) (list left right))
(define (make-branch len structure) (list len structure))
(define (left-branch m) (car m))
(define (right-branch m) (cadr m))
; (cdr '((2 3) (2 3))) -> ((2 3) '())
(define (branch-length b) (car b))
(define (branch-structure b) (cadr b))

(define (branch? x)
  (not (pair? (car x))))

(define (total-weight x)
  (cond ((null? x) 0)
        ((branch? x)
         (if (not (pair? (right-branch x)))
             (branch-structure x)
             (total-weight (right-branch x))))
        (else (+ (total-weight (left-branch x))
                 (total-weight (right-branch x))))))

(define (total-weight2 x)
  (cond ((null? x) 0)
        ((not (pair? x)) x)
        (else (+ (total-weight2 (branch-structure (left-branch x)))
                 (total-weight2 (branch-structure (right-branch x)))))))

(define (balanced? m)
  (cond ((null? m) #t)
        ((not (pair? m)) #t)
        (else (and (= (torque (left-branch m)) (torque (right-branch m)))
                   (balanced? (left-branch m))
                   (balanced? (right-branch m))))))

(define (torque x)
  (cond ((and (pair? x) (not (pair? (left-branch x))) (not (pair? (right-branch x))))
         (* (branch-length x) (branch-structure x)))
        ((and (pair? x) (not (pair? (left-branch x))) (pair? (right-branch x)))
         (* (branch-length x) (total-weight x)))
        (else 0)))
```

## 2.30

```racket
#lang sicp
(define (square x) (* x x))

(define (square-tree tree)
  (cond ((null? tree) nil)
        ((not (pair? tree)) (square tree))
        (else (cons (square-tree (car tree))
                    (square-tree (cdr tree))))))

(define (square-tree2 tree)
  (map (lambda (sub-tree)
         (if (pair? sub-tree)
             (square-tree2 sub-tree)
             (square sub-tree)))
       tree))
```

## 2.31

```racket
(define (square x) (* x x))
(define (tree-map proc tree)
  (cond ((null? tree) '())
        ((not (pair? tree)) (proc tree))
        (else (cons (tree-map proc (car tree))
                    (tree-map proc (cdr tree))))))
(define (sqt tree) (tree-map square tree))
(sqt '(1 (2 (3 4) 5) (6 7)))
```

## 2.32

设除去第一个元素s1的集合为S',则集合S的子集等于S'的子集加上s1加入S'的各个子集的集合；然后递归进去...

```racket
#lang sicp
(define (subsets s)
  (if (null? s)
      (list nil)
      (let ((Rest (subsets (cdr s))))
        (append Rest (map 
                      (lambda(x) (cons (car s) x)) 
                      Rest)))))
(subsets '(1 2 3))
"(() 
  (3) 
  (2) (2 3) 
  (1) (1 3) (1 2) (1 2 3))"
```

## 2.33

```racket
(define (accumulate op initial sequence)
  (if (null? sequence)
      initial
      (op (car sequence)
          (accumulate op initial (cdr sequence)))))

(define (map p sequence)
  (accumulate (lambda (x y) (cons (p x) y)) nil sequence))

(define (append seq1 seq2)
  (accumulate cons seq2 seq1))

(define (length sequence)
  (accumulate (lambda (x y) (inc y)) 0 sequence))
```

## 2.34

```racket
(define (horner-eval x coefficient-sequence)
  (accumulate (lambda (this-coeff higher-terms)
                (+ (* higher-terms x) this-coeff))
              0
              coefficient-sequence))
```

## 2.35

```racket
(define (count-leaves t)
  (accumulate + 0 (map (lambda (x) (length (enumerate-tree x))) t)))

(define (count-leaves2 t)
  (accumulate +
              0
              (map (lambda (x)
                     (cond
                       ((null? x) 0)
                       ((pair? x) (count-leaves2 x))
                       (else 1)))
                   t)))
```

## 2.36

```racket
(define (accumulate-n op init seqs)
  (if (null? (car seqs))
      nil
      (cons (accumulate op init (map car seqs))
            (accumulate-n op init (map cdr seqs)))))

(define s '((1 2 3) (4 5 6) (7 8 9) (10 11 12)))
(accumulate-n + 0 s)
```

## 2.37

```racket
(define (dot-product v w)
  (accumulate + 0 (map * v w)))

(define (matrix-*-vector m v)
  (map (lambda (w) (dot-product w v)) m))

(define (transpose mat)
  (accumulate-n cons '() mat))

(define (matrix-*-matrix m n)
  (let ((cols (transpose n)))
    (map (lambda (v) (matrix-*-vector cols v)) m)))
```

## 2.39

```racket
(define (fold-right op initial sequence)
  (accumulate op initial sequence))
  
(define (fold-left op initial sequence)
  (define (iter result rest)
    (if (null? rest)
    result
    (iter (op result (car rest))
      (cdr rest))))
  (iter initial sequence))

(define (reverse1 sequence)
  (fold-right (lambda (x y)
                (fold-right cons (list x) y))
              nil
              sequence))

(define (reverse2 sequence)
  (fold-left (lambda (x y) (cons y x)) nil sequence))
```

## 2.40

```racket
(define (flatmap proc seq)
  (accumulate append nil (map proc seq)))

(define (unique-pairs n)
  (flatmap
    (lambda (i)
      (map (lambda (j) (list i j))
           (enumerate-interval 1 (- i 1))))
    (enumerate-interval 1 n)))
```

## 2.41

```racket
(define (unique-three n)
  (flatmap
   (lambda (k)
     (map (lambda (p) (reverse (append p (list k))))
          (flatmap
           (lambda (j)
             (map (lambda (i) (list i j))
                  (enumerate-interval 1 (- j 1))))
           (enumerate-interval 1 (- k 1)))))
   (enumerate-interval 1 n)))

(define (euqal-s-pairs s n)
  (filter (lambda (p) (= s (accumulate + 0 p)))
               (unique-three n)))
```

## 2.42

经典的八皇后问题

```racket
(define (queens board-size)
  ; 稀疏矩阵，只保存皇后的坐标
  (define empty-board '())

  ; 找到 obj=(j k)
  ; 要求positions中除obj外没有(j x)及(y k)，即都不在同一行同一列 count == 1
  ; 根据tan测试positions中没有和obj在对角线上的元素
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
         (lambda (positions) (safe? k positions))
         (flatmap
          (lambda (rest-of-queens)
            (map (lambda (new-row)
                   (adjoin-position new-row k rest-of-queens))
                 (enumerate-interval 1 board-size)))
          (queen-cols (- k 1))))))
  (queen-cols board-size))

;(safe? 8 '((3 1) (7 2) (2 3) (8 4) (5 5) (1 6) (4 7) (6 8))) ;#t

(length (queens 8)) ;92
```

## 2.2.4

为了继续用vscode, 只有自己建个窗口来画了. 然后这一节的习题`sicp-pict`的代码基本都有了, 看了下兴趣不大，略了.

- plib.rkt

```racket
#lang racket
(require racket/gui/base)
(provide app)
(define (app width height painter)
  (define frame (new frame%
                     [label "Test"]
                     [width width]
                     [height height]))
  (new canvas% [parent frame]
       [paint-callback
        (lambda (canvas dc)
          (send dc draw-bitmap (send painter get-bitmap) 0 0))])
  (send frame show #t))
```

- main.rkt

```racket
#lang racket
(require sicp-pict)
(require "plib.rkt")

(define (split p1 p2)
  (define (_split painter n)
    (if (= n 0)
        painter
        (let ((smaller (_split painter (- n 1))))
          (p1 painter (p2 smaller smaller)))))
  _split)

(define (right-split painter n)
  ((split beside below) painter n))

(define (up-split painter n)
  ((split below beside) painter n))

(define (corner-split painter n)
  (if (= n 0)
      painter
      (let ((up (up-split painter (- n 1)))
            (right (right-split painter (- n 1))))
        (let ((top-left (beside up up))
              (bottom-right (below right right))
              (corner (corner-split painter (- n 1))))
          (beside (below painter top-left)
                  (below bottom-right corner))))))

(define (square-of-four tl tr bl br)
  (lambda (painter)
    (let ((top (beside (tl painter) (tr painter)))
          (bottom (beside (bl painter) (br painter))))
      (below bottom top))))

(define (square-limit painter n)
  (let ((combine4 (square-of-four flip-horiz identity
                                  rotate180 flip-vert)))
    (combine4 (corner-split painter n))))

(define (painter)
  ;(paint (segments->painter (list (segment (vect .0 1) (vect 1 .0)))))
  (paint (square-limit einstein 2)))

(app 800 600 (painter))
```
